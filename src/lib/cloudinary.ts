// lib/cloudinary.ts
import { CloudinaryAPI } from './api-client';

// Cloudinaryの設定
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

interface UploadOptions {
  file: File;
  folder?: string;
  onProgress?: (progress: number) => void;
  token: string;
}

interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * 画像をCloudinaryにアップロード
 */
export async function uploadImage({ file, folder = 'map_images', onProgress, token }: UploadOptions): Promise<UploadResult> {
  if (!token) {
    throw new Error('認証が必要です');
  }

  try {
    // 進捗状況を更新する関数
    if (onProgress) {
      onProgress(10); // 初期進捗
    }
    
    // API経由でアップロード
    const response = await CloudinaryAPI.uploadImage(file, folder, token);
    
    if (onProgress) {
      onProgress(100); // 完了
    }
    
    return {
      url: response.url,
      publicId: response.public_id
    };
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    throw new Error(error instanceof Error ? error.message : '画像のアップロードに失敗しました');
  }
}

/**
 * Cloudinary画像URLからパブリックIDを抽出
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const urlPattern = new RegExp(`${CLOUDINARY_CLOUD_NAME}/image/upload/(?:v\\d+/)?([^/]+)(?:\\.[a-zA-Z0-9]+)?$`);
    const match = url.match(urlPattern);
    return match ? match[1] : null;
  } catch (error) {
    console.error('公開ID抽出エラー:', error);
    return null;
  }
}

/**
 * Cloudinaryの画像を削除
 */
export async function deleteImage(publicId: string, token: string): Promise<boolean> {
  if (!publicId || !token) return false;
  
  try {
    await CloudinaryAPI.deleteImage(publicId, token);
    return true;
  } catch (error) {
    console.error('画像削除エラー:', error);
    return false;
  }
}

/**
 * 画像URLを最適化（webp変換、サイズ指定）
 */
export function optimizeImageUrl(url: string, { width, height, quality = 'auto' }: {
  width?: number;
  height?: number;
  quality?: string | number;
} = {}): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  try {
    // 既存のtransformationを削除
    const baseUrl = url.replace(/\/[^\/]+\/upload\/(?:v\d+\/)?/, '/');
    
    // 新しいtransformationを追加
    const transformations = ['f_auto'];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    
    // 画質設定
    transformations.push(`q_${quality}`);
    
    // URLを再構築
    const transformationString = transformations.join(',');
    const optimizedUrl = baseUrl.replace('/upload/', `/upload/${transformationString}/`);
    
    return optimizedUrl;
  } catch (error) {
    console.error('URL最適化エラー:', error);
    return url;
  }
}