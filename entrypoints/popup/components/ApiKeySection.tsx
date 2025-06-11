import React from 'react';

interface ApiKeySectionProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onSave: () => void;
  isLoading: boolean;
  message: string;
  messageType: 'success' | 'error' | '';
  isConfigExpanded: boolean;
  onToggleExpanded: () => void;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  apiKey,
  onApiKeyChange,
  onSave,
  isLoading,
  message,
  messageType,
  isConfigExpanded,
  onToggleExpanded
}) => {
  return (
    <div className="flex-shrink-0 p-4 border-b border-gray-200/60">
      <div className="space-y-3">
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-between p-3 bg-white/60 hover:bg-white/80 rounded-xl transition-all duration-200 border border-gray-200/60 cursor-pointer backdrop-blur-sm shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${apiKey.trim() ? 'bg-green-500' : 'bg-gray-400'} shadow-sm`}></div>
            <span className="text-xs font-medium text-gray-900">
              {apiKey.trim() ? 'API Key Configured' : 'Setup Required'}
            </span>
          </div>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isConfigExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isConfigExpanded && (
          <div className="space-y-3 px-1">
            <label htmlFor="apiKey" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-xs transition-all duration-200 placeholder-gray-400 backdrop-blur-sm"
              />
              {apiKey && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
                </div>
              )}
            </div>
            
            <button
              onClick={onSave}
              disabled={isLoading}
              className="w-full text-white py-2.5 px-4 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
              style={{
                background: isLoading ? '#6b7280' : 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save API Key'
              )}
            </button>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              Get your API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-gray-900 font-medium underline decoration-gray-400 hover:decoration-gray-600 transition-colors"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mt-3 p-3 rounded-lg text-xs font-medium transition-all duration-300 backdrop-blur-sm ${
          messageType === 'success' 
            ? 'bg-green-50/80 text-green-800 border border-green-200/60' 
            : 'bg-red-50/80 text-red-800 border border-red-200/60'
        }`}>
          <div className="flex items-start gap-2">
            {messageType === 'success' ? (
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}; 