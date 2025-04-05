// app/viewer/[mapId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ViewerAPI } from '@/lib/api-client';
import { ViewerMapData, Floor, Pin } from '@/types';
import Loading from '@/components/Loading';
import MapViewer from '@/components/MapViewer';
import BookmarkList from '@/components/BookmarkList';
import PinDetailModal from '@/components/PinDetailModal';

export default function ViewerPage() {
  const params = useParams();
  const router = useRouter();
  const mapId = params.mapId as string;
  
  const [viewerData, setViewerData] = useState<ViewerMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [showPinDetailModal, setShowPinDetailModal] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  
  // データの取得
  useEffect(() => {
    if (!mapId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await ViewerAPI.getMapData(mapId);
        setViewerData(data);
        
        // 最初のフロアをアクティブに設定
        if (data.floors.length > 0) {
          setActiveFloor(data.floors[0]);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError(error instanceof Error ? error.message : 'マップの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mapId]);
  
  // ピンクリック時の処理
  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
    setShowPinDetailModal(true);
  };
  
  // フルスクリーンの切り替え
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }
  
  if (error || !viewerData) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-red-600">エラー</h2>
          <p className="mb-4 text-gray-700">{error || 'マップデータの取得に失敗しました'}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    );
  }
  
  const { map, floors, pins } = viewerData;
  
  return (
    <div className={`${fullscreen ? 'fixed inset-0 z-50 bg-black' : 'container mx-auto p-6'}`}>
      {!fullscreen && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{map.title}</h1>
          {map.description && <p className="text-gray-600 mt-1">{map.description}</p>}
        </div>
      )}
      
      <div className={`grid ${fullscreen ? '' : 'grid-cols-1 lg:grid-cols-4 gap-6'}`}>
        {/* サイドバー (フルスクリーン時は非表示) */}
        {!fullscreen && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="font-semibold text-lg mb-3">エリア選択</h2>
              
              <div className="space-y-2">
                {floors.map((floor) => (
                  <div
                    key={floor.id}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      activeFloor?.id === floor.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveFloor(floor)}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {floor.floor_number}
                        </div>
                      </div>
                      <span className="font-medium">{floor.name}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  {showBookmarks ? 'しおり一覧を隠す' : 'しおり一覧を表示'}
                </button>
              </div>
            </div>
            
            {/* しおり一覧 */}
            {showBookmarks && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="font-semibold text-lg mb-3">しおり一覧</h2>
                
                <BookmarkList
                  pins={pins}
                  floors={floors}
                  activeFloorId={activeFloor?.id}
                  onPinClick={handlePinClick}
                  selectedPinId={selectedPin?.id}
                />
              </div>
            )}
          </div>
        )}
        
        {/* メインコンテンツ */}
        <div className={`${fullscreen ? 'w-full h-screen' : 'lg:col-span-3'}`}>
          <div className={`${fullscreen ? 'h-full w-full' : 'bg-white rounded-lg shadow-md p-4'}`}>
            {!fullscreen && (
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">
                  {activeFloor ? activeFloor.name : 'エリアがありません'}
                </h2>
                
                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-sm"
                >
                  全画面表示
                </button>
              </div>
            )}
            
            {/* マップビューワー */}
            {activeFloor && (
              <div className="relative">
                <MapViewer
                  floor={activeFloor}
                  pins={pins.filter(pin => pin.floor_id === activeFloor.id)}
                  isEditable={false}
                  selectedPinId={selectedPin?.id}
                  onPinClick={handlePinClick}
                  zoomable={true}
                  fullscreen={fullscreen}
                />
                
                {fullscreen && (
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 bg-white/80 hover:bg-white rounded-full shadow-lg text-gray-700"
                      title="全画面を終了"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {fullscreen && (
                  <div className="absolute bottom-4 left-4 z-10">
                    <div className="bg-white/80 p-3 rounded-lg shadow-lg">
                      <h3 className="font-medium text-gray-900 mb-1">{activeFloor.name}</h3>
                      <div className="flex space-x-2">
                        {floors.map((floor) => (
                          <button
                            key={floor.id}
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activeFloor.id === floor.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => setActiveFloor(floor)}
                          >
                            {floor.floor_number}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ピン詳細モーダル */}
      <PinDetailModal
        pin={selectedPin}
        floors={floors}
        isOpen={showPinDetailModal}
        isEditable={false}
        onClose={() => setShowPinDetailModal(false)}
      />
    </div>
  );
}