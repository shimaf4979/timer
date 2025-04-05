// components/NormalView.tsx
import React, { useRef, useState } from 'react';
import ZoomableImage from '@/components/ZoomableImage';
import EnhancedPinMarker from '@/components/EnhancedPinMarker';
import { Pin, Floor } from '@/types/map-types';
import LoadingIndicator from '@/components/Loading';

interface NormalViewProps {
  floor: Floor | null;
  pins: Pin[];
  onImageClick?: (e: React.MouseEvent<HTMLDivElement>, x: number, y: number) => void;
  isAddingPin?: boolean;
  loadingProgress?: number;
}

const NormalView: React.FC<NormalViewProps> = ({
  floor,
  pins,
  onImageClick,
  isAddingPin = false,
  loadingProgress = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // フィルタリングされたピン (現在のフロアのみ)
  const filteredPins = floor ? pins.filter(pin => pin.floor_id === floor.id) : [];

  const handleImageLoaded = () => {
    setImageLoaded(true);
    
    // 画像の読み込み完了イベントを発火
    if (containerRef.current) {
      window.dispatchEvent(new CustomEvent('imageLoaded', { 
        detail: { 
          container: containerRef.current,
          src: floor?.image_url
        }
      }));
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, x: number, y: number) => {
    if (!onImageClick) return;
    
    // クリックハンドラに座標情報を渡す
    onImageClick(e, x, y);
  };

  if (!floor) {
    return (
      <div className="flex items-center justify-center bg-gray-100 h-96 rounded-lg border">
        <p className="text-gray-500">
          エリアを選択してください
        </p>
      </div>
    );
  }

  if (!floor.image_url) {
    return (
      <div className="flex items-center justify-center bg-gray-100 h-96 rounded-lg border">
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>画像を追加してください</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-gray-100 rounded-lg border"
    >
      <ZoomableImage
        src={floor.image_url}
        alt={`${floor.name}マップ`}
        onImageClick={handleImageClick}
        isAddPinMode={isAddingPin}
      >
        {/* ピンの表示 */}
        {imageLoaded && filteredPins.map((pin) => (
          <EnhancedPinMarker
            key={pin.id}
            pin={{
              id: pin.id,
              x: pin.x_position,
              y: pin.y_position,
              title: pin.title,
              description: pin.description,
              image_url: pin.image_url
            }}
            onClick={() => window.dispatchEvent(new CustomEvent('pinClick', { detail: pin }))}
          />
        ))}
      </ZoomableImage>
    </div>
  );
};

export default NormalView;