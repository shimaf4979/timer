// components/PinList.tsx
import React from 'react';
import { Pin, Floor } from '@/types/map-types';

interface PinListProps {
  pins: Pin[];
  floors: Floor[];
  activeFloor: string | null;
  onPinClick: (pin: Pin) => void;
  selectedPinId?: string | null; // 選択中のピンIDを追加
}

const PinList: React.FC<PinListProps> = ({ 
  pins, 
  floors, 
  activeFloor, 
  onPinClick, 
  selectedPinId = null // デフォルトは選択なし
}) => {
  // 表示するテキストを切り詰める関数
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // エリア別にピンをフィルタリング
  const filteredPins = pins.filter(pin => pin.floor_id === activeFloor);

  // 表示するピンがない場合のメッセージ
  if (filteredPins.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-600">
          {`${floors.find(f => f.id === activeFloor)?.name || ''}のポイント`}
        </h3>
        <div className="text-center text-gray-500 py-4">
          ポイントがありません
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-2 text-gray-600">
        {`${floors.find(f => f.id === activeFloor)?.name || ''}のポイント`}
      </h3>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {filteredPins.map((pin) => {
            // ピンが属するエリアを取得
            const pinFloor = floors.find(f => f.id === pin.floor_id);
            const isSelected = selectedPinId === pin.id;
            
            // 自分のピンかどうか判定するためのローカルストレージからの情報
            const myEditorId = typeof window !== 'undefined' 
              ? localStorage.getItem(`public_edit_${pin.floor_id}_editor_id`) 
              : null;
            
            // ピンのカラーを決定（選択中、自分のピン、他人のピン）
            const pinColor = isSelected 
              ? 'bg-blue-500' 
              : pin.editor_id === myEditorId
                ? 'bg-green-500' 
                : 'bg-red-500';
            
            return (
              <button
                key={pin.id}
                onClick={() => onPinClick(pin)}
                className={`w-full text-left flex items-start py-3 px-2 border-b hover:bg-gray-50 transition-colors rounded
                           ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                data-list-pin-id={pin.id}
                data-selected={isSelected ? 'true' : 'false'}
              >
                <div className="flex-shrink-0 pt-1">
                  <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${pinColor}`}></div>
                </div>
                <div className="flex-grow overflow-hidden">
                  <div className="font-medium text-sm truncate">{pin.title}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{truncateText(pin.description, 60)}</p>
                  
                  {/* 編集者情報を常に表示 */}
                  <p className="text-xs text-gray-400 mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {pin.editor_nickname || "不明な編集者"}
                  </p>
                </div>
                {pinFloor && (
                  <div className="ml-1 text-xs text-gray-500 flex-shrink-0 pt-1 whitespace-nowrap">
                    {pinFloor.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PinList;