// components/View3D.tsx
import React, { useEffect, useState, useRef } from 'react';
import PinMarker from '@/components/PinMarker';
import ResponsiveImage from '@/components/ResponsiveImage';
import { Pin, Floor } from '@/types/map-types';

interface View3DProps {
  floors: Floor[];
  pins: Pin[];
  frontFloorIndex: number;
  showArrows: boolean;
  onPrevFloor: () => void;
  onNextFloor: () => void;
  onImageClick?: (e: React.MouseEvent<HTMLDivElement>, floorId: string) => void;
  isAddingPin?: boolean;
}

const View3D: React.FC<View3DProps> = ({
  floors,
  pins,
  frontFloorIndex,
  showArrows,
  onPrevFloor,
  onNextFloor,
  onImageClick,
  isAddingPin = false,
}) => {
  // コンテナへの参照
  const containerRef = useRef<HTMLDivElement>(null);
  const floorRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement>}>({});

  // 全ピンをエリアIDでグループ化
  const [pinsByFloor, setPinsByFloor] = useState<Record<string, Pin[]>>({});

  // 各エリアへのrefを初期化
  useEffect(() => {
    floors.forEach(floor => {
      if (!floorRefs.current[floor.id]) {
        floorRefs.current[floor.id] = React.createRef();
      }
    });
  }, [floors]);

  useEffect(() => {
    // 各エリアのピンをグループ化
    const groupedPins: Record<string, Pin[]> = {};
    
    // すべてのエリアに対して空の配列を初期化
    floors.forEach(floor => {
      groupedPins[floor.id] = [];
    });
    
    // 各ピンを対応するエリアグループに追加
    pins.forEach(pin => {
      if (pin.floor_id && groupedPins[pin.floor_id]) {
        groupedPins[pin.floor_id].push(pin);
      }
    });
    
    setPinsByFloor(groupedPins);
  }, [floors, pins]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-96 bg-gray-100 overflow-hidden"
    >
      {/* エリア並び替え矢印ボタン */}
      {showArrows && floors.length > 1 && (
        <div className="absolute top-2 right-2 z-50 flex space-x-2">
          <button 
            onClick={onPrevFloor}
            className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition-colors"
            title="前のエリア"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={onNextFloor}
            className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition-colors"
            title="次のエリア"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {floors.length > 0 ? (
        <div className="absolute inset-0 flex items-center justify-center transform-style-3d" style={{ perspective: '800px' }}>
          {/* エリアを並べ替えて表示（frontFloorIndexを基準に） */}
          {Array.from({ length: floors.length }).map((_, index) => {
            // フロントに表示するエリアからの相対的なインデックスを計算
            const sortedIndex = (frontFloorIndex + index) % floors.length;
            const floor = floors[sortedIndex];
            
            // このエリアのピンを取得
            const floorPinsArray = pinsByFloor[floor.id] || [];
            
            // このエリアのrefを取得または作成
            if (!floorRefs.current[floor.id]) {
              floorRefs.current[floor.id] = React.createRef();
            }
            
            return (
              <div 
                key={floor.id}
                ref={floorRefs.current[floor.id]}
                className="absolute inset-0 transition-all duration-500"
                style={{
                  transform: `
                    perspective(800px) 
                    rotateX(30deg) 
                    rotateZ(-10deg) 
                    scale(1) 
                    translateY(${-40 + (index * -20)}px) 
                    translateX(${index * 30}px)
                    translateZ(${-index * 50}px)
                  `,
                  opacity: index === 0 ? 1 : (0.9 - index * 0.15 > 0.4 ? 0.9 - index * 0.15 : 0.4),
                  zIndex: floors.length - index,
                  // 前面以外を少し下にずらして、次のエリアが少し見えるようにする
                  marginTop: index === 0 ? 0 : `${index * 20}px` 
                }}
              >
                <div 
                  className="h-full w-full flex items-center justify-center border-2 border-gray-300 cursor-pointer rounded-lg overflow-hidden"
                  onClick={(e) => {
                    if (index === 0 && isAddingPin && onImageClick) {
                      onImageClick(e, floor.id);
                    }
                  }}
                >
                  {floor.image_url ? (
                    <ResponsiveImage
                      src={floor.image_url}
                      alt={`${floor.name}マップ`}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="text-center text-gray-500 w-full h-full flex items-center justify-center">
                      <p>{floor.name} - 画像未設定</p>
                    </div>
                  )}
                  
                  {/* このエリアのピンを表示 */}
                  {floorPinsArray.map((pin) => (
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
                      containerRef={floorRefs.current[floor.id]}
                    />
                  ))}
                </div>
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
                  {floor.name}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">
            エリア情報がありません
          </p>
        </div>
      )}
    </div>
  );
};

export default View3D;