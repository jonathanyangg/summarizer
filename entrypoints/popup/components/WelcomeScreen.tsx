import React from 'react';

export const WelcomeScreen: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-sm">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xs font-semibold text-gray-900 mb-2">Setup Required</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Please configure your OpenAI API key above to get started
        </p>
      </div>
    </div>
  );
}; 