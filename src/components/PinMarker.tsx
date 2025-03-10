// components/PinMarker.tsx
import React, { useState, useEffect, useRef } from 'react';

interface PinProps {
  id: string;
  x: number;
  y: number;
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
  
  // 説明文の短縮表示用関数
  const truncateText = (text?: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // ツールチップの位置を計算
  useEffect(() => {
    if (showTooltip && pinRef.current) {
      const pinRect = pinRef.current.getBoundingClientRect();
      const containerRect = containerRef?.current?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      
      // ツールチップの推定サイズ（実際のコンテンツによって異なる場合があります）
      const tooltipWidth = Math.min(300, containerRect.width - 40);
      const tooltipHeight = 120; // 推定値
      
      // 水平位置を計算 - 画面からはみ出す場合は位置調整
      let left = '50%';
      let right = 'auto';
      let translateX = '-50%';
      
      // 垂直位置を計算 - 上に表示するデフォルト
      let top = 'auto';
      let bottom = '100%';
      
      // 上部に十分なスペースがない場合は下に表示
      if (pinRect.top - tooltipHeight < containerRect.top) {
        top = '100%';
        bottom = 'auto';
      }
      
      // ピンが画面の右端に近い場合、吹き出しを左に寄せる
      if (pinRect.left + (tooltipWidth / 2) > containerRect.width) {
        left = 'auto';
        right = '0';
        translateX = '0';
      } 
      // ピンが画面の左端に近い場合、吹き出しを右に寄せる
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
  }, [showTooltip, containerRef]);

  return (
    <button
      ref={pinRef}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="absolute z-10"
      style={{
        // パーセンテージポジションではなくピクセル位置に変換するために transform を使用
        left: `${pin.x}%`,
        top: `${pin.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
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