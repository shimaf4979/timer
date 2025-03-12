// components/PinInfo.tsx
import React from 'react';
import { Pin, Floor } from '@/types/map-types';

interface PinInfoProps {
  pin: Pin;
  floors: Floor[];
  isEditable?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void; // モーダルを閉じるための関数を追加
}

const PinInfo: React.FC<PinInfoProps> = ({ 
  pin, 
  floors, 
  isEditable = false, 
  onEdit, 
  onDelete,
  onClose
}) => {
  // ピンが属するエリアを特定
  const floorName = floors.find(floor => floor.id === pin.floor_id)?.name || '不明なエリア';

  // 削除処理の調整
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 削除ハンドラーが設定されている場合は呼び出す
    if (onDelete) {
      onDelete();
    }
    
    // 操作後にモーダルを閉じる
    if (onClose) {
      onClose();
    }
  };

  // 編集処理の調整
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onEdit) {
      onEdit();
    }
    // 編集モードに切り替えるときはモーダルを閉じない
  };

// components/PinInfo.tsx の編集部分

return (
  <div>
    <div className="mb-4 flex flex-wrap gap-2">
      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
        {floorName}
      </span>
      
      {/* 編集者情報を表示 - 常に表示 */}
      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        作成者: {pin.editor_nickname || "不明な編集者"}
      </span>
    </div>
    
    <div className="prose max-w-none mb-6">
      <p className="text-gray-700 whitespace-pre-line">{pin.description}</p>
    </div>
    
    {isEditable && (
      <div className="flex justify-end space-x-2">
        {onDelete && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            type="button"
            data-pin-id={pin.id}
          >
            削除
          </button>
        )}
        {onEdit && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            type="button"
          >
            編集
          </button>
        )}
      </div>
    )}
  </div>
)};


export default PinInfo;