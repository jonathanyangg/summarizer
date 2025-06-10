import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  onMessageSent?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  placeholder = "Ask a follow-up question...",
  disabled = false,
  onMessageSent
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      onMessageSent?.();
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
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-2 bg-white">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-xs resize-none transition-all duration-200 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ maxHeight: '80px' }}
          />
          {message.trim() && (
            <div className="absolute right-2 top-2">
              <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="bg-black hover:bg-gray-900 disabled:bg-gray-300 text-white p-2 rounded-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
        >
          {isLoading ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-500">
          Enter to send, Shift+Enter for new line
        </p>
        {message.length > 0 && (
          <span className="text-xs text-gray-400">
            {message.length}
          </span>
        )}
      </div>
    </form>
  );
}; 