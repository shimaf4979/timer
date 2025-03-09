// utils/pinPositionUtils.ts

/**
 * ピンの位置を正規化して保存
 * @param x 画像上のX座標（ピクセル）
 * @param y 画像上のY座標（ピクセル）
 * @param imageWidth 画像の幅
 * @param imageHeight 画像の高さ
 * @returns {x: number, y: number} 正規化された位置（パーセント）
 */
export const normalizePosition = (x: number, y: number, imageWidth: number, imageHeight: number) => {
    // 0-100の範囲に正規化
    const normalizedX = Math.min(Math.max((x / imageWidth) * 100, 0), 100);
    const normalizedY = Math.min(Math.max((y / imageHeight) * 100, 0), 100);
    
    return { x: normalizedX, y: normalizedY };
  };
  
  /**
   * パーセント位置からピクセル位置を計算
   * @param xPercent X位置（パーセント）
   * @param yPercent Y位置（パーセント）
   * @param containerWidth コンテナの幅
   * @param containerHeight コンテナの高さ
   * @returns {x: number, y: number} ピクセル位置
   */
  export const calculatePixelPosition = (
    xPercent: number, 
    yPercent: number, 
    containerWidth: number, 
    containerHeight: number
  ) => {
    const x = (xPercent / 100) * containerWidth;
    const y = (yPercent / 100) * containerHeight;
    
    return { x, y };
  };