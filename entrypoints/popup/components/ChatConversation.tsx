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
  
  return (
    <div className={`border border-gray-200 rounded-lg ${conversation.isActive ? 'border-black' : ''}`}>
      {/* Conversation Header */}
      <div 
        className={`
          p-3 bg-gray-50 rounded-t-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200
          ${conversation.isActive ? 'bg-gray-100' : ''}
        `}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${conversation.isActive ? 'bg-black' : 'bg-gray-400'}`}></div>
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {conversation.title}
              </h3>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {messageCount} {messageCount === 1 ? 'message' : 'messages'}
              </span>
            </div>
            {isCollapsed && lastMessage && (
              <p className="text-xs text-gray-600 mt-1 truncate">
                {lastMessage.type === 'ai' ? '🤖 ' : '👤 '}
                {lastMessage.content.substring(0, 60)}
                {lastMessage.content.length > 60 ? '...' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {conversation.timestamp.toLocaleDateString()}
            </span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
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
        <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
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