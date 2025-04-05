// components/MapViewer.tsx
'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { Pin, Floor } from '@/types';
import PinMarker from './PinMarker';
import { optimizeImageUrl } from '@/lib/cloudinary';

interface MapViewerProps {
  floor: Floor | null;
  pins: Pin[];
  isAddingPin?: boolean;
  isEditable?: boolean;
  selectedPinId?: string | null;
  zoomable?: boolean;
  fullscreen?: boolean;
  onPinClick?: (pin: Pin) => void;
  onEditPin?: (pin: Pin) => void;
  onDeletePin?: (pin: Pin) => void;
  onImageClick?: (x: number, y: number) => void;
}

export default function MapViewer({
  floor,
  pins,
  isAddingPin = false,
  isEditable = false,
  selectedPinId = null,
  zoomable = true,
  fullscreen = false,
  onPinClick,
  onEditPin,
  onDeletePin,
  onImageClick
}: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fullscreenMode, setFullscreenMode] = useState(fullscreen);
  const [isMobile, setIsMobile] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // モバイル検出
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // コンテナサイズの更新
  useEffect(() => {
    if (!containerRef.current) return;

    const updateContainerSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);

    return () => {
      window.removeEventListener('resize', updateContainerSize);
    };
  }, [fullscreenMode]);

  // フルスクリーン切り替え
  const toggleFullscreen = () => {
    setFullscreenMode(!fullscreenMode);
    
    // スケールとポジションをリセット
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // ズームリセット
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // ズームイン
  const zoomIn = () => {
    if (scale < 3) {
      setScale(prevScale => Math.min(prevScale + 0.2, 3));
    }
  };

  // ズームアウト
  const zoomOut = () => {
    if (scale > 0.5) {
      setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
    }
  };

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomable || scale === 1) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // ドラッグ中
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !zoomable) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // 移動範囲の制限を設定
    const maxX = (containerSize.width * (scale - 1)) / 2;
    const maxY = (containerSize.height * (scale - 1)) / 2;
    
    setPosition({
      x: Math.max(Math.min(newX, maxX), -maxX),
      y: Math.max(Math.min(newY, maxY), -maxY)
    });
  };

  // ドラッグ終了
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // タッチイベント
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!zoomable || scale === 1) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !zoomable) return;
    
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    
    const maxX = (containerSize.width * (scale - 1)) / 2;
    const maxY = (containerSize.height * (scale - 1)) / 2;
    
    setPosition({
      x: Math.max(Math.min(newX, maxX), -maxX),
      y: Math.max(Math.min(newY, maxY), -maxY)
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // ホイールでのズーム
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!zoomable) return;
    
    e.preventDefault();
    
    // ホイールの方向に応じてズームイン/アウト
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // 画像クリック時の処理
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingPin && floor?.image_url && onImageClick && !isDragging) {
      e.stopPropagation();
      
      // コンテナと画像の位置を取得
      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const imageElement = container.querySelector('img');
      
      if (!imageElement) return;
      
      const imageRect = imageElement.getBoundingClientRect();
      
      // クリック位置を取得（コンテナ相対）
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;
      
      // 画像の表示エリアの左上座標
      const imageLeft = imageRect.left - containerRect.left;
      const imageTop = imageRect.top - containerRect.top;
      
      // 画像のスケール済みサイズ
      const scaledImageWidth = imageRect.width;
      const scaledImageHeight = imageRect.height;
      
      // クリック位置が画像内かチェック
      if (
        clickX >= imageLeft &&
        clickX <= imageLeft + scaledImageWidth &&
        clickY >= imageTop &&
        clickY <= imageTop + scaledImageHeight
      ) {
        // 画像内での相対位置を計算 (0-100%)
        const imageX = ((clickX - imageLeft) / scaledImageWidth) * 100;
        const imageY = ((clickY - imageTop) / scaledImageHeight) * 100;
        
        // スケールと移動を考慮した位置の補正
        const correctedX = imageX;
        const correctedY = imageY;
        
        onImageClick(correctedX, correctedY);
      }
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${
        fullscreenMode
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-black'
          : 'w-full h-96 rounded-lg'
      }`}
      ref={containerRef}
    >
      {floor?.image_url ? (
        <div
          className={`relative w-full h-full flex items-center justify-center ${
            zoomable ? 'cursor-move' : 'cursor-pointer'
          } ${isAddingPin ? 'cursor-crosshair' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onClick={handleImageClick}
        >
          {/* Map Image */}
          <div
            className="relative transition-transform"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`
            }}
          >
            <img
              ref={imageRef}
              src={optimizeImageUrl(floor.image_url, {
                width: fullscreenMode ? 1200 : 800,
                quality: 'auto'
              })}
              alt={floor.name}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          
          {/* Pins */}
          {imageLoaded && pins.map(pin => (
            <PinMarker
              key={pin.id}
              pin={pin}
              containerRef={containerRef as RefObject<HTMLDivElement>}
              isSelected={pin.id === selectedPinId}
              isEditable={isEditable}
              onClick={onPinClick}
              onEdit={onEditPin}
              onDelete={onDeletePin}
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">画像がありません</p>
        </div>
      )}
      
      {/* コントロールパネル */}
      {floor?.image_url && zoomable && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow-md"
            title={fullscreenMode ? "全画面を解除" : "全画面表示"}
          >
            {fullscreenMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a2 2 0 012-2h2a1 1 0 010 2H7v2a1 1 0 01-2 0zm10 0V7h-2a1 1 0 110-2h2a2 2 0 012 2v2a1 1 0 11-2 0zM5 11a1 1 0 112 0v2h2a1 1 0 110 2H7a2 2 0 01-2-2v-2zm10 0a1 1 0 112 0v2a2 2 0 01-2 2h-2a1 1 0 110-2h2v-2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button
            onClick={zoomIn}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow-md"
            disabled={scale >= 3}
            title="拡大"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={zoomOut}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow-md"
            disabled={scale <= 0.5}
            title="縮小"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={resetZoom}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow-md"
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            title="リセット"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}