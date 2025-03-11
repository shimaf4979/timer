// components/LoadingIndicator.tsx
import React from 'react';

interface LoadingIndicatorProps {
  progress?: number;
  message?: string;
  isFullScreen?: boolean;
  showSpinner?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  progress,
  message = '読み込み中...',
  isFullScreen = false,
  showSpinner = true
}) => {
  const hasProgress = progress !== undefined && progress >= 0 && progress <= 100;
  
  const content = (
    <div className="flex flex-col items-center justify-center p-6">
      {showSpinner && !hasProgress && (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      )}
      
      {hasProgress && (
        <div className="w-full max-w-xs mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{message}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {!hasProgress && <p className="text-gray-600">{message}</p>}
    </div>
  );
  
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
        {content}
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center bg-white rounded-lg shadow-sm p-4">
      {content}
    </div>
  );
};

export default LoadingIndicator;