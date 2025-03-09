// components/PinList.tsx
import React from 'react';
import { Pin, Floor } from '@/types/map-types';

interface PinListProps {
  pins: Pin[];
  floors: Floor[];
  activeFloor: string | null;
  onPinClick: (pin: Pin) => void;
  is3DView: boolean;
}

const truncateText = (text: string, maxLength: number = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const PinList: React.FC<PinListProps> = ({ 
  pins, 
  floors, 
  activeFloor, 
  onPinClick, 
  is3DView 
}) => {
  // エリア別にピンをフィルタリング
  const filteredPins = is3DView 
    ? pins 
    : pins.filter(pin => pin.floor_id === activeFloor);

  // 表示するピンがない場合のメッセージ
  if (filteredPins.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-600">
          {is3DView ? '全てのポイント' : `${floors.find(f => f.id === activeFloor)?.name || ''}のポイント`}
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
        {is3DView ? '全てのポイント' : `${floors.find(f => f.id === activeFloor)?.name || ''}のポイント`}
      </h3>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {filteredPins.map((pin) => {
            // ピンが属するエリアを取得
            const pinFloor = floors.find(f => f.id === pin.floor_id);
            
            return (
              <button
                key={pin.id}
                onClick={() => onPinClick(pin)}
                className="w-full text-left flex items-start py-3 px-2 border-b hover:bg-gray-50 transition-colors rounded"
              >
                <div className="flex-shrink-0 pt-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 flex-shrink-0"></div>
                </div>
                <div className="flex-grow overflow-hidden">
                  <div className="font-medium text-sm truncate">{pin.title}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{truncateText(pin.description, 80)}</p>
                </div>
                {is3DView && pinFloor && (
                  <div className="ml-1 text-xs text-gray-500 flex-shrink-0 pt-1">
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