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
}

const ImprovedPinMarker: React.FC<PinMarkerProps> = ({ 
  pin, 
  onClick, 
  containerRef,
  is3DView = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
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
      tooltipRoot.style.zIndex = '9999';
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
          // 画像領域内での位置を計算
          const relativeX = pinXPercent * imageRect.width;
          const relativeY = pinYPercent * imageRect.height;
          
          // コンテナ内での位置に変換
          const pinX = imageRect.left - containerRect.left + relativeX;
          const pinY = imageRect.top - containerRect.top + relativeY;
          
          if (isMounted) {
            setPinPosition({
              left: pinX,
              top: pinY,
              display: 'block'
            });
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

  // ツールチップ位置の更新
  useEffect(() => {
    if (showTooltip && pinRef.current) {
      const updateTooltipPosition = () => {
        if (!pinRef.current) return;
        
        // ピンの画面上の位置を取得
        const pinRect = pinRef.current.getBoundingClientRect();
        const pinCenterX = pinRect.left + pinRect.width / 2;
        const pinTop = pinRect.top;
        const pinBottom = pinRect.bottom;
        
        // ビューポートのサイズ
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // ツールチップのサイズ設定
        const tooltipWidth = 200;
        const tooltipHeight = 120; // 推定高さ
        
        // 初期位置 - ピンの上
        let tooltipLeft = pinCenterX - tooltipWidth / 2;
        let tooltipTop = pinTop - tooltipHeight - 10;
        let origin = 'center bottom';
        
        // 上に表示するスペースがない場合は下に表示
        if (tooltipTop < 10) {
          tooltipTop = pinBottom + 10;
          origin = 'center top';
        }
        
        // 左右の画面端に近い場合は調整
        if (tooltipLeft < 10) {
          tooltipLeft = 10;
        } else if (tooltipLeft + tooltipWidth > viewportWidth - 10) {
          tooltipLeft = viewportWidth - tooltipWidth - 10;
        }
        
        // 位置を更新
        setTooltipPosition({
          left: tooltipLeft,
          top: tooltipTop,
          width: tooltipWidth,
          transformOrigin: origin
        });
      };
      
      updateTooltipPosition();
      
      // スクロールとリサイズでツールチップ位置を更新
      window.addEventListener('scroll', updateTooltipPosition);
      window.addEventListener('resize', updateTooltipPosition);
      
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [showTooltip]);

  // 説明文の短縮表示用関数
  const truncateText = (text?: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <button
      ref={pinRef}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${is3DView ? 'pin-3d' : 'pin-normal'}`}
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
      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg
                    hover:bg-red-600 transition-all duration-200 border-2 border-white
                    hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      {/* ポータル経由でツールチップを表示 */}
      {showTooltip && portalContainer && createPortal(
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none animate-tooltip-appear"
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            width: tooltipPosition.width,
            zIndex: 9999,
            transformOrigin: tooltipPosition.transformOrigin
          }}
        >
          <div className="relative">
            <h3 className="font-bold text-gray-900 mb-1 text-sm">{pin.title}</h3>
            {pin.description && (
              <p className="text-xs text-gray-600">{truncateText(pin.description, 80)}</p>
            )}
            <div className="mt-2 text-xs text-blue-500">クリックで詳細を表示</div>
          </div>
        </div>,
        portalContainer
      )}
    </button>
  );
};

export default ImprovedPinMarker;