// components/PinEditorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Pin } from '@/types';
import Modal from './Modal';
import ImageUploader from './ImageUploader';
import { optimizeImageUrl } from '@/lib/cloudinary';

interface PinEditorModalProps {
  pin: Pin | null;
  isOpen: boolean;
  isCreating?: boolean;
  token: string;
  onClose: () => void;
  onSave: (pin: Pin) => void;
}

export default function PinEditorModal({
  pin,
  isOpen,
  isCreating = false,
  token,
  onClose,
  onSave
}: PinEditorModalProps) {
  const [editedPin, setEditedPin] = useState<Pin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ピンデータが変更されたら編集用の状態も更新
  useEffect(() => {
    if (pin) {
      setEditedPin({ ...pin });
    } else {
      setEditedPin(null);
    }
  }, [pin]);

  // 入力値変更時のハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (editedPin) {
      setEditedPin({
        ...editedPin,
        [name]: value
      });
    }
  };

  // 画像アップロード完了時のハンドラ
  const handleImageUpload = (imageUrl: string) => {
    if (editedPin) {
      setEditedPin({
        ...editedPin,
        image_url: imageUrl
      });
    }
  };

  // 保存時のハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editedPin) return;
    
    // 必須フィールドの検証
    if (!editedPin.title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      onSave(editedPin);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ピンの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!editedPin) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isCreating ? 'ピンを追加' : 'ピンを編集'} 
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={editedPin.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="タイトルを入力"
              required
            />
          </div>
          
          {/* 説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              value={editedPin.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="説明を入力"
            />
          </div>
          
          {/* 画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像
            </label>
            <div className="grid grid-cols-1 gap-4">
              {/* 現在の画像プレビュー */}
              {editedPin.image_url && (
                <div className="mb-2">
                  <img
                    src={optimizeImageUrl(editedPin.image_url, { width: 400, height: 200, quality: 'auto' })}
                    alt={editedPin.title}
                    className="max-h-40 w-auto rounded-md object-contain mx-auto"
                  />
                </div>
              )}
              
              {/* アップローダー */}
              <ImageUploader
                onUploadComplete={handleImageUpload}
                onUploadError={setError}
                currentImageUrl={editedPin.image_url}
                token={token}
                folder="pin_images"
                buttonText={editedPin.image_url ? "画像を変更" : "画像をアップロード"}
                className="flex justify-center"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : isCreating ? '追加' : '保存'}
          </button>
        </div>
      </form>
    </Modal>
  );
}