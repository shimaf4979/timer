// components/BookmarkModal.tsx
import React from 'react';
import { Pin, Floor } from '@/types/map-types';
import ImprovedModal from './ImprovedModal';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: Pin | null;
  floors: Floor[];
}

const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  pin,
  floors
}) => {
  if (!pin) return null;

  // ピンが属するエリアを特定
  const floor = floors.find(f => f.id === pin.floor_id);

  return (
    <ImprovedModal
      isOpen={isOpen}
      onClose={onClose}
      title={pin.title}
      size="md"
    >
      <div className="flex flex-col">
        {/* エリア名表示 */}
        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            {floor?.name || '不明なエリア'}
          </span>
        </div>

        {/* 画像があれば表示 */}
        {pin.image_url && (
          <div className="mb-4">
            <img
              src={pin.image_url}
              alt={pin.title}
              className="w-full h-auto rounded-lg object-cover max-h-64"
            />
          </div>
        )}

        {/* 説明文 */}
        <div className="prose prose-sm max-w-none mb-4">
          <p className="text-gray-700 whitespace-pre-line">{pin.description}</p>
        </div>

        {/* 作成者情報 */}
        {pin.editor_nickname && (
          <div className="text-xs text-gray-500 mt-auto">
            作成者: {pin.editor_nickname}
          </div>
        )}
      </div>
    </ImprovedModal>
  );
};

export default BookmarkModal;