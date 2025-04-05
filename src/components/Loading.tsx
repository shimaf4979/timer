// components/Loading.tsx
import React from 'react';

interface LoadingProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
  progress?: number;
}

export default function Loading({
  text = '読み込み中...',
  size = 'medium',
  fullPage = false,
  progress,
}: LoadingProps) {
  // サイズに応じたスピナーのサイズを決定
  const spinnerSize = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }[size];
  
  // 進捗バーがある場合のコンテンツ
  const progressContent = progress !== undefined && (
    <div className="w-full max-w-md">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{text}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
  
  // 通常のスピナーコンテンツ
  const spinnerContent = progress === undefined && (
    <>
      <div className={`${spinnerSize} border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2`}></div>
      <p className="text-gray-600 text-center">{text}</p>
    </>
  );
  
  // フルページ表示の場合
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md">
          {progressContent || spinnerContent}
        </div>
      </div>
    );
  }
  
  // 通常表示の場合
  return (
    <div className="flex flex-col items-center justify-center p-4">
      {progressContent || spinnerContent}
    </div>
  );
}