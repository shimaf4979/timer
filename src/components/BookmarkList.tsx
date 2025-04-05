// components/BookmarkList.tsx
'use client';

import { useState } from 'react';
import { Pin, Floor } from '@/types';
import { optimizeImageUrl } from '@/lib/cloudinary';

interface BookmarkListProps {
  pins: Pin[];
  floors: Floor[];
  activeFloorId?: string | null;
  onPinClick: (pin: Pin) => void;
  selectedPinId?: string | null;
}

export default function BookmarkList({
  pins,
  floors,
  activeFloorId,
  onPinClick,
  selectedPinId
}: BookmarkListProps) {
  const [showAllFloors, setShowAllFloors] = useState(true);
  
  // アクティブなフロアが指定されている場合、そのフロアのピンのみをフィルタリング
  const filteredPins = showAllFloors || !activeFloorId
    ? pins
    : pins.filter(pin => pin.floor_id === activeFloorId);

  // ピンがない場合のメッセージ
  if (filteredPins.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">ピンがありません</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* フィルターコントロール */}
      <div className="mb-3 px-2 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">しおり一覧</h3>
        
        <div className="text-xs">
          <button
            onClick={() => setShowAllFloors(true)}
            className={`px-2 py-1 rounded ${
              showAllFloors 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全て
          </button>
          
          <button
            onClick={() => setShowAllFloors(false)}
            className={`ml-2 px-2 py-1 rounded ${
              !showAllFloors 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={!activeFloorId}
          >
            現在のエリア
          </button>
        </div>
      </div>
      
      {/* ピンリスト */}
      <div className="space-y-1 max-h-96 overflow-y-auto px-1">
        {filteredPins.map(pin => {
          const pinFloor = floors.find(f => f.id === pin.floor_id);
          const isSelected = pin.id === selectedPinId;
          
          return (
            <div
              key={pin.id}
              className={`p-3 rounded-lg cursor-pointer border border-gray-100 ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
              }`}
              onClick={() => onPinClick(pin)}
            >
              <div className="flex items-start gap-3">
                {/* サムネイル */}
                {pin.image_url ? (
                  <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                    <img
                      src={optimizeImageUrl(pin.image_url, { width: 60, height: 60 })}
                      alt={pin.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9z" />
                    </svg>
                  </div>
                )}
                
                {/* タイトルと説明 */}
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{pin.title}</h4>
                  
                  {pin.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{pin.description}</p>
                  )}
                  
                  {/* エリア名とユーザー名 */}
                  <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      {pinFloor?.name || '不明なエリア'}
                    </span>
                    
                    {pin.editor_nickname && (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {pin.editor_nickname}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}