// utils/cloudinaryUploader.ts
import { Cloudinary } from 'cloudinary-core';

// Cloudinaryの設定
const cloudinary = new Cloudinary({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * 画像をCloudinaryにアップロードする関数
 * @param file アップロードするファイル
 * @param folder 保存先フォルダ（任意）
 * @returns アップロードされた画像のURL
 */
export const uploadImageToCloudinary = async (
  file: File,
  folder = 'map_images'
): Promise<string> => {
  try {
    // FormDataを作成
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
    formData.append('folder', folder);
    
    // 画像圧縮とwebp変換のオプションを追加
    formData.append('quality', 'auto');
    formData.append('fetch_format', 'webp');
    
    // Cloudinary APIにアップロード
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error('画像のアップロードに失敗しました');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinaryアップロードエラー:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
};

/**
 * Cloudinaryの画像URLからIDを抽出する関数
 * @param url Cloudinary画像URL
 * @returns 画像ID
 */
export const getCloudinaryPublicId = (url: string): string | null => {
  try {
    // URLからpublic_idを抽出するための正規表現
    const regex = /\/([^/]+)\.[a-zA-Z0-9]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

/**
 * Cloudinaryの画像を削除する関数
 * @param publicId 削除する画像のpublic_id
 */
export const deleteCloudinaryImage = async (publicId: string): Promise<boolean> => {
  try {
    // サーバーサイドでAPIを呼び出す必要があるため、APIルートを呼び出す
    const response = await fetch('/api/delete-image', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicId })
    });
    
    if (!response.ok) {
      throw new Error('画像の削除に失敗しました');
    }
    
    return true;
  } catch (error) {
    console.error('画像削除エラー:', error);
    return false;
  }
};