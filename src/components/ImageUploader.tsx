// components/ImageUploader.tsx
import React, { useState, useRef } from 'react';
import { useUploadFloorImage } from '@/lib/api-hooks';

interface ImageUploaderProps {
  floorId: string;
  onUploadComplete: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
  currentImageUrl?: string | null;
  buttonText?: string;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  floorId,
  onUploadComplete,
  onUploadError,
  currentImageUrl = null,
  buttonText = '画像をアップロード',
  className = '',
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TanStack Query のミューテーションフックを使用
  const uploadMutation = useUploadFloorImage(floorId, setUploadProgress);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];

    // 画像ファイルかどうかの確認
    if (!file.type.startsWith('image/')) {
      onUploadError('画像ファイルを選択してください');
      return;
    }

    try {
      // アップロードを実行
      const result = await uploadMutation.mutateAsync(file);

      // 成功時の処理
      onUploadComplete(result.image_url);

      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // エラー処理
      if (error instanceof Error) {
        onUploadError(error.message);
      } else {
        onUploadError('画像のアップロード中にエラーが発生しました');
      }

      // プログレスをリセット
      setUploadProgress(0);

      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={className}>
      <input
        title="画像アップロード"
        placeholder="画像アップロード"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploadMutation.isPending}
      />

      {uploadMutation.isPending ? (
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
            currentImageUrl
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {currentImageUrl ? '変更' : buttonText}
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
