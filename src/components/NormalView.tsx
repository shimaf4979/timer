// components/NormalView.tsx
import React, { useRef, useEffect, useState } from 'react';
import PinMarker from '@/components/PinMarker';
import ResponsiveImage from '@/components/ResponsiveImage';
import { Pin, Floor } from '@/types/map-types';
import { getExactImagePosition } from '@/utils/imageExactPositioning';

interface NormalViewProps {
  floor: Floor | null;
  pins: Pin[];
  onImageClick?: (e: React.MouseEvent<HTMLDivElement>, exact: { x: number, y: number } | null) => void;
  loadingProgress?: number;
}

const NormalView: React.FC<NormalViewProps> = ({
  floor,
  pins,
  onImageClick,
  loadingProgress = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  
  // フィルタリングされたピン (現在のフロアのみ)
  const filteredPins = floor ? pins.filter(pin => pin.floor_id === floor.id) : [];

  // 画像が完全に読み込まれたかどうか
  const [imageLoaded, setImageLoaded] = useState(false);

  // 画像のクリックハンドラ
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onImageClick) return;
    
    // 画像上の正確な位置を計算
    const exactPosition = getExactImagePosition(e, imageWrapperRef as React.RefObject<HTMLElement>);
    
    // クリックハンドラに正確な位置情報を渡す
    onImageClick(e, exactPosition);
  };

  // 画像の読み込み完了時に実行される処理
  useEffect(() => {
    const handleImageLoaded = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && imageWrapperRef.current) {
        // 現在のフロア画像が読み込まれた場合のみ処理
        if (floor && floor.image_url === customEvent.detail.src) {
          setImageLoaded(true);
        }
      }
    };

    window.addEventListener('imageLoaded', handleImageLoaded);
    
    return () => {
      window.removeEventListener('imageLoaded', handleImageLoaded);
    };
  }, [floor]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-96 border rounded-lg overflow-hidden bg-gray-50"
    >
      {floor ? (
        floor.image_url ? (
          <div 
            ref={imageWrapperRef} 
            className="w-full h-full flex items-center justify-center cursor-pointer" 
            onClick={handleImageClick}
            data-floor-id={floor.id}
          >
            <ResponsiveImage
              src={floor.image_url}
              alt={`${floor.name}マップ`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* 現在選択されている階のピンを表示 - 画像が読み込まれた後に表示 */}
            {imageLoaded && filteredPins.map((pin) => (
              <PinMarker
                key={pin.id}
                pin={{
                  id: pin.id,
                  x: pin.x_position,
                  y: pin.y_position,
                  title: pin.title,
                  description: pin.description
                }}
                onClick={() => window.dispatchEvent(new CustomEvent('pinClick', { detail: pin }))}
                containerRef={imageWrapperRef}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-100 h-full">
            <div className="text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>画像を追加してください</p>
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center bg-gray-100 h-full">
          <p className="text-gray-500">
            左側からエリアを選択してください
          </p>
        </div>
      )}
    </div>
  );
};

export default NormalView;