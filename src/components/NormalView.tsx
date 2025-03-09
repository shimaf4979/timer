// components/NormalView.tsx
import React, { useRef } from 'react';
import PinMarker from '@/components/PinMarker';
import ResponsiveImage from '@/components/ResponsiveImage';
import { Pin, Floor } from '@/types/map-types';

interface NormalViewProps {
  floor: Floor | null;
  pins: Pin[];
  onImageClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const NormalView: React.FC<NormalViewProps> = ({
  floor,
  pins,
  onImageClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // フィルタリングされたピン (現在のフロアのみ)
  const filteredPins = floor ? pins.filter(pin => pin.floor_id === floor.id) : [];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-96 cursor-pointer border rounded-lg overflow-hidden"
      onClick={onImageClick}
    >
      {floor ? (
        floor.image_url ? (
          <ResponsiveImage
            src={floor.image_url}
            alt={`${floor.name}マップ`}
            onClick={onImageClick}
          />
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
      
      {/* 現在選択されている階のピンを表示 */}
      {filteredPins.map((pin) => (
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
          containerRef={containerRef}
        />
      ))}
    </div>
  );
};

export default NormalView;