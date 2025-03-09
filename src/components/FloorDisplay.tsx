// components/FloorDisplay.tsx
import React from 'react';
import PinMarker from './PinMarker';
import { Floor, Pin } from '@/types/map-types';

interface FloorDisplayProps {
  is3DView: boolean;
  floors: Floor[];
  pins: Pin[];
  activeFloor: Floor | null;
  frontFloorIndex: number;
  showNextFloor: () => void;
  showPrevFloor: () => void;
  handleImageClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const FloorDisplay: React.FC<FloorDisplayProps> = ({
  is3DView,
  floors,
  pins,
  activeFloor,
  frontFloorIndex,
  showNextFloor,
  showPrevFloor,
  handleImageClick
}) => {
  // 3D表示の計算用関数
  const get3DStyles = (index: number) => ({
    transform: `
      perspective(800px) 
      rotateX(60deg) 
      rotateZ(-15deg) 
      scale(0.85) 
      translateY(${-80 + (index * -35)}px) 
      translateX(${index * 25}px)
      translateZ(${-index * 10}px)
    `,
    opacity: index === 0 ? 1 : (0.9 - index * 0.15 > 0.4 ? 0.9 - index * 0.15 : 0.4),
    zIndex: floors.length - index
  });

  if (is3DView) {
    return (
      <div className="relative w-full h-96 bg-gray-100 overflow-hidden">
        {/* エリア並び替え矢印ボタン */}
        <div className="absolute top-2 right-2 z-[100] flex space-x-2">
          <button 
            onClick={showPrevFloor}
            className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition-colors"
            title="前のエリア"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={showNextFloor}
            className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition-colors"
            title="次のエリア"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center transform-style-3d" style={{ perspective: '800px' }}>
          {floors.length > 0 ? (
            Array.from({ length: floors.length }).map((_, index) => {
              // フロントに表示するエリアからの相対的なインデックスを計算
              const sortedIndex = (frontFloorIndex + index) % floors.length;
              const floor = floors[sortedIndex];
              
              return (
                <div 
                  key={floor.id}
                  className="absolute inset-0 transition-all duration-500"
                  style={get3DStyles(index)}
                >
                  <div 
                    className="h-full w-full flex items-center justify-center border-2 border-gray-300 cursor-pointer rounded-lg overflow-hidden"
                    onClick={index === 0 && handleImageClick ? handleImageClick : undefined}
                  >
                    {floor.image_url ? (
                      <img
                        src={floor.image_url}
                        alt={`${floor.name}マップ`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <p>{floor.name} - 画像未設定</p>
                      </div>
                    )}
                    
                    {/* その階のピンを表示 */}
                    {pins.filter(pin => pin.floor_id === floor.id).map((pin) => (
                      <PinMarker
                        key={pin.id}
                        pin={{
                          ...pin,
                          x: pin.x_position,
                          y: pin.y_position,
                          floor: floor.floor_number
                        }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
                    {floor.name}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                エリアがありません
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="relative w-full h-96 border rounded-lg overflow-hidden"
      onClick={handleImageClick}
    >
      {activeFloor ? (
        activeFloor.image_url ? (
          <img
            src={activeFloor.image_url}
            alt={`${activeFloor.name}マップ`}
            className="w-full h-full object-cover"
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
            エリアを選択してください
          </p>
        </div>
      )}
      
      {/* 現在選択されている階のピンを表示 */}
      {activeFloor && pins.filter(pin => pin.floor_id === activeFloor.id).map((pin) => (
        <PinMarker
          key={pin.id}
          pin={{
            ...pin,
            x: pin.x_position,
            y: pin.y_position,
            floor: activeFloor ? activeFloor.floor_number : 1
          }}
        />
      ))}
    </div>
  );
};

export default FloorDisplay;