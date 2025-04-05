// components/ZoomableImage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ZoomableImageProps {
  src: string;
  alt: string;
  onImageClick?: (e: React.MouseEvent<HTMLDivElement>, x: number, y: number) => void;
  children?: React.ReactNode;
  isAddPinMode?: boolean;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt,
  onImageClick,
  children,
  isAddPinMode = false
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // フルスクリーン表示の切り替え
  const toggleFullscreen = () => {
    if (!fullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // フルスクリーン状態の変更を監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // ズームのリセット
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // ズームイン
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  // ズームアウト
  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  // 画像クリック時の処理
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging || !isAddPinMode || !onImageClick || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    // クリック座標をコールバックに渡す
    onImageClick(e, xPercent, yPercent);
  };

  // ホイールでのズーム
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.1, 4));
    } else {
      setScale((prev) => Math.max(prev - 0.1, 0.5));
    }
  };

  // コントロールパネルの表示/非表示切り替え
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${fullscreen ? 'w-screen h-screen' : 'w-full h-96'} bg-gray-100 border rounded-lg`}
      onWheel={handleWheel}
    >
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setTimeout(() => setDragging(false), 100)}
        style={{ scale }}
        onClick={handleImageClick}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="max-w-none pointer-events-none"
          style={{ touchAction: 'none' }}
          draggable={false}
          onLoad={() => {
            // 画像が読み込まれたらイベントを発火
            window.dispatchEvent(new Event('imageLoaded'));
          }}
        />
        {children}
      </motion.div>

      {/* コントロールボタン */}
      <button
        onClick={toggleControls}
        className="absolute top-2 right-2 z-20 bg-white/80 p-2 rounded-full shadow-md"
        title={showControls ? "コントロールを隠す" : "コントロールを表示"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {showControls && (
        <div className="absolute bottom-4 right-4 z-20 flex gap-2">
          <button
            onClick={zoomOut}
            className="bg-white/80 p-2 rounded-full shadow-md"
            title="ズームアウト"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={zoomIn}
            className="bg-white/80 p-2 rounded-full shadow-md"
            title="ズームイン"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={resetZoom}
            className="bg-white/80 p-2 rounded-full shadow-md"
            title="リセット"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-white/80 p-2 rounded-full shadow-md"
            title={fullscreen ? "フルスクリーン解除" : "フルスクリーン"}
          >
            {fullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-2 0V5a3 3 0 013-3h4a1 1 0 010 2H5zm10 8a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h4a1 1 0 001-1v-4a1 1 0 112 0zm-8 5a1 1 0 01-1-1v-4a1 1 0 00-1-1H1a1 1 0 010-2h4a3 3 0 013 3v4a1 1 0 01-1 1zM15 2a3 3 0 013 3v4a1 1 0 01-2 0V5a1 1 0 00-1-1h-4a1 1 0 110-2h4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* 画像の読み込み中のインジケーター */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 pointer-events-none opacity-0 transition-opacity duration-300" style={{ opacity: src ? 0 : 1 }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
};

export default ZoomableImage;