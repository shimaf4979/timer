// components/ImprovedPinMarker3D.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pin } from '@/types/map-types';

interface ImprovedPinMarker3DProps {
  pin: {
    id: string;
    x: number; // 画像上の相対位置 (0-100%)
    y: number; // 画像上の相対位置 (0-100%)
    title?: string;
    description?: string;
  };
  floorId: string;
  onClick?: () => void;
  isEditable?: boolean; // 編集モードかどうか
}

const ImprovedPinMarker3D: React.FC<ImprovedPinMarker3DProps> = ({ 
  pin, 
  floorId,
  onClick,
  isEditable = false
}) => {
  const pinRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ left: '50%', top: '50%' });
  const [showTooltip, setShowTooltip] = useState(false);
  const [fixedTooltip, setFixedTooltip] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
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
      tooltipRoot.style.zIndex = '800';
      document.body.appendChild(tooltipRoot);
    }
    
    setPortalContainer(tooltipRoot);
    
    return () => {
      // コンポーネントがアンマウントされても、ポータルは削除しない
      // 他のピンも使用する可能性があるため
    };
  }, []);

  // 画像要素の読み込み完了後、ピン位置を計算
  useEffect(() => {
    // 親要素を特定するための関数
    const updatePinPosition = () => {
      if (!pinRef.current) return;
      
      const floorEl = pinRef.current.closest('.floor-container');
      if (!floorEl) return;
      
      const imageContainer = floorEl.querySelector('.image-container') || floorEl;
      const imageEl = floorEl.querySelector('img');
      if (!imageEl) return;
      
      // 画像の実際の表示サイズと位置
      const imageRect = imageEl.getBoundingClientRect();
      const containerRect = imageContainer.getBoundingClientRect();
      
      // コンテナ内での画像のオフセット
      const imageOffsetLeft = imageRect.left - containerRect.left;
      const imageOffsetTop = imageRect.top - containerRect.top;
      
      // 画像の幅と高さ（px）
      const imageWidth = imageRect.width;
      const imageHeight = imageRect.height;
      
      // ピンの位置計算（画像のオフセットを考慮）
      const pinLeft = imageOffsetLeft + (pin.x / 100) * imageWidth;
      const pinTop = imageOffsetTop + (pin.y / 100) * imageHeight;
      
      // コンテナに対する相対位置（%）に変換
      const relativeLeft = (pinLeft / containerRect.width) * 100;
      const relativeTop = (pinTop / containerRect.height) * 100;
      
      setPosition({
        left: `${relativeLeft}%`,
        top: `${relativeTop}%`
      });
    };
    
    // 初期化時に位置を更新
    updatePinPosition();
    
    // リサイズイベントやCSSアニメーション完了時にも位置を更新
    window.addEventListener('resize', updatePinPosition);
    document.addEventListener('transitionend', updatePinPosition);
    window.addEventListener('imageLoaded', updatePinPosition);
    
    // イベントが頻繁に発生する場合に備えて定期的に更新（3D回転中など）
    const interval = setInterval(updatePinPosition, 300);
    
    return () => {
      window.removeEventListener('resize', updatePinPosition);
      document.removeEventListener('transitionend', updatePinPosition);
      window.removeEventListener('imageLoaded', updatePinPosition);
      clearInterval(interval);
    };
  }, [pin.x, pin.y]);
  
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
        const viewportHeight = window.innerHeight;
        
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
  
  // ピンのクリックハンドラー
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditable) {
      setFixedTooltip(!fixedTooltip);
    }
    if (onClick) onClick();
  };
  
  // 説明文の短縮表示用関数
  const truncateText = (text?: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // ツールチップ内の詳細ボタンのクリックハンドラー
  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFixedTooltip(false);
    // 詳細表示の処理は親コンポーネントで行う
  };

  return (
    <>
      <button
        ref={pinRef}
        onClick={handlePinClick}
        onMouseEnter={() => isEditable && setShowTooltip(true)}
        onMouseLeave={() => isEditable && setShowTooltip(false)}
        className={`absolute pin-3d ${fixedTooltip ? 'selected-pin pin-hover-animation' : ''}`}
        style={{
          left: position.left,
          top: position.top,
          transform: 'translate(-50%, -50%)', // 中心を軸に配置
          zIndex: fixedTooltip ? 100 : 50
        }}
        data-pin-id={pin.id}
        data-pin-x={pin.x}
        data-pin-y={pin.y}
        data-floor-id={floorId}
      >
        <div className="w-6 h-12 relative flex flex-col items-center group">
          {/* ピンのヘッド部分 */}
          <div className={`w-6 h-6 ${fixedTooltip ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'} rounded-full flex items-center justify-center text-white 
                      shadow-md transition-all duration-200 border-2 border-white
                      hover:scale-110 z-10 transform-gpu group-hover:-translate-y-1`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* ピンの棒部分 */}
          <div className="absolute flex flex-col items-center">
            {/* 上部 - 棒の上部 */}
            <div className={`h-7 w-2 ${fixedTooltip ? 'bg-blue-600' : 'bg-red-600'} z-0 transform-gpu rounded-b-none mt-4`}></div>
            
            {/* 下部 - 尖った部分 */}
            <div className={`h-4 w-2 ${fixedTooltip ? 'bg-blue-700' : 'bg-red-700'} clip-path-triangle z-0 transform-gpu`}></div>
          </div>
          
          {/* ピンの影 */}
          <div className="absolute bottom-0 w-4 h-1 bg-black/30 rounded-full blur-sm"></div>
        </div>
      </button>
      
      {/* ツールチップ（ポータル経由で表示） - 編集モードのみ表示 */}
      {isEditable && (showTooltip || fixedTooltip) && portalContainer && createPortal(
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
            {pin.description && (
              <p className="text-xs text-gray-600">{truncateText(pin.description, 80)}</p>
            )}
            <div className="mt-2 text-right">
              <button 
                onClick={handleViewDetailsClick}
                className="text-xs text-white bg-blue-500 px-2 py-1 rounded hover:bg-blue-600 pointer-events-auto"
              >
                詳細を見る
              </button>
            </div>
          </div>
        </div>,
        portalContainer
      )}
    </>
  );
};

export default ImprovedPinMarker3D;