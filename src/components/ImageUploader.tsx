// components/ImageUploader.tsx
import React, { useState, useRef } from 'react';

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
  buttonText = "画像をアップロード",
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    // アップロード処理の開始
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // FormDataの作成
      const formData = new FormData();
      formData.append('image', file);
      
      // XHRを使用して進捗を取得
      const xhr = new XMLHttpRequest();
      
      // アップロード進捗の監視
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // レスポンス処理
      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            onUploadComplete(response.image_url);
          } catch (error) {
            console.error('レスポース解析エラー:', error);
            onUploadError('アップロード結果の処理に失敗しました');
          }
        } else {
          let errorMessage = '画像のアップロードに失敗しました';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error) {
              errorMessage = errorResponse.error;
            }
          } catch (e) {
            // エラーレスポンスのパースに失敗した場合は無視
          }
          onUploadError(errorMessage);
        }
        setIsUploading(false);
        setUploadProgress(0);
        
        // ファイル入力をリセット
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      // エラー処理
      xhr.onerror = () => {
        onUploadError('ネットワークエラーが発生しました');
        setIsUploading(false);
        setUploadProgress(0);
        
        // ファイル入力をリセット
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      // リクエストの送信
      xhr.open('POST', `/api/floors/${floorId}/image`, true);
      xhr.send(formData);
      
    } catch (error) {
      console.error('アップロードエラー:', error);
      onUploadError('画像のアップロード中にエラーが発生しました');
      setIsUploading(false);
      setUploadProgress(0);
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
        disabled={isUploading}
      />
      
      {isUploading ? (
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
          {currentImageUrl ? '画像を変更' : buttonText}
        </button>
      )}
    </div>
  );
};

export default ImageUploader;