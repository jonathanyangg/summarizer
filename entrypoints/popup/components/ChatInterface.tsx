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

  const loadPageContent = async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      const response = await browser.tabs.sendMessage(tab.id, {
        type: 'GET_PAGE_CONTENT'
      });

      if (response?.success) {
        setCurrentPageContent({
          title: response.title || 'Untitled',
          content: response.content || '',
          contentType: response.contentType || 'general',
          wordCount: response.wordCount || 0
        });
      }
    } catch (error) {
      console.error('Error loading page content:', error);
    }
  };

  const generateInitialSummary = async () => {
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
      const response = await browser.runtime.sendMessage({
        type: 'GENERATE_SUMMARY',
        content: currentPageContent.content,
        title: currentPageContent.title,
        contentType: currentPageContent.contentType,
      });

      if (response.success) {
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
      console.error('Error generating summary:', error);
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                      content: 'Sorry, there was an error generating the summary. Please try again.',
                      isLoading: false 
                    }
                  : msg
              )
            }
          : conv
      ));
      onShowMessage('Error generating summary', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageContent: string) => {
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

    // Add messages to active conversation
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation.id 
        ? { ...conv, messages: [...conv.messages, userMessage, aiMessage] }
        : conv
    ));

    setIsLoading(true);
    
    // Set up scroll to AI message when user sends a new message
    setPendingScrollToAI(aiMessageId);

    try {
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
      console.error('Error generating chat response:', error);
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation.id 
          ? {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                      content: 'Sorry, I encountered an error. Please try again.',
                      isLoading: false 
                    }
                  : msg
              )
            }
          : conv
      ));
      onShowMessage('Error generating response', 'error');
    } finally {
      setIsLoading(false);
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
        {conversations.length === 0 ? (
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