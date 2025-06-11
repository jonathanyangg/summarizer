import React, { useState, useEffect, useRef } from 'react';
import { ChatConversation, ConversationData } from './ChatConversation';
import { ChatInput } from './ChatInput';
import { ChatMessageData } from './ChatMessage';

interface ChatInterfaceProps {
  apiKey: string;
  onShowMessage: (text: string, type: 'success' | 'error') => void;
  autoStart?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ apiKey, onShowMessage, autoStart = false }) => {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [collapsedConversations, setCollapsedConversations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [currentPageContent, setCurrentPageContent] = useState<{
    title: string;
    content: string;
    contentType: string;
    wordCount: number;
  } | null>(null);
  const [pendingScrollToAI, setPendingScrollToAI] = useState<string | null>(null); // Track which AI message to scroll to
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to the top of a specific AI message
  const scrollToAIMessage = (messageId: string) => {
    // Find the AI message element by its ID
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement && chatContainerRef.current) {
      // Scroll to the top of the AI message
      messageElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' // This positions the element at the top of the visible area
      });
    }
  };

  // Manual retry function for when automatic retries fail
  const handleManualRetry = async () => {
    console.log('🔄 Manual retry initiated');
    setConnectionFailed(false);
    onShowMessage('Retrying connection...', 'success');
    
    // Try to reload page content first
    await loadPageContent();
    
    // If we have no conversations yet, try to generate initial summary
    if (conversations.length === 0 && currentPageContent) {
      await generateInitialSummary();
    }
  };

  // Load page content when component mounts
  useEffect(() => {
    loadPageContent();
  }, []);

  // Auto-start summary if autoStart is true
  useEffect(() => {
    if (autoStart && currentPageContent && conversations.length === 0) {
      generateInitialSummary();
    }
  }, [autoStart, currentPageContent, conversations.length]);

  // Handle pending scroll to AI message
  useEffect(() => {
    if (pendingScrollToAI) {
      // Small delay to ensure the message is rendered
      const timeoutId = setTimeout(() => {
        scrollToAIMessage(pendingScrollToAI);
        setPendingScrollToAI(null);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingScrollToAI]);

  const loadPageContent = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        console.log('❌ No active tab found');
        return;
      }

      console.log(`📡 Attempting to load page content (attempt ${retryCount + 1}/${maxRetries + 1})`);

      const response = await browser.tabs.sendMessage(tab.id, {
        type: 'GET_PAGE_CONTENT'
      });

      if (response?.success) {
        console.log('✅ Page content loaded successfully');
        setCurrentPageContent({
          title: response.title || 'Untitled',
          content: response.content || '',
          contentType: response.contentType || 'general',
          wordCount: response.wordCount || 0
        });
      } else {
        throw new Error(response?.error || 'Failed to get page content');
      }
    } catch (error) {
      console.error(`❌ Error loading page content (attempt ${retryCount + 1}):`, error);
      
      // Check if it's a connection error
      const isConnectionError = error instanceof Error && 
        (error.message.includes('Could not establish connection') || 
         error.message.includes('Receiving end does not exist') ||
         error.message.includes('Extension context invalidated'));

      if (isConnectionError && retryCount < maxRetries) {
        console.log(`🔄 Connection error detected, retrying in ${retryDelay}ms...`);
        onShowMessage(`Connection issue, retrying... (${retryCount + 1}/${maxRetries})`, 'error');
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return loadPageContent(retryCount + 1);
      } else if (isConnectionError) {
        console.log('❌ Max retries reached for connection error');
        setConnectionFailed(true);
      } else {
        console.log('❌ Non-connection error:', error);
        onShowMessage('Error loading page content', 'error');
      }
    }
  };

  const generateInitialSummary = async (retryCount = 0) => {
    const maxRetries = 2;
    const retryDelay = 1500; // 1.5 seconds

    if (!currentPageContent) {
      await loadPageContent();
      return;
    }

    const conversationId = `conv-${Date.now()}`;
    const userMessageId = `msg-${Date.now()}-user`;
    const aiMessageId = `msg-${Date.now()}-ai`;

    // Create initial conversation with user request
    const userMessage: ChatMessageData = {
      id: userMessageId,
      type: 'user',
      content: 'Please summarize this page',
      timestamp: new Date()
    };

    const aiMessage: ChatMessageData = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    const newConversation: ConversationData = {
      id: conversationId,
      title: `Summary: ${currentPageContent.title}`,
      messages: [userMessage, aiMessage],
      timestamp: new Date(),
      isActive: true
    };

    // Mark all other conversations as inactive
    setConversations(prev => [
      newConversation,
      ...prev.map(conv => ({ ...conv, isActive: false }))
    ]);

    setIsLoading(true);

    try {
      console.log(`🤖 Generating summary (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const response = await browser.runtime.sendMessage({
        type: 'GENERATE_SUMMARY',
        content: currentPageContent.content,
        title: currentPageContent.title,
        contentType: currentPageContent.contentType,
      });

      if (response.success) {
        console.log('✅ Summary generated successfully');
        // Update the AI message with the summary
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? {
                ...conv,
                messages: conv.messages.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, content: response.summary, isLoading: false }
                    : msg
                )
              }
            : conv
        ));
      } else {
        throw new Error(response.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error(`❌ Error generating summary (attempt ${retryCount + 1}):`, error);
      
      // Check if it's a connection error
      const isConnectionError = error instanceof Error && 
        (error.message.includes('Could not establish connection') || 
         error.message.includes('Receiving end does not exist') ||
         error.message.includes('Extension context invalidated'));

      if (isConnectionError && retryCount < maxRetries) {
        console.log(`🔄 Connection error detected, retrying summary in ${retryDelay}ms...`);
        onShowMessage(`AI connection issue, retrying... (${retryCount + 1}/${maxRetries})`, 'error');
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return generateInitialSummary(retryCount + 1);
      } else {
        // Update conversation with error message
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                        content: isConnectionError 
                          ? 'Connection failed after multiple attempts. Please try refreshing the page and reopening the extension.'
                          : 'Sorry, there was an error generating the summary. Please try again.',
                      isLoading: false 
                    }
                  : msg
              )
            }
          : conv
      ));
        if (isConnectionError) {
          setConnectionFailed(true);
        } else {
      onShowMessage('Error generating summary', 'error');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageContent: string, retryCount = 0) => {
    const maxRetries = 2;
    const retryDelay = 1500; // 1.5 seconds

    const activeConversation = conversations.find(conv => conv.isActive);
    if (!activeConversation) return;

    const userMessageId = `msg-${Date.now()}-user`;
    const aiMessageId = `msg-${Date.now()}-ai`;

    const userMessage: ChatMessageData = {
      id: userMessageId,
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    const aiMessage: ChatMessageData = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    // Add messages to active conversation (only on first attempt)
    if (retryCount === 0) {
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation.id 
        ? { ...conv, messages: [...conv.messages, userMessage, aiMessage] }
        : conv
    ));

    setIsLoading(true);
    // Set up scroll to AI message when user sends a new message
    setPendingScrollToAI(aiMessageId);
    }

    try {
      console.log(`💬 Generating chat response (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // Create context from conversation history
      const conversationHistory = activeConversation.messages
        .filter(msg => !msg.isLoading)
        .map(msg => `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n\n');

      const contextualPrompt = `Based on our previous conversation about this page and the following context:

Page Title: ${currentPageContent?.title || 'Unknown'}
Page Content: ${currentPageContent?.content?.substring(0, 2000) || 'No content available'}...

Previous conversation:
${conversationHistory}

User's new question: ${messageContent}

Please provide a helpful response based on the page content and our conversation history.`;

      const response = await browser.runtime.sendMessage({
        type: 'GENERATE_CHAT_RESPONSE',
        prompt: contextualPrompt,
        userMessage: messageContent
      });

      if (response.success) {
        console.log('✅ Chat response generated successfully');
        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation.id 
            ? {
                ...conv,
                messages: conv.messages.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, content: response.response, isLoading: false }
                    : msg
                )
              }
            : conv
        ));
      } else {
        throw new Error(response.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error(`❌ Error generating chat response (attempt ${retryCount + 1}):`, error);
      
      // Check if it's a connection error
      const isConnectionError = error instanceof Error && 
        (error.message.includes('Could not establish connection') || 
         error.message.includes('Receiving end does not exist') ||
         error.message.includes('Extension context invalidated'));

      if (isConnectionError && retryCount < maxRetries) {
        console.log(`🔄 Connection error detected, retrying chat response in ${retryDelay}ms...`);
        onShowMessage(`AI connection issue, retrying... (${retryCount + 1}/${maxRetries})`, 'error');
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return handleSendMessage(messageContent, retryCount + 1);
      } else {
        // Update conversation with error message
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation.id 
          ? {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                        content: isConnectionError 
                          ? 'Connection failed after multiple attempts. Please try refreshing the page and reopening the extension.'
                          : 'Sorry, I encountered an error. Please try again.',
                      isLoading: false 
                    }
                  : msg
              )
            }
          : conv
      ));
        if (isConnectionError) {
          setConnectionFailed(true);
        } else {
      onShowMessage('Error generating response', 'error');
        }
      }
    } finally {
      // Only set loading false on first attempt or when we're not retrying
      if (retryCount === maxRetries) {
      setIsLoading(false);
      }
    }
  };

  const handleToggleConversation = (conversationId: string) => {
    setCollapsedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      onShowMessage('Message copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy message:', error);
      onShowMessage('Failed to copy message', 'error');
    }
  };

  const activeConversation = conversations.find(conv => conv.isActive);
  const inactiveConversations = conversations.filter(conv => !conv.isActive);

  // Auto-collapse older conversations when new ones are created
  useEffect(() => {
    if (conversations.length > 1) {
      const inactiveIds = conversations
        .filter(conv => !conv.isActive)
        .map(conv => conv.id);
      
      setCollapsedConversations(prev => {
        const newSet = new Set(prev);
        inactiveIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [conversations.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Content */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {connectionFailed ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xs font-medium text-gray-900 mb-2">Connection Failed</h3>
            <p className="text-xs text-gray-500 mb-4">
              Unable to connect to the page content. Try refreshing the page.
            </p>
            <button
              onClick={handleManualRetry}
              disabled={isLoading}
              className="px-4 py-2 text-white text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer transition-colors"
              style={{
                background: isLoading 
                  ? '#666666'
                  : 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
              }}
            >
              {isLoading ? 'Retrying...' : 'Retry Connection'}
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-2.5 h-2.5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xs font-medium text-gray-900 mb-1">Generating summary...</h3>
            <p className="text-xs text-gray-500">
              Please wait while we analyze this page
            </p>
          </div>
        ) : (
          <>
            {/* Active Conversation */}
            {activeConversation && (
              <ChatConversation
                conversation={activeConversation}
                isCollapsed={false}
                onToggleCollapse={() => {}} // Active conversation is never collapsed
                onCopyMessage={handleCopyMessage}
              />
            )}

            {/* Previous Conversations */}
            {inactiveConversations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span>Previous</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                {inactiveConversations.map((conversation) => (
                  <ChatConversation
                    key={conversation.id}
                    conversation={conversation}
                    isCollapsed={collapsedConversations.has(conversation.id)}
                    onToggleCollapse={() => handleToggleConversation(conversation.id)}
                    onCopyMessage={handleCopyMessage}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat Input */}
      {activeConversation && (
        <div className="flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!apiKey.trim()}
            placeholder="Ask a follow-up question..."
          />
        </div>
      )}
    </div>
  );
}; 