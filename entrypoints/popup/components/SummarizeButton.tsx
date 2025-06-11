import React from 'react';

interface SummarizeButtonProps {
  onStartSummarize: () => void;
}

export const SummarizeButton: React.FC<SummarizeButtonProps> = ({ onStartSummarize }) => {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <button
        onClick={onStartSummarize}
        className="text-white py-4 px-8 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
        style={{
          background: 'radial-gradient(at 0% 1%, #262626 0px, transparent 50%), radial-gradient(at 97% 99%, #1f1f1f 0px, transparent 50%), #030303'
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Summarize This Page
      </button>
    </div>
  );
}; 