// utils/imagePositionUtils.ts

/**
 * 画像に対するクリック位置を正規化する
 * 画像表示サイズとオリジナルサイズの違いを考慮して正確な位置を計算
 */
export const normalizeImagePosition = (
    e: React.MouseEvent<HTMLElement>,
    containerRef: React.RefObject<HTMLElement>,
    imageSrc?: string
  ): { x: number, y: number } | null => {
    if (!containerRef.current) return null;
    
    // コンテナ内の画像要素を取得
    const imageElement = containerRef.current.querySelector('img');
    if (!imageElement) return null;
    
    // コンテナと画像の実際の表示サイズを取得
    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageElement.getBoundingClientRect();
    
    // クリック位置を取得 (コンテナ相対)
    const clickX = e.clientX - containerRect.left;
    const clickY = e.clientY - containerRect.top;
    
    // 画像の表示オフセットを計算 (コンテナの中央に表示されている場合)
    const imageOffsetX = (containerRect.width - imageRect.width) / 2;
    const imageOffsetY = (containerRect.height - imageRect.height) / 2;
    
    // 画像領域外のクリックなら null を返す
    if (
      clickX < imageOffsetX || 
      clickX > imageOffsetX + imageRect.width || 
      clickY < imageOffsetY || 
      clickY > imageOffsetY + imageRect.height
    ) {
      return null;
    }
    
    // 画像内でのクリック位置を計算
    const imageClickX = clickX - imageOffsetX;
    const imageClickY = clickY - imageOffsetY;
    
    // 画像内でのパーセンテージ位置を計算
    const xPercent = (imageClickX / imageRect.width) * 100;
    const yPercent = (imageClickY / imageRect.height) * 100;
    
    return {
      x: xPercent,
      y: yPercent
    };
  };
  
  /**
   * 画像のアスペクト比を計算するユーティリティ
   */
  export const calculateAspectRatio = (width: number, height: number): number => {
    return height / width;
  };
  
  /**
   * 画像情報をデータ属性から取得
   */
  export const getImageInfoFromElement = (element: HTMLElement): {
    originalWidth?: number;
    originalHeight?: number;
    aspectRatio?: number;
  } => {
    // data-original-width, data-original-height, data-aspect-ratio を取得
    const originalWidth = element.dataset.originalWidth ? 
      parseFloat(element.dataset.originalWidth) : undefined;
    
    const originalHeight = element.dataset.originalHeight ? 
      parseFloat(element.dataset.originalHeight) : undefined;
    
    const aspectRatio = element.dataset.aspectRatio ? 
      parseFloat(element.dataset.aspectRatio) : undefined;
    
    return {
      originalWidth,
      originalHeight,
      aspectRatio
    };
  };
  
  /**
   * 画像情報をグローバルキャッシュから取得
   */
  export const getImageInfoFromCache = (
    imageSrc: string
  ): {
    originalWidth?: number;
    originalHeight?: number;
    aspectRatio?: number;
  } => {
    // グローバルな画像情報キャッシュにアクセス
    // @ts-ignore - この変数は ResponsiveImage コンポーネントで定義
    const imageInfoCache = window.imageInfoCache || {};
    
    if (imageInfoCache[imageSrc]) {
      return imageInfoCache[imageSrc];
    }
    
    return {};
  };
  
  // オブザーバーを使って画像のリサイズを監視するユーティリティ
  export const observeImageContainer = (
    containerRef: React.RefObject<HTMLElement>, 
    callback: () => void
  ): () => void => {
    if (!containerRef.current) return () => {};
    
    const resizeObserver = new ResizeObserver(() => {
      callback();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  };