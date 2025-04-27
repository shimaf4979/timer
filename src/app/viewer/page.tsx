'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PinList from '@/components/PinList';
import NormalView from '@/components/NormalView';
import LoadingIndicator from '@/components/LoadingIndicator';
import EnhancedPinViewer from '@/components/EnhancedPinViewer';
import { useViewerData } from '@/lib/api-hooks';
import { useUIStore, useMapEditStore } from '@/lib/store';
import { Floor, Pin } from '@/types/map-types';

// ViewerPageの中身コンポーネント
function ViewerContent() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get('id') || '';
  const floorId = searchParams.get('floor') || '';

  // Zustand ストアから状態と操作を取得
  const { error, setError } = useUIStore();
  const { selectedPinId, setSelectedPinId } = useMapEditStore();

  // TanStack Query でデータを取得
  const { data, isLoading, isError } = useViewerData(mapId);

  // マウント時に取得したデータを整理するためのローカル状態
  const [mapData, setMapData] = useState<any>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // フロントに表示するエリアのインデックス
  const [frontFloorIndex, setFrontFloorIndex] = useState(0);

  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const normalViewRef = useRef<HTMLDivElement>(null);

  // スマホ検出のためのuseEffect
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

  // 取得したデータを整理
  useEffect(() => {
    if (data) {
      setMapData(data.map);

      // フロアとピンの設定
      if (floorId) {
        // 指定されたフロアだけをセット
        const selectedFloor = data.floors.find((f: Floor) => f.id === floorId);
        if (selectedFloor) {
          setFloors([selectedFloor]);
          setActiveFloor(selectedFloor);
          // 選択したフロアのピンだけをフィルタリング
          setPins(data.pins.filter((p: Pin) => p.floor_id === floorId));
        } else {
          // 指定されたフロアが見つからない場合は最初のフロアを表示
          setFloors([data.floors[0]]);
          setActiveFloor(data.floors[0]);
          setPins(data.pins.filter((p: Pin) => p.floor_id === data.floors[0].id));
        }
      } else {
        // フロアが指定されていない場合は最初のフロアを表示
        if (data.floors.length > 0) {
          setFloors(data.floors);
          setActiveFloor(data.floors[0]);
          setPins(data.pins);
        } else {
          setFloors([]);
          setPins([]);
        }
      }
    }
  }, [data, floorId]);

  // エラー時の処理
  useEffect(() => {
    if (isError) {
      setError('データの取得に失敗しました');
    }
  }, [isError, setError]);

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

  // エリアの変更
  const handleFloorChange = (floor: Floor) => {
    setActiveFloor(floor);
  };

  // ピンをクリックしたときの処理
  const handlePinClick = (pin: Pin) => {
    // 既に選択中のピンをクリックした場合は選択を解除
    if (selectedPinId === pin.id) {
      setSelectedPinId(null);
    } else {
      // 新しいピンを選択
      setSelectedPinId(pin.id);

      // ピンがあるフロアをアクティブにする
      const pinFloor = floors.find((floor) => floor.id === pin.floor_id);
      if (pinFloor) {
        setActiveFloor(pinFloor);

        // 少し遅延してピンに視覚的にフォーカスを当てる
        setTimeout(() => {
          const pinElement = document.querySelector(`[data-pin-id="${pin.id}"]`);
          if (pinElement) {
            pinElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  };

  // グローバルな pinClick イベントを処理
  useEffect(() => {
    const handleGlobalPinClick = (e: Event) => {
      const customEvent = e as CustomEvent<Pin>;
      if (customEvent.detail) {
        handlePinClick(customEvent.detail);
      }
    };

    window.addEventListener('pinClick', handleGlobalPinClick);

    return () => {
      window.removeEventListener('pinClick', handleGlobalPinClick);
    };
  }, [selectedPinId, floors]); // 依存配列を更新

  // ロード中表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingIndicator message="データを読み込み中..." isFullScreen={false} />
        </div>
      </div>
    );
  }

  // エラー表示
  if (error || !mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold mb-2">エラー</h2>
          <p className="text-gray-600 mb-4">{error || 'マップが見つかりません。'}</p>
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
        {mapData.description && <p className="mb-6 text-gray-600">{mapData.description}</p>}

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
                  <div className="text-gray-500 text-center py-4">エリア情報がありません</div>
                )}
              </div>

              <Link
                href={`/pamphlet?id=${mapId}${activeFloor ? `&floor=${activeFloor.id}` : ''}`}
                className="inline-flex justify-center items-center px-4 py-2 text-white bg-sky-500 hover:bg-sky-600 rounded-md transition-colors w-full"
                target="_blank"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                    clipRule="evenodd"
                  />
                </svg>
                パンフレット表示
              </Link>
            </div>
          </div>

          {/* 右側の表示エリア */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                {`${activeFloor?.name || 'エリアを選択してください'} 表示`}
              </h2>
              <div
                ref={containerRef}
                className="relative bg-gray-100 rounded-lg overflow-hidden flex flex-col justify-center items-center"
              >
                <div ref={normalViewRef} className="w-full h-96 relative">
                  <NormalView
                    floor={activeFloor}
                    pins={[]} // 空のピン配列を渡す（カスタムピン表示を使う）
                  />

                  {/* 現在のフロアのピンのみを表示 */}
                  {activeFloor &&
                    pins
                      .filter((pin) => pin.floor_id === activeFloor.id)
                      .map((pin) => (
                        <EnhancedPinViewer
                          key={pin.id}
                          pin={pin}
                          floors={floors}
                          containerRef={normalViewRef}
                          isViewerMode={true}
                          isSelected={selectedPinId === pin.id}
                        />
                      ))}
                </div>
              </div>

              {/* ピン一覧 */}
              <div className="mt-6">
                <PinList
                  pins={pins}
                  floors={floors}
                  activeFloor={activeFloor?.id || null}
                  onPinClick={handlePinClick}
                  selectedPinId={selectedPinId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// メインのコンポーネント
export default function ViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
