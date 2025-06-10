import React from 'react';

interface SummaryButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({ onClick, isLoading = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="fixed bottom-8 right-8 z-[10000] group"
      title={isLoading ? "Generating summary..." : "Summarize this page"}
    >
      <div className="relative">
        {/* Main button */}
        <div className={`
          w-14 h-14 rounded-2xl shadow-2xl transition-all duration-300 transform
          ${isLoading 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 scale-110' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-110 group-hover:shadow-blue-500/25'
          }
          flex items-center justify-center backdrop-blur-sm border border-white/20
        `}>
          {isLoading ? (
            <div className="relative">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            <svg className="w-7 h-7 text-white transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        {/* Pulse animation when loading */}
        {isLoading && (
          <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-400 animate-ping opacity-20"></div>
        )}

        {/* Tooltip */}
        {!isLoading && (
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
              Summarize page
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}; 