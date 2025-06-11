import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  placeholder = "Ask a follow-up question...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200/60 p-4 bg-white/30 backdrop-blur-sm">
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="w-full px-4 py-3 bg-white/80 border border-gray-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-xs resize-none transition-all duration-200 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed backdrop-blur-sm shadow-sm"
            style={{ maxHeight: '120px' }}
          />
          {message.trim() && (
            <div className="absolute right-4 top-4">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="text-white p-3 rounded-2xl transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex-shrink-0 shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none disabled:opacity-60"
          style={{
            background: (!message.trim() || isLoading || disabled) 
              ? '#9ca3af' 
              : 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
          }}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-600">
          Enter to send, Shift+Enter for new line
        </p>
      </div>
    </form>
  );
}; 