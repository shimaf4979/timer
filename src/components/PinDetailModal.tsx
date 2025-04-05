// components/PinDetailModal.tsx
'use client';

import { useState } from 'react';
import { Pin, Floor } from '@/types';
import Modal from './Modal';
import { optimizeImageUrl } from '@/lib/cloudinary';

interface PinDetailModalProps {
  pin: Pin | null;
  floors: Floor[];
  isOpen: boolean;
  isEditable?: boolean;
  onClose: () => void;
  onEdit?: (pin: Pin) => void;
  onDelete?: (pin: Pin) => void;
}

export default function PinDetailModal({
  pin,
  floors,
  isOpen,
  isEditable = false,
  onClose,
  onEdit,
  onDelete
}: PinDetailModalProps) {
  if (!pin) return null;

  // ピンが属するエリアを取得
  const floor = floors.find(f => f.id === pin.floor_id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pin.title} size="md">
      <div className="space-y-4">
        {/* エリア情報 */}
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              {floor?.name || '不明なエリア'}
            </span>
          </div>
          
          {/* 編集者情報 */}
          {pin.editor_nickname && (
            <div className="text-xs text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              作成者: {pin.editor_nickname}
            </div>
          )}
        </div>
        
        {/* ピン画像 */}
        {pin.image_url && (
          <div className="overflow-hidden rounded-lg">
            <img
              src={optimizeImageUrl(pin.image_url, { width: 600, quality: 'auto' })}
              alt={pin.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        {/* 説明文 */}
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-line text-gray-700">{pin.description}</div>
        </div>
        
        {/* アクションボタン */}
        {isEditable && (
          <div className="flex justify-end space-x-2 pt-4">
            {onDelete && (
              <button
                onClick={() => {
                  if (onDelete) onDelete(pin);
                  onClose();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
              >
                削除
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={() => {
                  if (onEdit) onEdit(pin);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                編集
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}