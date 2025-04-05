// components/FloorForm.tsx
'use client';

import { useState } from 'react';
import { Floor } from '@/types';

interface FloorFormProps {
  initialFloor?: Partial<Floor>;
  onSubmit: (floorData: Partial<Floor>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function FloorForm({
  initialFloor = { floor_number: 1, name: '' },
  onSubmit,
  onCancel,
  isSubmitting = false
}: FloorFormProps) {
  const [floorData, setFloorData] = useState<Partial<Floor>>(initialFloor);
  const [error, setError] = useState<string | null>(null);

  // 入力値の変更を処理
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFloorData({
        ...floorData,
        [name]: parseInt(value) || 0
      });
    } else {
      setFloorData({
        ...floorData,
        [name]: value
      });
    }
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // バリデーション
    if (!floorData.name?.trim()) {
      setError('エリア名を入力してください');
      return;
    }
    
    if (!floorData.floor_number || floorData.floor_number < 0) {
      setError('有効なエリア番号を入力してください');
      return;
    }
    
    try {
      await onSubmit(floorData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エリアの保存に失敗しました');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {/* エリア番号 */}
        <div>
          <label htmlFor="floor_number" className="block text-sm font-medium text-gray-700 mb-1">
            エリア番号 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="floor_number"
            name="floor_number"
            value={floorData.floor_number || ''}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">数字が小さいほど上位に表示されます</p>
        </div>
        
        {/* エリア名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            エリア名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={floorData.name || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="例: 1階、受付エリアなど"
            required
          />
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
          disabled={isSubmitting}
        >
          キャンセル
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : initialFloor.id ? '更新' : '追加'}
        </button>
      </div>
    </form>
  );
}