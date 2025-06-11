import React, { useState } from 'react';
import { ChatMessage, ChatMessageData } from './ChatMessage';

export interface ConversationData {
  id: string;
  title: string;
  messages: ChatMessageData[];
  timestamp: Date;
  isActive: boolean;
}

interface ChatConversationProps {
  conversation: ConversationData;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCopyMessage: (content: string) => void;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  conversation,
  isCollapsed,
  onToggleCollapse,
  onCopyMessage
}) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const messageCount = conversation.messages.length;
  
  // For active conversations, show clean chat without header
  if (conversation.isActive) {
    return (
      <div className="space-y-3 p-4">
        {conversation.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onCopy={onCopyMessage}
          />
        ))}
      </div>
    );
  }
  
  // For inactive conversations, show with collapsible header
  return (
    <div className="border border-gray-200/60 rounded-xl bg-white/40 backdrop-blur-sm shadow-sm">
      {/* Conversation Header */}
      <div 
        className="p-3 bg-white/60 rounded-t-xl cursor-pointer hover:bg-white/80 transition-colors duration-200 backdrop-blur-sm"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 shadow-sm"></div>
              <h3 className="text-xs font-medium text-gray-900 truncate">
                {conversation.title}
              </h3>
              <span className="text-xs text-gray-600 bg-gray-200/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                {messageCount}
              </span>
            </div>
            {isCollapsed && lastMessage && (
              <p className="text-xs text-gray-600 mt-1.5 truncate">
                {lastMessage.type === 'ai' ? '🤖 ' : '👤 '}
                {lastMessage.content.substring(0, 50)}
                {lastMessage.content.length > 50 ? '...' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {conversation.timestamp.toLocaleDateString()}
            </span>
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Conversation Messages */}
      {!isCollapsed && (
        <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
          {conversation.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onCopy={onCopyMessage}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 