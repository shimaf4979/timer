// components/BookmarkButton.tsx
import React, { useState } from 'react';
import BookmarkModal from './BookmarkModal';
import ImprovedModal from './ImprovedModal';
import { Pin, Floor } from '@/types/map-types';

interface BookmarkButtonProps {
  pins: Pin[];
  floors: Floor[];
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ pins, floors }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const handleOpenBookmarks = () => {
    setIsModalOpen(true);
  };

  const handleSelectPin = (pin: Pin) => {
    setSelectedPin(pin);
  };

  return (
    <>
      <button
        onClick={handleOpenBookmarks}
        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
        しおり一覧
      </button>

      {/* しおり一覧モーダル */}
      <ImprovedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="しおり一覧"
        size="md"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {pins.length > 0 ? (
            pins.map(pin => {
              const floor = floors.find(f => f.id === pin.floor_id);
              return (
                <div
                  key={pin.id}
                  className="flex items-start p-3 border-b hover:bg-gray-50 cursor-pointer rounded"
                  onClick={() => handleSelectPin(pin)}
                >
                  {pin.image_url && (
                    <div className="flex-shrink-0 w-16 h-16 mr-3">
                      <img
                        src={pin.image_url}
                        alt={pin.title}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-grow overflow-hidden">
                    <div className="font-medium text-sm truncate">{pin.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {floor?.name || '不明なエリア'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {pin.description && pin.description.length > 60
                        ? `${pin.description.substring(0, 60)}...`
                        : pin.description}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              ピンがありません
            </div>
          )}
        </div>
      </ImprovedModal>

      {/* 選択したピンの詳細モーダル */}
      <BookmarkModal
        isOpen={!!selectedPin}
        onClose={() => setSelectedPin(null)}
        pin={selectedPin}
        floors={floors}
      />
    </>
  );
};

export default BookmarkButton;