// components/ImageUploader.tsx
'use client';

import { useState, useRef } from 'react';
import { uploadImage } from '@/lib/cloudinary';

interface ImageUploaderProps {
  onUploadComplete: (imageUrl: string, publicId: string) => void;
  onUploadError?: (error: string) => void;
  currentImageUrl?: string | null;
  token: string;
  folder?: string;
  buttonText?: string;
  className?: string;
  allowedTypes?: string[];
}

export default function ImageUploader({
  onUploadComplete,
  onUploadError,
  currentImageUrl = null,
  token,
  folder = 'map_images',
  buttonText = '画像をアップロード',
  className = '',
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    
    // ファイルタイプのチェック
    if (!allowedTypes.includes(file.type)) {
      if (onUploadError) {
        onUploadError(`許可されていないファイル形式です。${allowedTypes.join(', ')}のみ対応しています。`);
      }
      return;
    }
    
    // ファイルサイズのチェック (10MB制限)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      if (onUploadError) {
        onUploadError('ファイルサイズは10MB以下にしてください。');
      }
      return;
    }
    
    // アップロード開始
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // 進捗状況の更新
      const updateProgress = (progress: number) => {
        setUploadProgress(progress);
      };
      
      // Cloudinaryへアップロード
      const result = await uploadImage({
        file,
        folder,
        onProgress: updateProgress,
        token
      });
      
      // アップロード完了
      setUploadProgress(100);
      if (onUploadComplete) {
        onUploadComplete(result.url, result.publicId);
      }
    } catch (error) {
      // エラー処理
      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : '画像のアップロードに失敗しました');
      }
    } finally {
      setIsUploading(false);
      
      // 入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={className}>
      {/* 非表示の入力要素 */}
      <input
        title="画像アップロード"
        placeholder="画像を選択"
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {isUploading ? (
        // アップロード中の表示
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">アップロード中...</span>
            <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        // アップロードボタン
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
            currentImageUrl 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {currentImageUrl ? '画像を変更' : buttonText}
        </button>
      )}
      
      {/* 現在の画像のプレビュー */}
      {currentImageUrl && !isUploading && (
        <div className="mt-2">
          <div className="relative group">
            <img 
              src={currentImageUrl} 
              alt="アップロードされた画像" 
              className="w-full h-32 object-cover rounded-md"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 bg-white text-gray-800 rounded text-xs"
              >
                変更
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}