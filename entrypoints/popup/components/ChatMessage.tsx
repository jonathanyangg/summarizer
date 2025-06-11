import React from 'react';

export interface ChatMessageData {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onCopy?: (content: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCopy }) => {
  const handleCopy = () => {
    if (onCopy && message.content) {
      onCopy(message.content);
    }
  };

  return (
    <div 
      className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
      data-message-id={message.id}
    >
      {/* Icon */}
      <div className="mb-2">
        {message.type === 'ai' ? (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{
            background: 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
          }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 bg-white/60 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-sm border border-gray-200/60">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Message Bubble */}
      <div className="max-w-[85%]">
        <div className={`
          px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm
          ${message.type === 'user' 
            ? 'text-white' 
            : 'bg-white/70 text-gray-800 backdrop-blur-sm border border-gray-200/60'
          }
        `} style={message.type === 'user' ? {
          background: 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
        } : {}}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-gray-600">Thinking...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
        
        {/* Timestamp and Copy Button */}
        <div className={`flex items-center gap-2 mt-2 text-xs text-gray-500 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.type === 'ai' && !message.isLoading && (
            <button
              onClick={handleCopy}
              className="hover:text-gray-700 cursor-pointer transition-colors duration-200 p-1 rounded-md hover:bg-white/60"
              title="Copy message"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 