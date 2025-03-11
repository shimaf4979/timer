// components/ImprovedPinMarker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PinProps {
  id: string;
  x: number; // 画像上の相対位置 (0-100%)
  y: number; // 画像上の相対位置 (0-100%)
  title?: string;
  description?: string;
}

interface PinMarkerProps {
  pin: PinProps;
  onClick?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  is3DView?: boolean;
  isViewer?: boolean; // Viewerページかどうかのフラグ
}

const ImprovedPinMarker: React.FC<PinMarkerProps> = ({ 
  pin, 
  onClick, 
  containerRef,
  is3DView = false,
  isViewer = false // デフォルトはfalse
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [fixedTooltip, setFixedTooltip] = useState(false); // クリックで固定表示するための状態
  const pinRef = useRef<HTMLButtonElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // DOMでのピン位置を状態として管理
  const [pinPosition, setPinPosition] = useState({
    left: 0,
    top: 0,
    display: 'none' // 最初は非表示
  });

  // ツールチップの位置状態
  const [tooltipPosition, setTooltipPosition] = useState({
    left: 0,
    top: 0,
    width: 200,
    transformOrigin: 'center bottom'
  });
  
  // ポータルコンテナを作成
  useEffect(() => {
    // すでに存在するかチェック
    let tooltipRoot = document.getElementById('tooltip-root');
    
    if (!tooltipRoot) {
      // なければ作成
      tooltipRoot = document.createElement('div');
      tooltipRoot.id = 'tooltip-root';
      tooltipRoot.style.position = 'fixed';
      tooltipRoot.style.top = '0';
      tooltipRoot.style.left = '0';
      tooltipRoot.style.width = '100%';
      tooltipRoot.style.height = '100%';
      tooltipRoot.style.pointerEvents = 'none';
      tooltipRoot.style.zIndex = '800'; // モーダル(900)より下のz-indexに変更
      document.body.appendChild(tooltipRoot);
    }
    
    setPortalContainer(tooltipRoot);
    
    return () => {
      // コンポーネントがアンマウントされても、ポータルは削除しない
      // 他のピンも使用する可能性があるため
    };
  }, []);

  // ピン位置を計算して更新
  useEffect(() => {
    if (!containerRef?.current) return;
    let isMounted = true;
    let frameId: number | null = null;
    
    // ピン位置の計算と更新を行う関数
    const updatePinPosition = () => {
      if (!containerRef?.current || !isMounted) return;
      
      try {
        // 画像要素を取得
        const imageElement = containerRef.current.querySelector('img');
        if (!imageElement) {
          frameId = requestAnimationFrame(updatePinPosition);
          return;
        }
        
        // コンテナの位置とサイズを取得
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // 画像の表示サイズと位置を取得
        const imageRect = imageElement.getBoundingClientRect();
        
        // 画像がレンダリングされているかチェック
        if (imageRect.width === 0 || imageRect.height === 0) {
          frameId = requestAnimationFrame(updatePinPosition);
          return;
        }
        
        // ピンの座標を計算（画像の実際のサイズに基づく）
        const pinXPercent = pin.x / 100;
        const pinYPercent = pin.y / 100;
        
        // 3Dビューでの位置計算
        if (is3DView) {
          // 画像要素を取得
          const floorContainer = containerRef.current.closest('.floor-container');
          if (floorContainer) {
            const floorRect = floorContainer.getBoundingClientRect();
            const floorImage = floorContainer.querySelector('img');
            
            if (floorImage) {
              const imageRect = floorImage.getBoundingClientRect();
              
              // 画像領域内での位置を計算
              const relativeX = pinXPercent * imageRect.width;
              const relativeY = pinYPercent * imageRect.height;
              
              // コンテナ内での位置に変換
              const pinX = imageRect.left - floorRect.left + relativeX;
              const pinY = imageRect.top - floorRect.top + relativeY;
              
              if (isMounted) {
                setPinPosition({
                  left: pinX,
                  top: pinY,
                  display: 'block'
                });
              }
            }
          } else {
            // 通常の3Dビュー計算（エレメントが見つからない場合のフォールバック）
            const relativeX = pinXPercent * imageRect.width;
            const relativeY = pinYPercent * imageRect.height;
            
            const pinX = imageRect.left - containerRect.left + relativeX;
            const pinY = imageRect.top - containerRect.top + relativeY;
            
            if (isMounted) {
              setPinPosition({
                left: pinX,
                top: pinY,
                display: 'block'
              });
            }
          }
        } else {
          // 通常ビューでの位置計算
          // 画像がコンテナ内で中央揃えされている場合のオフセットを計算
          const imageOffsetX = imageRect.left - containerRect.left;
          const imageOffsetY = imageRect.top - containerRect.top;
          
          // ピクセル座標に変換
          const pinX = imageOffsetX + (pinXPercent * imageRect.width);
          const pinY = imageOffsetY + (pinYPercent * imageRect.height);
          
          if (isMounted) {
            setPinPosition({
              left: pinX,
              top: pinY,
              display: 'block'
            });
          }
        }
      } catch (err) {
        console.error('Error updating pin position:', err);
      }
    };
    
    // 初回更新
    updatePinPosition();
    
    // 画像読み込み、リサイズ、スクロールでの位置更新
    const handleUpdate = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updatePinPosition);
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('imageLoaded', handleUpdate);
    window.addEventListener('imageFullyLoaded', handleUpdate);
    
    // 3Dビューの場合は定期的に更新
    let intervalId: NodeJS.Timeout | null = null;
    if (is3DView) {
      intervalId = setInterval(handleUpdate, 100);
    }
    
    // 再レンダリング時や非マウント時にクリーンアップ
    return () => {
      isMounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (intervalId) clearInterval(intervalId);
      
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('imageLoaded', handleUpdate);
      window.removeEventListener('imageFullyLoaded', handleUpdate);
    };
  }, [pin.x, pin.y, containerRef, is3DView]);

  // ピンのクリックハンドラー
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <button
      ref={pinRef}
      onClick={handlePinClick}
      className={`absolute transform -translate-x-1/2 -translate-y-full ${is3DView ? 'pin-3d' : 'pin-normal'}`}
      style={{
        left: `${pinPosition.left}px`,
        top: `${pinPosition.top}px`,
        display: pinPosition.display,
        zIndex: 50,
        pointerEvents: 'auto'
      }}
      data-pin-id={pin.id}
      data-pin-x={pin.x}
      data-pin-y={pin.y}
    >
      <div className="w-6 h-12 relative flex flex-col items-center group">
        {/* ピンのヘッド部分 */}
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white 
                     shadow-md transition-all duration-200 border-2 border-white
                     hover:scale-110 z-10 transform-gpu group-hover:-translate-y-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* ピンの棒部分 */}
        <div className="absolute flex flex-col items-center">
          {/* 上部 - 棒の上部 */}
          <div className="h-4 w-2 bg-red-600 z-0 transform-gpu rounded-b-none mt-4"></div>
          
          {/* 下部 - 尖った部分 */}
          <div className="h-3 w-2 bg-red-700 clip-path-triangle z-0 transform-gpu"></div>
        </div>
        
        {/* ピンの影 */}
        <div className="absolute bottom-0 w-4 h-1 bg-black/30 rounded-full blur-sm"></div>
      </div>
    </button>
  );
};

export default ImprovedPinMarker;