// components/FloorSelector.tsx
import React from 'react';
import { Floor } from '@/types/map-types';

interface FloorSelectorProps {
  floors: Floor[];
  activeFloor: Floor | null;
  setActiveFloor: (floor: Floor) => void;
  onImageUpload?: (floorId: string, file: File) => Promise<void>;
  onRemove?: (floorId: string) => Promise<void>;
  isEditable?: boolean;
}

const FloorSelector: React.FC<FloorSelectorProps> = ({
  floors,
  activeFloor,
  setActiveFloor,
  onImageUpload,
  onRemove,
  isEditable = false
}) => {
  const handleFileChange = async (floorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUpload) {
      await onImageUpload(floorId, e.target.files[0]);
    }
  };

  if (floors.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        エリア情報がありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {floors.map((floor) => (
        <div 
          key={floor.id}
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
            activeFloor?.id === floor.id 
              ? 'bg-blue-100 border-l-4 border-blue-500' 
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
          onClick={() => setActiveFloor(floor)}
        >
          <div className="flex items-center">
            <div className="mr-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {floor.floor_number}
              </div>
            </div>
            <span>{floor.name}</span>
          </div>
          
          {isEditable && (
            <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(floor.id, e)}
                />
                <div className={`px-2 py-1 rounded text-xs ${
                  floor.image_url 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}>
                  {floor.image_url ? '変更' : '画像追加'}
                </div>
              </label>
              {onRemove && (
                <button
                  onClick={() => onRemove(floor.id)}
                  className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 cursor-pointer"
                >
                  削除
                </button>
              )}
            </div>
          )}
          
          {!isEditable && floor.image_url && (
            <div className="ml-auto">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FloorSelector;