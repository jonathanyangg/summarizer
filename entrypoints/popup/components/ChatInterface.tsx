import React, { useState, useEffect, useRef } from 'react';
import { ChatConversation, ConversationData } from './ChatConversation';
import { ChatInput } from './ChatInput';
import { ChatMessageData } from './ChatMessage';

interface ChatInterfaceProps {
  apiKey: string;
  onShowMessage: (text: string, type: 'success' | 'error') => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ apiKey, onShowMessage }) => {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [collapsedConversations, setCollapsedConversations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageContent, setCurrentPageContent] = useState<{
    title: string;
    content: string;
    contentType: string;
    wordCount: number;
  } | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load page content when component mounts
  useEffect(() => {
    loadPageContent();
  }, []);

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
        onShowMessage('Summary generated successfully!', 'success');
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

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversations]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">AI Chat</span>
          </div>
          {!activeConversation && (
            <button
              onClick={generateInitialSummary}
              disabled={isLoading || !apiKey.trim()}
              className="bg-black hover:bg-gray-900 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
            >
              Start Chat
            </button>
          )}
        </div>
        {currentPageContent && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {currentPageContent.title} • {currentPageContent.wordCount} words
          </p>
        )}
      </div>

      {/* Chat Content */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-xs text-gray-500 mb-4">
              Get an AI summary of this page and ask follow-up questions
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span>Previous Conversations</span>
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
            placeholder="Ask a follow-up question about this page..."
          />
        </div>
      )}
    </div>
  );
}; 