// utils/imageCache.ts

// 画像情報のグローバルキャッシュ型定義
export interface ImageInfo {
    originalWidth: number;
    originalHeight: number;
    aspectRatio: number;
    loaded: boolean;
    url: string;
  }
  
  // グローバルキャッシュ (URLをキーとする画像情報オブジェクト)
  const imageInfoCache: Record<string, ImageInfo> = {};
  
  /**
   * 画像情報をキャッシュに追加
   */
  export const addToImageCache = (
    url: string, 
    width: number, 
    height: number
  ): ImageInfo => {
    const aspectRatio = height / width;
    const imageInfo: ImageInfo = {
      originalWidth: width,
      originalHeight: height,
      aspectRatio,
      loaded: true,
      url
    };
    
    imageInfoCache[url] = imageInfo;
    return imageInfo;
  };
  
  /**
   * キャッシュから画像情報を取得
   */
  export const getFromImageCache = (url: string): ImageInfo | null => {
    return imageInfoCache[url] || null;
  };
  
  /**
   * キャッシュに画像情報が存在するか確認
   */
  export const hasImageInCache = (url: string): boolean => {
    return !!imageInfoCache[url];
  };
  
  /**
   * 画像の読み込みとキャッシュ (非同期)
   */
  export const preloadAndCacheImage = (url: string): Promise<ImageInfo> => {
    // すでにキャッシュにあれば即時返却
    if (hasImageInCache(url)) {
      return Promise.resolve(imageInfoCache[url]);
    }
    
    // 新規の画像を読み込む
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const imageInfo = addToImageCache(url, img.naturalWidth, img.naturalHeight);
        resolve(imageInfo);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  };
  
  /**
   * 全画像情報の取得
   */
  export const getAllCachedImages = (): Record<string, ImageInfo> => {
    return { ...imageInfoCache };
  };
  
  /**
   * キャッシュのクリア
   */
  export const clearImageCache = (): void => {
    Object.keys(imageInfoCache).forEach(key => {
      delete imageInfoCache[key];
    });
  };
  
  // 実装時に必要になるグローバル化
  // Next.js/React アプリ内でグローバルなアクセスを可能にする
  if (typeof window !== 'undefined') {
    (window as any).imageInfoCache = imageInfoCache;
  }
  
  export default imageInfoCache;