// app/viewer/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapData, Floor, Pin } from '@/types/map-types';
import PinList from '@/components/PinList';
import View3D from '@/components/View3D';
import Modal from '@/components/Modal';
import PinInfo from '@/components/PinInfo';
import NormalView from '@/components/NormalView';

export default function ViewerPage() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get('id') || '';
  
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModalArrows, setShowModalArrows] = useState(true);
  
  // フロントに表示するエリアのインデックスを変更
  const [frontFloorIndex, setFrontFloorIndex] = useState(0);
  
  // 次の階を前面に表示
  const showNextFloor = () => {
    if (floors.length === 0) return;
    setFrontFloorIndex((prevIndex) => (prevIndex + 1) % floors.length);
  };
  
  // 前の階を前面に表示
  const showPrevFloor = () => {
    if (floors.length === 0) return;
    setFrontFloorIndex((prevIndex) => (prevIndex - 1 + floors.length) % floors.length);
  };

  // モーダル表示時は矢印を非表示にする
  useEffect(() => {
    setShowModalArrows(!isModalOpen);
  }, [isModalOpen]);

  // データ読み込み
  useEffect(() => {
    if (!mapId) {
      setError('マップIDが指定されていません');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // APIからマップデータを取得
        const response = await fetch(`/api/viewer/${mapId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'データの取得に失敗しました');
        }
        
        const data = await response.json();
        
        // データを設定
        setMapData(data.map);
        setFloors(data.floors);
        setPins(data.pins);
        
        // 最初のエリアをアクティブに設定
        if (data.floors && data.floors.length > 0) {
          setActiveFloor(data.floors[0]);
        }
        
        setError(null);
      } catch (error) {
        console.error('データの取得エラー:', error);
        setError(error instanceof Error ? error.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mapId]);

  // エリアの変更
  const handleFloorChange = (floor: Floor) => {
    setActiveFloor(floor);
  };

  // ピンをクリックしたときの処理
  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
    setIsModalOpen(true);
  };

  // 3D表示モードを切り替え
  const toggle3DView = () => {
    setIs3DView(!is3DView);
  };

  useEffect(() => {
    // ビューからのピンクリックイベントを処理
    const handleGlobalPinClick = (e: Event) => {
      const customEvent = e as CustomEvent<Pin>;
      if (customEvent.detail) {
        setSelectedPin(customEvent.detail);
        setIsModalOpen(true);
      }
    };
  
    window.addEventListener('pinClick', handleGlobalPinClick);
    
    return () => {
      window.removeEventListener('pinClick', handleGlobalPinClick);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">エラー</h2>
          <p className="text-gray-600 mb-4">
            {error || 'マップが見つかりません。'}
          </p>
          <Link href="/" className="text-blue-500 hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">{mapData.title}</h1>
        {mapData.description && (
          <p className="mb-6 text-gray-600">{mapData.description}</p>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左側のコントロールパネル */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">フロア選択</h2>
              
              {/* エリア選択 */}
              <div className="mb-6">
                {floors.length > 0 ? (
                  <div className="space-y-2">
                    {floors.map((floor) => (
                      <div 
                        key={floor.id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                          activeFloor?.id === floor.id 
                            ? 'bg-blue-100 border-l-4 border-blue-500' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleFloorChange(floor)}
                      >
                        <div className="mr-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {floor.floor_number}
                          </div>
                        </div>
                        <span>{floor.name}</span>
                        
                        {floor.image_url && (
                          <div className="ml-auto">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    エリア情報がありません
                  </div>
                )}
              </div>
              
              {/* 3D表示切り替えボタン */}
              <button
                onClick={toggle3DView}
                className={`w-full px-4 py-2 rounded-md transition-colors ${
                  is3DView 
                  ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
                } mb-4`}
                disabled={floors.length <= 1}
              >
                {is3DView ? '通常表示に戻す' : '3D表示にする'}
              </button>
              
              {/* ピン一覧 */}
              <div className="mt-4">
                <PinList
                  pins={pins}
                  floors={floors}
                  activeFloor={activeFloor?.id || null}
                  onPinClick={handlePinClick}
                  is3DView={is3DView}
                />
              </div>
            </div>
          </div>
          
          {/* 右側の表示エリア */}
          <div className="lg:col-span-3">
  <div className="bg-white rounded-lg shadow-md p-4 mb-6">
    <h2 className="text-lg font-semibold mb-4 text-gray-700">
      {is3DView ? '3D表示' : `${activeFloor?.name || 'エリアを選択してください'} 表示`}
    </h2>
    
    {is3DView ? (
      // 3D表示モード (改良版コンポーネントを使用)
      <View3D 
        floors={floors}
        pins={pins}
        frontFloorIndex={frontFloorIndex}
        showArrows={showModalArrows}
        onPrevFloor={showPrevFloor}
        onNextFloor={showNextFloor}
      />
    ) : (
      // 通常表示モード (新しいコンポーネントを使用)
      <NormalView
        floor={activeFloor}
        pins={pins}
      />
    )}
  </div>
</div>
</div>
        
        {/* ピン情報モーダル（閲覧専用のため編集・削除ボタンを表示しない） */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedPin?.title || 'ピン情報'}
        >
          {selectedPin && (
            <PinInfo
              pin={selectedPin}
              floors={floors}
              isEditable={false}
            />
          )}
        </Modal>
      </div>
    </main>
  );
}