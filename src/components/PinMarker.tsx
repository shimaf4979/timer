// components/PinMarker.tsx
import React, { useState, useEffect, useRef } from 'react';

interface PinProps {
  id: string;
  x: number; // 画像上の相対位置 (0-100%)
  y: number; // 画像上の相対位置 (0-100%)
  title?: string;
  description?: string;
  floor?: number;
}

interface PinMarkerProps {
  pin: PinProps;
  onClick?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const PinMarker: React.FC<PinMarkerProps> = ({ pin, onClick, containerRef }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: '0', top: 'auto', bottom: '100%', right: 'auto' });
  const pinRef = useRef<HTMLButtonElement>(null);
  
  // DOMでのピン位置を状態として管理
  const [pinDOMPosition, setPinDOMPosition] = useState<{left: string, top: string}>({
    left: '0px',
    top: '0px'
  });
  
  // ピン位置を計算して更新
  useEffect(() => {
    if (!containerRef?.current) return;
    
    // ピン位置の計算と更新を行う関数
    const updatePinPosition = () => {
      if (!containerRef.current) return;
      
      // 画像要素を取得
      const imageElement = containerRef.current.querySelector('img');
      if (!imageElement) return;
      
      // 画像の現在の表示サイズを取得
      const imageRect = imageElement.getBoundingClientRect();
      
      // 画像がレンダリングされているかチェック
      if (imageRect.width === 0 || imageRect.height === 0) {
        // 画像がまだレンダリングされていない場合は遅延して再試行
        requestAnimationFrame(updatePinPosition);
        return;
      }
      
      // ピン位置を直接設定 (position: absolute で left/top を使用)
      setPinDOMPosition({
        left: `${imageRect.left + (pin.x / 100) * imageRect.width}px`,
        top: `${imageRect.top + (pin.y / 100) * imageRect.height}px`
      });
    };
    
    // 初回実行
    updatePinPosition();
    
    // 画像のロードイベントとリサイズイベントを監視
    const handleImageLoad = () => updatePinPosition();
    const handleResize = () => {
      // ブラウザリサイズ時は少し遅延させて位置を更新 (レイアウト完了を待つ)
      requestAnimationFrame(() => {
        requestAnimationFrame(updatePinPosition);
      });
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('imageLoaded', handleImageLoad);
    window.addEventListener('imageFullyLoaded', handleImageLoad);
    
    // 画像コンテナのサイズ変更を監視
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updatePinPosition);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // スクロールイベントも監視
    const handleScroll = () => {
      requestAnimationFrame(updatePinPosition);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('imageLoaded', handleImageLoad);
      window.removeEventListener('imageFullyLoaded', handleImageLoad);
      window.removeEventListener('scroll', handleScroll);
      
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [pin.x, pin.y, containerRef]);

  // 説明文の短縮表示用関数
  const truncateText = (text?: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // ツールチップの位置を計算
  useEffect(() => {
    if (showTooltip && pinRef.current) {
      const pinRect = pinRef.current.getBoundingClientRect();
      
      // ビューポート基準のコンテナサイズを取得
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // ツールチップのサイズ設定
      const tooltipWidth = 256; // ツールチップの幅 (w-64 = 16rem = 256px)
      const tooltipHeight = 120; // 推定高さ
      
      // 水平位置の計算 (左右の画面端に近い場合の調整)
      let left = '50%';
      let right = 'auto';
      let translateX = '-50%';
      
      // 垂直位置の計算 (上下の画面端に近い場合の調整)
      let top = 'auto';
      let bottom = '100%';
      
      // 上部に十分なスペースがない場合は下に表示
      if (pinRect.top - tooltipHeight < 0) {
        top = '100%';
        bottom = 'auto';
      }
      
      // 右端に近い場合は左寄せ
      if (pinRect.left + (tooltipWidth / 2) > viewportWidth) {
        left = 'auto';
        right = '0';
        translateX = '0';
      }
      // 左端に近い場合は右寄せ
      else if (pinRect.left - (tooltipWidth / 2) < 0) {
        left = '0';
        right = 'auto';
        translateX = '0';
      }
      
      setTooltipPosition({
        left,
        top,
        bottom,
        right
      });
    }
  }, [showTooltip]);

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
      className="fixed z-10 transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: pinDOMPosition.left,
        top: pinDOMPosition.top
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
      
      {/* 改良版吹き出しツールチップ */}
      {showTooltip && (
        <div 
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 w-64 pointer-events-none"
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            bottom: tooltipPosition.bottom,
            right: tooltipPosition.right,
            transform: tooltipPosition.left === '50%' ? `translateX(${tooltipPosition.left === '50%' ? '-50%' : '0'})` : 'none',
            maxWidth: '90vw'
          }}
        >
          {/* 吹き出しの矢印 */}
          <div 
            className="absolute w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45"
            style={{
              left: tooltipPosition.left === '50%' ? 'calc(50% - 6px)' : (tooltipPosition.right === '0' ? 'calc(100% - 24px)' : '12px'),
              [tooltipPosition.top === 'auto' ? 'bottom' : 'top']: '-6px',
            }}
          ></div>
          
          {/* 吹き出し内容 */}
          <div className="relative">
            <h3 className="font-bold text-gray-900 mb-1">{pin.title}</h3>
            {pin.description && (
              <p className="text-sm text-gray-600">{truncateText(pin.description)}</p>
            )}
            <div className="mt-2 text-xs text-blue-500">クリックで詳細を表示</div>
          </div>
        </div>
      )}
    </button>
  );
};

export default PinMarker;