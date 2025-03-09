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
  const handleDelete = () => {
    if (window.confirm('このピンを削除してもよろしいですか？')) {
      if (onDelete) {
        onDelete();
      }
      // 操作後にモーダルを閉じる
      if (onClose) {
        onClose();
      }
    }
  };

  // 編集処理の調整
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
    // 編集モードに切り替えるときはモーダルを閉じない
  };

  return (
    <div>
      <div className="mb-4">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
          {floorName}
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
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              削除
            </button>
          )}
          {onEdit && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              編集
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PinInfo;