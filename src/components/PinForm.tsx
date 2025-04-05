// components/PinForm.tsx
import React, { useState } from 'react';
import { Pin } from '@/types/map-types';
import ImageUploader from './ImageUploader';
import { getCloudinaryPublicId, deleteCloudinaryImage } from '@/utils/cloudinaryUploader';

interface PinFormProps {
  initialData: Partial<Pin>;
  onSubmit: (data: Partial<Pin>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PinForm: React.FC<PinFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Pin>>(initialData);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // 画像アップロード成功時の処理
  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    setUploadError(null);
  };

  // 画像削除の処理
  const handleImageRemove = async () => {
    if (!formData.image_url) return;
    
    // 現在の画像のpublic_idを取得
    const publicId = getCloudinaryPublicId(formData.image_url);
    if (publicId) {
      try {
        // Cloudinaryから画像を削除
        await deleteCloudinaryImage(publicId);
      } catch (error) {
        console.error('画像削除エラー:', error);
      }
    }
    
    // フォームデータから画像URLを削除
    setFormData(prev => ({ ...prev, image_url: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          タイトル
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="タイトルを入力してください"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="説明を入力してください"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          画像
        </label>
        <div className="flex items-center space-x-2">
          <ImageUploader
            onUploadComplete={handleImageUpload}
            onUploadError={(error) => setUploadError(error)}
            currentImageUrl={formData.image_url}
            buttonText="画像をアップロード"
            folder="pin_images"
          />
          
          {formData.image_url && (
            <button
              type="button"
              onClick={handleImageRemove}
              className="px-3 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600"
            >
              削除
            </button>
          )}
        </div>
        
        {uploadError && (
          <p className="mt-1 text-sm text-red-600">{uploadError}</p>
        )}
        
        {formData.image_url && (
          <div className="mt-2">
            <img
              src={formData.image_url}
              alt="プレビュー"
              className="h-32 w-auto object-cover rounded-md"
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
};

export default PinForm;