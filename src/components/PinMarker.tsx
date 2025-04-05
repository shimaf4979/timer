// components/PinMarker.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pin } from '@/types';
import { optimizeImageUrl } from '@/lib/cloudinary';

interface PinMarkerProps {
  pin: Pin;
  containerRef: React.RefObject<HTMLDivElement>;
  isSelected: boolean;
  isEditable?: boolean;
  onClick?: (pin: Pin) => void;
  onEdit?: (pin: Pin) => void;
  onDelete?: (pin: Pin) => void;
}

export default function PinMarker({
  pin,
  containerRef,
  isSelected,
  isEditable = false,
  onClick,
  onEdit,
  onDelete
}: PinMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const pinRef = useRef<HTMLDivElement>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  // ポータルエレメントの初期化
  useEffect(() => {
    let tooltipRoot = document.getElementById('tooltip-root');
    if (!tooltipRoot) {
      tooltipRoot = document.createElement('div');
      tooltipRoot.id = 'tooltip-root';
      tooltipRoot.style.position = 'fixed';
      tooltipRoot.style.top = '0';
      tooltipRoot.style.left = '0';
      tooltipRoot.style.width = '100%';
      tooltipRoot.style.height = '100%';
      tooltipRoot.style.pointerEvents = 'none';
      tooltipRoot.style.zIndex = '50';
      document.body.appendChild(tooltipRoot);
    }
    setPortalElement(tooltipRoot);

    return () => {
      // コンポーネントのクリーンアップ時にはポータルを削除しない
    };
  }, []);

  // ピンの位置を計算
  useEffect(() => {
    if (!containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const imageElement = container.querySelector('img');

      if (!imageElement) return;

      const imageRect = imageElement.getBoundingClientRect();

      // 画像の表示サイズと位置を取得
      const imageLeft = imageRect.left - containerRect.left;
      const imageTop = imageRect.top - containerRect.top;
      const imageWidth = imageRect.width;
      const imageHeight = imageRect.height;

      // ピンの位置を計算 (パーセンテージ -> ピクセル)
      const pinX = imageLeft + (pin.x_position / 100) * imageWidth;
      const pinY = imageTop + (pin.y_position / 100) * imageHeight;

      setPosition({
        left: pinX,
        top: pinY
      });
    };

    // 初回計算
    updatePosition();

    // イベントリスナーを追加
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [containerRef, pin.x_position, pin.y_position]);

  // ツールチップの位置を計算
  useEffect(() => {
    if (showTooltip && pinRef.current) {
      const pinRect = pinRef.current.getBoundingClientRect();
      const tooltipWidth = 200;
      const tooltipHeight = 120;

      // ピンの中心位置を基準に
      const pinCenterX = pinRect.left + pinRect.width / 2;
      
      // デフォルトではピンの上にツールチップを表示
      let tooltipLeft = pinCenterX - tooltipWidth / 2;
      let tooltipTop = pinRect.top - tooltipHeight - 10;

      // 画面外にはみ出す場合は調整
      if (tooltipTop < 10) {
        tooltipTop = pinRect.bottom + 10; // ピンの下に表示
      }
      
      if (tooltipLeft < 10) {
        tooltipLeft = 10;
      } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
        tooltipLeft = window.innerWidth - tooltipWidth - 10;
      }

      setTooltipPosition({ left: tooltipLeft, top: tooltipTop });
    }
  }, [showTooltip]);

  // テキストを省略表示する関数
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // ピンクリック時の処理
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(pin);
  };

  // 編集ボタンクリック時の処理
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(pin);
  };

  // 削除ボタンクリック時の処理
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(pin);
  };

  return (
    <>
      <div
        ref={pinRef}
        className={`absolute transform -translate-x-1/2 -translate-y-full cursor-pointer z-40 ${
          isSelected ? 'z-50' : ''
        }`}
        style={{
          left: `${position.left}px`,
          top: `${position.top}px`
        }}
        onClick={handlePinClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        data-pin-id={pin.id}
      >
        <div className="w-8 h-12 relative flex flex-col items-center">
          {/* ピンのヘッド部分 */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white 
                     border-2 border-white shadow-md hover:scale-110 transition-transform ${
                       isSelected ? 'bg-blue-500' : 'bg-red-500'
                     }`}
          >
            {pin.image_url ? (
              <div
                className="w-full h-full rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${optimizeImageUrl(pin.image_url, {
                    width: 40,
                    height: 40,
                    quality: 'auto'
                  })}`
                }}
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9z" />
              </svg>
            )}
          </div>
          
          {/* ピンの棒部分 */}
          <div className="absolute top-6 flex flex-col items-center">
            <div className={`h-4 w-2 ${isSelected ? 'bg-blue-600' : 'bg-red-600'}`}></div>
            <div 
              className={`h-3 w-4 ${isSelected ? 'bg-blue-700' : 'bg-red-700'}`} 
              style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}
            ></div>
          </div>
          
          {/* ピンの影 */}
          <div className="absolute bottom-0 w-4 h-1 bg-black/30 rounded-full blur-sm"></div>
        </div>
      </div>
      
      {/* ツールチップ */}
      {showTooltip && portalElement && createPortal(
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 animate-fade-in pointer-events-auto"
          style={{
            left: `${tooltipPosition.left}px`,
            top: `${tooltipPosition.top}px`,
            width: '200px',
            maxWidth: 'calc(100vw - 20px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start">
            <div className="flex-grow">
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{pin.title}</h3>
              {pin.description && (
                <p className="text-xs text-gray-600">{truncateText(pin.description, 80)}</p>
              )}
              {pin.editor_nickname && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {pin.editor_nickname}
                </p>
              )}
            </div>
            
            {pin.image_url && (
              <div className="ml-2 w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                <img 
                  src={optimizeImageUrl(pin.image_url, { width: 60, height: 60 })} 
                  alt={pin.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          
          {isEditable && (
            <div className="mt-2 flex justify-end gap-1">
              <button
                onClick={handleEdit}
                className="text-xs text-white bg-blue-500 px-2 py-1 rounded hover:bg-blue-600"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600"
              >
                削除
              </button>
            </div>
          )}
        </div>,
        portalElement
      )}
    </>
  );
}