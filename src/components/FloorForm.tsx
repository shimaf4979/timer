// components/FloorForm.tsx
import React, { useState } from 'react';

interface FloorFormProps {
  initialFloorNumber: number;
  onSubmit: (floorNumber: number, name: string) => Promise<void>;
  onCancel: () => void;
}

const FloorForm: React.FC<FloorFormProps> = ({
  initialFloorNumber,
  onSubmit,
  onCancel
}) => {
  const [floorNumber, setFloorNumber] = useState(initialFloorNumber);
  const [name, setName] = useState(`${initialFloorNumber}階`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(floorNumber, name);
    } catch (error) {
      console.error('エリアの追加に失敗しました:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-3 bg-gray-50 rounded-md">
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          エリア
        </label>
        <input
          title="floor-number"
          placeholder="floor-number"
          type="number"
          value={floorNumber}
          onChange={(e) => setFloorNumber(parseInt(e.target.value))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          required
          min="1"
        />
      </div>
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          名前
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="1階, 2階など"
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
          disabled={isSubmitting}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? '追加中...' : '追加'}
        </button>
      </div>
    </form>
  );
};

export default FloorForm;