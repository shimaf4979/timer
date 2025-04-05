// components/ImprovedView3D.tsx
import React, { useEffect, useState, useRef } from 'react';
import ImprovedPinMarker3D from './ImprovedPinMarker3D';
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
  onPinClick?: (pin: Pin) => void;
  isAddingPin?: boolean;
  isEditMode?: boolean; // 編集モードかどうか
}

const ImprovedView3D: React.FC<View3DProps> = ({
  floors,
  pins,
  frontFloorIndex,
  showArrows,
  onPrevFloor,
  onNextFloor,
  onImageClick,
  onPinClick,
  isAddingPin = false,
  isEditMode = false,
}) => {
  // コンテナへの参照
  const containerRef = useRef<HTMLDivElement>(null);
  const floorContainerRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement | null>}>({});

  // 全ピンをエリアIDでグループ化
  const [pinsByFloor, setPinsByFloor] = useState<Record<string, Pin[]>>({});
  
  // 画像の読み込み状態を管理
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // 各エリアへのrefを初期化
  useEffect(() => {
    floors.forEach(floor => {
      if (!floorContainerRefs.current[floor.id]) {
        floorContainerRefs.current[floor.id] = React.createRef();
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
  
  // 画像が読み込まれたことを記録
  const handleImageLoad = (floorId: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [floorId]: true
    }));
    
    // 少し遅延させてピンを更新するイベントを発生させる
    setTimeout(() => {
      window.dispatchEvent(new Event('imageLoaded'));
    }, 100);
  };

  // フロア要素のクリックハンドラー
  const handleFloorClick = (e: React.MouseEvent<HTMLDivElement>, floorId: string) => {
    if (isAddingPin && onImageClick) {
      // 画像の位置と大きさを取得
      const floorContainer = e.currentTarget;
      const image = floorContainer.querySelector('img');
      
      if (image) {
        const imageRect = image.getBoundingClientRect();
        const containerRect = floorContainer.getBoundingClientRect();
        
        // 画像内でのクリック位置を確認
        if (
          e.clientX >= imageRect.left && 
          e.clientX <= imageRect.right && 
          e.clientY >= imageRect.top && 
          e.clientY <= imageRect.bottom
        ) {
          // 画像内でのクリック位置（パーセンテージ）
          const xPercent = ((e.clientX - imageRect.left) / imageRect.width) * 100;
          const yPercent = ((e.clientY - imageRect.top) / imageRect.height) * 100;
          
          // カスタムイベントに位置情報を追加
          const customEvent = {
            ...e,
            exactPosition: { x: xPercent, y: yPercent }
          };
          
          // クリックハンドラーを呼び出す
          onImageClick(customEvent as any, floorId);
        }
      }
    }
  };

  // ピンクリックのハンドラー
  const handlePinClick = (pin: Pin) => {
    if (onPinClick) {
      onPinClick(pin);
    } else {
      window.dispatchEvent(new CustomEvent('pinClick', { detail: pin }));
    }
  };

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
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '800px' }}>
          {/* エリアを並べ替えて表示（frontFloorIndexを基準に） */}
          {Array.from({ length: floors.length }).map((_, index) => {
            // フロントに表示するエリアからの相対的なインデックスを計算
            const sortedIndex = (frontFloorIndex + index) % floors.length;
            const floor = floors[sortedIndex];
            
            // このエリアのピンを取得
            const floorPinsArray = pinsByFloor[floor.id] || [];
            
            // このエリアのrefを取得または作成
            if (!floorContainerRefs.current[floor.id]) {
              floorContainerRefs.current[floor.id] = React.createRef();
            }
            
            // z-indexの計算（レイヤーの重なり順）
            const zIndex = floors.length - index;
            
            // 3D変形の計算
            const transform = `
              perspective(800px) 
              rotateX(30deg) 
              rotateZ(-10deg) 
              scale(${1 - index * 0.05}) 
              translateY(${-40 + (index * -20)}px) 
              translateX(${index * 30}px)
              translateZ(${-index * 50}px)
            `;
            
            return (
              <div 
                key={floor.id}
                className="absolute inset-0 transition-all duration-500 floor-container"
                style={{
                  transform: transform,
                  opacity: index === 0 ? 1 : (0.9 - index * 0.15 > 0.4 ? 0.9 - index * 0.15 : 0.4),
                  zIndex: zIndex,
                  // 前面以外を少し下にずらして、次のエリアが少し見えるようにする
                  marginTop: index === 0 ? 0 : `${index * 20}px`
                }}
              >
                <div 
                  className="h-full w-full border-2 border-gray-300 cursor-pointer rounded-lg overflow-hidden"
                  onClick={(e) => {
                    if (index === 0) {
                      handleFloorClick(e, floor.id);
                    }
                  }}
                >
                  <div 
                    ref={floorContainerRefs.current[floor.id]}
                    className="relative w-full h-full flex items-center justify-center image-container"
                  >
                    {floor.image_url ? (
                      <>
                        <ResponsiveImage
                          src={floor.image_url}
                          alt={`${floor.name}マップ`}
                          className="w-full h-full"
                          onLoad={() => handleImageLoad(floor.id)}
                        />
                        
                        {/* ピンを配置 - 画像が読み込まれた後のみ表示 */}
                        {loadedImages[floor.id] && floorPinsArray.map((pin) => (
                          <ImprovedPinMarker3D
                            key={pin.id}
                            pin={{
                              id: pin.id,
                              x: pin.x_position,
                              y: pin.y_position,
                              title: pin.title,
                              description: pin.description
                            }}
                            floorId={floor.id}
                            onClick={() => handlePinClick(pin)}
                            isEditable={isEditMode}
                          />
                        ))}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 w-full h-full flex items-center justify-center">
                        <p>{floor.name} - 画像未設定</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
                    {floor.name}
                  </div>
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

export default ImprovedView3D;