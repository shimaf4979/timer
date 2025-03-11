// components/ImprovedModal.tsx
import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ImprovedModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // モーダルが開いている時はボディのスクロールを無効にする
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // モーダルが閉じているときは何も表示しない
  if (!isOpen) return null;

  // サイズに基づいてクラス名を設定
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* 半透明の背景オーバーレイ */}
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm transition-opacity"></div>
      
      {/* モーダルコンテンツ */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          ref={contentRef}
          className={`relative rounded-lg bg-white shadow-xl transform transition-all sm:my-8 sm:w-full ${sizeClasses[size]} animate-modal-appear`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* モーダルヘッダー（タイトルがある場合のみ表示） */}
          {title && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">閉じる</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* モーダル本文 */}
          <div className="px-4 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedModal;