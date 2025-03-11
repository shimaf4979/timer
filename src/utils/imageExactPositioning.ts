// utils/imageExactPositioning.ts

/**
 * 画像上の正確な位置を計算するためのユーティリティ
 * このユーティリティは、キャンバスサイズではなく画像の実際のサイズに基づいて
 * ピンの位置を正確に計算します
 */

/**
 * クリック位置を画像上の正確な相対位置（パーセンテージ）に変換
 * @param e クリックイベント
 * @param containerRef 画像コンテナのRef
 * @returns 画像上の正確な相対位置（x, yともに0-100の百分率）
 */
export const getExactImagePosition = (
    e: React.MouseEvent<HTMLElement>,
    containerRef: React.RefObject<HTMLElement>
  ): { x: number, y: number } | null => {
    if (!containerRef.current) return null;
  
    // コンテナの位置とサイズを取得
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // コンテナ内の画像要素を取得
    const imageElement = containerRef.current.querySelector('img');
    if (!imageElement) return null;
    
    // 画像の表示位置とサイズを取得
    const imageRect = imageElement.getBoundingClientRect();
    
    // クリック位置がコンテナ内の画像の範囲内かチェック
    if (
      e.clientX < imageRect.left || 
      e.clientX > imageRect.right || 
      e.clientY < imageRect.top || 
      e.clientY > imageRect.bottom
    ) {
      return null; // 画像外のクリックは無視
    }
    
    // 画像内でのクリック位置を計算（ピクセル単位）
    const imageX = e.clientX - imageRect.left;
    const imageY = e.clientY - imageRect.top;
    
    // 画像の表示サイズに対する相対位置（0-1）を計算
    const relativeX = imageX / imageRect.width;
    const relativeY = imageY / imageRect.height;
    
    // パーセンテージに変換（0-100）
    return {
      x: relativeX * 100,
      y: relativeY * 100
    };
  };
  
  /**
   * ピン位置を画像上の座標に変換する
   * @param pinX ピンのX位置（0-100の百分率）
   * @param pinY ピンのY位置（0-100の百分率）
   * @param containerRef 画像コンテナのRef
   * @returns DOM上での絶対位置（px）
   */
  export const calculatePinDOMPosition = (
    pinX: number,
    pinY: number,
    containerRef: React.RefObject<HTMLElement>
  ): { left: number, top: number } | null => {
    if (!containerRef.current) return null;
    
    // 画像要素を取得
    const imageElement = containerRef.current.querySelector('img');
    if (!imageElement) return null;
    
    // 画像の表示位置とサイズを取得
    const imageRect = imageElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // ピンの絶対位置を計算
    const pinLeft = imageRect.left + (pinX / 100) * imageRect.width - containerRect.left;
    const pinTop = imageRect.top + (pinY / 100) * imageRect.height - containerRect.top;
    
    return { left: pinLeft, top: pinTop };
  };
  
  /**
   * 画像ロード完了時に画像要素に正確なサイズ情報を設定
   * @param imageElement 画像要素
   * @param naturalWidth 画像の元の幅
   * @param naturalHeight 画像の元の高さ
   */
  export const setImageSizeAttributes = (
    imageElement: HTMLImageElement,
    naturalWidth: number,
    naturalHeight: number
  ): void => {
    // 画像の元のサイズをdata属性に保存
    imageElement.dataset.originalWidth = String(naturalWidth);
    imageElement.dataset.originalHeight = String(naturalHeight);
    imageElement.dataset.aspectRatio = String(naturalHeight / naturalWidth);
  };
  
  /**
   * 画像コンテナからスタイル化された画像要素を取得
   * @param container 画像コンテナ
   * @returns スタイル設定された画像要素
   */
  export const getStyledImageElement = (
    container: HTMLElement
  ): HTMLImageElement | null => {
    const img = container.querySelector('img');
    if (!img) return null;
    
    // 完全な表示スタイルを適用
    if (window.getComputedStyle) {
      // 現在のスタイルを反映するためのダミーメソッド呼び出し
      window.getComputedStyle(img).getPropertyValue('width');
    }
    
    return img;
  };
  
  /**
   * ピン位置を相対 (ratio) 形式から絶対 (px) 形式に変換
   */
  export const pinPositionToPixels = (
    x: number, // 0-100のパーセンテージ
    y: number, // 0-100のパーセンテージ
    imageWidth: number,
    imageHeight: number
  ): { x: number, y: number } => {
    return {
      x: (x / 100) * imageWidth,
      y: (y / 100) * imageHeight
    };
  };
  
  /**
   * ピン位置を絶対 (px) 形式から相対 (ratio) 形式に変換
   */
  export const pixelsToPinPosition = (
    x: number, // ピクセル座標
    y: number, // ピクセル座標
    imageWidth: number,
    imageHeight: number
  ): { x: number, y: number } => {
    return {
      x: (x / imageWidth) * 100,
      y: (y / imageHeight) * 100
    };
  };