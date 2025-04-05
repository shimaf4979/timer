// components/Modal.tsx
'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    // モーダルが開いている間はスクロールを無効化
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // オーバーレイクリックでモーダルを閉じる
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (overlayRef.current === e.target) {
      onClose();
    }
  };

  // サイズクラスの設定
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={handleOverlayClick}
      ></div>
      
      {/* モーダルコンテンツ */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          ref={contentRef}
          className={`relative rounded-lg bg-white shadow-xl transform transition-all ${sizeClasses[size]} w-full animate-fade-in`}
        >
          {/* ヘッダー (タイトルがある場合) */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-medium text-gray-900">{title}</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">閉じる</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* モーダル本文 */}
          <div className={title ? 'p-6' : 'p-6'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}