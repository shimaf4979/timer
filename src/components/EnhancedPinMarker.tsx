// components/EnhancedPinMarker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PinProps {
  id: string;
  x: number; // 画像上の相対位置 (0-100%)
  y: number; // 画像上の相対位置 (0-100%)
  title?: string;
  description?: string;
  image_url?: string;
}

interface PinMarkerProps {
  pin: PinProps;
  onClick?: () => void;
  isViewer?: boolean;
  isSelected?: boolean;
}

const EnhancedPinMarker: React.FC<PinMarkerProps> = ({ 
  pin, 
  onClick, 
  isViewer = false,
  isSelected = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [fixedTooltip, setFixedTooltip] = useState(isSelected);
  const pinRef = useRef<HTMLButtonElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // 選択状態が変更されたときにfixedTooltipを更新
  useEffect(() => {
    setFixedTooltip(isSelected);
  }, [isSelected]);
  
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
      tooltipRoot.style.zIndex = '800';
      document.body.appendChild(tooltipRoot);
    }
    
    setPortalContainer(tooltipRoot);
    
    return () => {
      // コンポーネントがアンマウントされても、ポータルは削除しない
      // 他のピンも使用する可能性があるため
    };
  }, []);

  // 画面全体をクリックしたときにfixedTooltipをリセットする
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (pinRef.current && !pinRef.current.contains(e.target as Node)) {
        setFixedTooltip(false);
      }
    };

    if (fixedTooltip) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [fixedTooltip]);

  // ツールチップ位置の状態
  const [tooltipPosition, setTooltipPosition] = useState({
    left: 0,
    top: 0,
    width: 200,
    transformOrigin: 'center bottom'
  });

  // ツールチップ位置の更新
  useEffect(() => {
    if ((showTooltip || fixedTooltip) && pinRef.current) {
      const updateTooltipPosition = () => {
        if (!pinRef.current) return;
        
        // ピンの画面上の位置を取得
        const pinRect = pinRef.current.getBoundingClientRect();
        const pinCenterX = pinRect.left + pinRect.width / 2;
        const pinTop = pinRect.top;
        const pinBottom = pinRect.bottom;
        
        // ビューポートのサイズ
        const viewportWidth = window.innerWidth;
        
        // ツールチップのサイズ設定
        const tooltipWidth = Math.min(200, viewportWidth - 40);
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
  }, [showTooltip, fixedTooltip]);

  // 説明文の短縮表示用関数
  const truncateText = (text?: string, maxLength: number = 60) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // ピンのクリックハンドラー
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // ビューワーモードでは吹き出しの表示/非表示を切り替え
    setFixedTooltip(!fixedTooltip);
    
    // 通常のクリックコールバックも呼び出す
    if (onClick) onClick();
  };

  // ピンの色を決定
  const getPinColor = () => {
    if (fixedTooltip || isSelected) return 'bg-blue-500 hover:bg-blue-600'; // 選択中
    return 'bg-red-500 hover:bg-red-600'; // デフォルト
  };

  return (
    <>
      <button
        ref={pinRef}
        onClick={handlePinClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`absolute transform -translate-x-1/2 -translate-y-full ${fixedTooltip || isSelected ? 'selected-pin pin-hover-animation' : ''}`}
        style={{
          left: `${pin.x}%`,
          top: `${pin.y}%`,
          zIndex: fixedTooltip || isSelected ? 100 : 50,
          pointerEvents: 'auto'
        }}
        data-pin-id={pin.id}
        data-pin-x={pin.x}
        data-pin-y={pin.y}
      >
        <div className="w-6 h-12 relative flex flex-col items-center group">
          {/* ピンのヘッド部分 */}
          <div className={`w-6 h-6 ${getPinColor()} rounded-full flex items-center justify-center text-white 
                        shadow-md transition-all duration-200 border-2 border-white
                        hover:scale-110 z-10 transform-gpu group-hover:-translate-y-1`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* ピンの棒部分 */}
          <div className="absolute flex flex-col items-center">
            {/* 上部 - 棒の上部 */}
            <div className={`h-4 w-2 ${
              fixedTooltip || isSelected 
                ? 'bg-blue-600' 
                : 'bg-red-600'
            } z-0 transform-gpu rounded-b-none mt-4`}></div>
            
            {/* 下部 - 尖った部分 */}
            <div className={`h-3 w-2 ${
              fixedTooltip || isSelected 
                ? 'bg-blue-700' 
                : 'bg-red-700'
            } clip-path-triangle z-0 transform-gpu`}></div>
          </div>
          
          {/* ピンの影 */}
          <div className="absolute bottom-0 w-4 h-1 bg-black/30 rounded-full blur-sm"></div>
        </div>
      </button>
      
      {/* ツールチップ（ポータル経由で表示） */}
      {(showTooltip || fixedTooltip) && portalContainer && createPortal(
        <div 
          className={`fixed bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-auto ${fixedTooltip ? 'animate-none' : 'animate-tooltip-appear'}`}
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            width: tooltipPosition.width,
            zIndex: 800,
            transformOrigin: tooltipPosition.transformOrigin
          }}
        >
          <div className="relative">
            <h3 className="font-bold text-gray-900 mb-1 text-sm">{pin.title}</h3>
            
            {/* 画像があれば表示 */}
            {pin.image_url && (
              <div className="mb-1 mt-1">
                <img 
                  src={pin.image_url} 
                  alt={pin.title} 
                  className="w-full h-20 object-cover rounded"
                />
              </div>
            )}
            
            {pin.description && (
              <p className="text-xs text-gray-600">{truncateText(pin.description)}</p>
            )}
            
            <div className="mt-2 text-xs text-blue-500 text-right">
              {isViewer 
                ? (fixedTooltip ? 'タップで閉じる' : 'タップで詳細を表示') 
                : 'クリックで詳細を表示'}
            </div>
          </div>
        </div>,
        portalContainer
      )}
    </>
  );
};

export default EnhancedPinMarker;