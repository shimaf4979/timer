// components/DeleteConfirmationModal.tsx
'use client';

import Modal from './Modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  itemName,
  confirmText = '削除する',
  cancelText = 'キャンセル',
  isDangerous = true,
  isDeleting = false,
  onClose,
  onConfirm
}: DeleteConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-gray-700 mb-4">
            {message}
          </p>
          
          {itemName && (
            <p className="text-sm font-medium text-gray-900 mb-4">
              「{itemName}」
            </p>
          )}
          
          <div className="mt-4 flex justify-center space-x-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
              onClick={onClose}
              disabled={isDeleting}
            >
              {cancelText}
            </button>
            
            <button
              type="button"
              className={`px-4 py-2 text-white rounded-md focus:outline-none ${
                isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              } ${isDeleting ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}