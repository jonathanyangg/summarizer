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
      className="fixed right-6 top-1/2 transform -translate-y-1/2 z-[10000] group"
      title={isLoading ? "Generating summary..." : "Summarize this page"}
    >
      <div className="relative">
        {/* Main button */}
        <div className={`
          w-12 h-12 rounded-xl shadow-lg transition-all duration-300 transform
          ${isLoading 
            ? 'bg-gray-800 scale-105' 
            : 'bg-black hover:bg-gray-800 hover:scale-105'
          }
          flex items-center justify-center border border-gray-200
        `}>
          {isLoading ? (
            <div className="relative">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            <svg className="w-6 h-6 text-white transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        {/* Pulse animation when loading */}
        {isLoading && (
          <div className="absolute inset-0 w-12 h-12 rounded-xl bg-gray-600 animate-ping opacity-20"></div>
        )}

        {/* Tooltip */}
        {!isLoading && (
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-black text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
              Summarize page
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-black"></div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}; 