// app/maps/[mapId]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { MapData, Floor, Pin } from '@/types/map-types';
import PinList from '@/components/PinList';
import View3D from '@/components/View3D';
import Modal from '@/components/Modal';
import PinInfo from '@/components/PinInfo';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import NormalView from '@/components/NormalView';

export default function MapEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const mapId = params.mapId as string;

  // ステート
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [newPinPosition, setNewPinPosition] = useState({ x: 0, y: 0 });
  const [newPinInfo, setNewPinInfo] = useState({ title: '', description: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [showPinList, setShowPinList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddFloorForm, setShowAddFloorForm] = useState(false);
  const [newFloor, setNewFloor] = useState({ floor_number: 1, name: '' });
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
    setShowModalArrows(!(isModalOpen || isEditModalOpen || isFormOpen));
  }, [isModalOpen, isEditModalOpen, isFormOpen]);

  // 初期データ取得
  useEffect(() => {
    if (status === 'loading') return;

    // 非認証ユーザーはログインページへリダイレクト
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // マップデータの取得
    fetchMapData();
  }, [session, status, router, mapId]);

  // マップデータを取得
  const fetchMapData = async () => {
    setLoading(true);
    try {
      // マップ情報を取得
      const mapResponse = await fetch(`/api/maps/${mapId}`);
      if (!mapResponse.ok) {
        throw new Error('マップの取得に失敗しました');
      }
      const mapData = await mapResponse.json();
      setMapData(mapData);

      // エリア情報を取得
      const floorsResponse = await fetch(`/api/maps/${mapId}/floors`);
      if (!floorsResponse.ok) {
        throw new Error('エリアの取得に失敗しました');
      }
      const floorsData = await floorsResponse.json();
      setFloors(floorsData);
      
      // 最初のエリアをアクティブに設定
      if (floorsData.length > 0) {
        setActiveFloor(floorsData[0]);
        
        // 最初のエリアのピンを取得
        await fetchPins(floorsData[0].id);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('データの取得中にエラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  // 特定のエリアのピンを取得
  const fetchPins = async (floorId: string) => {
    try {
      const response = await fetch(`/api/floors/${floorId}/pins`);
      if (!response.ok) {
        throw new Error('ピンの取得に失敗しました');
      }
      const pinsData = await response.json();
      setPins(pinsData);
    } catch (error) {
      console.error('ピンの取得エラー:', error);
    }
  };

  // アクティブなエリアを変更
  const handleFloorChange = async (floor: Floor) => {
    setActiveFloor(floor);
    await fetchPins(floor.id);
  };

  // エリアの追加
  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapData) return;

    try {
      const response = await fetch(`/api/maps/${mapId}/floors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFloor),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'エリアの追加に失敗しました');
      }

      const newFloorData = await response.json();
      
      // エリアリストを更新し、新しいエリアをアクティブに設定
      setFloors([...floors, newFloorData]);
      setActiveFloor(newFloorData);
      setNewFloor({ floor_number: floors.length > 0 ? Math.max(...floors.map(f => f.floor_number)) + 1 : 1, name: '' });
      setShowAddFloorForm(false);
      
      // 新しいエリアのピンリストを初期化
      setPins([]);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('エリアの追加に失敗しました');
      }
    }
  };

  // エリアの削除
  const handleDeleteFloor = async (floorId: string) => {
    if (!window.confirm('このエリアを削除してもよろしいですか？ 関連するピンもすべて削除されます。')) {
      return;
    }

    try {
      const response = await fetch(`/api/floors/${floorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'エリアの削除に失敗しました');
      }

      // 削除したエリアを除外
      const updatedFloors = floors.filter(floor => floor.id !== floorId);
      setFloors(updatedFloors);
      
      // 削除したエリアがアクティブだった場合、別のエリアをアクティブに設定
      if (activeFloor?.id === floorId) {
        if (updatedFloors.length > 0) {
          setActiveFloor(updatedFloors[0]);
          fetchPins(updatedFloors[0].id);
        } else {
          setActiveFloor(null);
          setPins([]);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('エリアの削除に失敗しました');
      }
    }
  };

  // 画像アップロード
  const handleImageUpload = async (floorId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/floors/${floorId}/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '画像のアップロードに失敗しました');
      }

      const updatedFloor = await response.json();
      
      // エリアリストを更新
      setFloors(floors.map(floor => 
        floor.id === updatedFloor.id ? updatedFloor : floor
      ));
      
      // アクティブなエリアが更新された場合、アクティブなエリアも更新
      if (activeFloor?.id === updatedFloor.id) {
        setActiveFloor(updatedFloor);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('画像のアップロードに失敗しました');
      }
    }
  };

  // 写真上でクリックした位置にピンを追加するモードを切り替える
  const toggleAddPinMode = () => {
    setIsAddingPin(!isAddingPin);
  };

  // 3D表示モードを切り替え
  const toggle3DView = () => {
    setIs3DView(!is3DView);
  };



  // 新しいピンの情報を保存
  const savePin = async () => {
    if (!activeFloor || newPinInfo.title.trim() === '') return;
    
    try {
      const response = await fetch(`/api/floors/${activeFloor.id}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newPinInfo.title,
          description: newPinInfo.description,
          x_position: newPinPosition.x,
          y_position: newPinPosition.y,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ピンの追加に失敗しました');
      }

      const newPin = await response.json();
      
      // ピンリストを更新
      setPins([...pins, newPin]);
      setNewPinInfo({ title: '', description: '' });
      setIsFormOpen(false);
      setIsAddingPin(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('ピンの追加に失敗しました');
      }
    }
  };

  // ピンをクリックしたときの処理
  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
    setIsModalOpen(true);
  };

    useEffect(() => {
        // 3Dビューからのピンクリックイベントを処理
        const handlePinClick = (e: Event) => {
        const customEvent = e as CustomEvent<Pin>;
        if (customEvent.detail) {
            setSelectedPin(customEvent.detail);
            setIsModalOpen(true);
        }
        };

        window.addEventListener('pinClick', handlePinClick);
        
        return () => {
        window.removeEventListener('pinClick', handlePinClick);
        };
    }, []);


  // ピンの編集を開始
//   const handleEditPin = (pin: Pin) => {
//     setEditingPin(pin);
//     setIsEditModalOpen(true);
//     setIsModalOpen(false);
//   };

  // 全ピンを取得する関数の修正
const fetchAllPins = async () => {
    try {
      // マップに関連する全てのエリアのIDを取得
      const floorIds = floors.map(floor => floor.id);
      if (floorIds.length === 0) return;
  
      // すべてのエリアのピンを一度に取得
      const promises = floorIds.map(floorId => 
        fetch(`/api/floors/${floorId}/pins`)
          .then(res => res.ok ? res.json() : [])
      );
  
      const results = await Promise.all(promises);
      
      // すべてのピンをフラットな配列に結合
      const allPins = results.flat();
      setPins(allPins);
    } catch (error) {
      console.error('全ピンの取得エラー:', error);
      setError('ピンの取得に失敗しました');
    }
  };
  
  // フロアデータ取得後に全ピンを取得するよう修正
  useEffect(() => {
    if (floors.length > 0) {
      fetchAllPins();
    }
  }, [floors]);
  
  // ピンの更新関数を修正
  const updatePin = async (updatedPin: Pin) => {
    try {
      const response = await fetch(`/api/pins/${updatedPin.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: updatedPin.title,
          description: updatedPin.description,
        }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ピンの更新に失敗しました');
      }
  
      const pinnData = await response.json();
      
      // ピンリストを更新
      setPins(pins.map(pin => pin.id === pinnData.id ? pinnData : pin));
      
      // モーダルを閉じる
      setIsEditModalOpen(false);
      setSelectedPin(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('ピンの更新に失敗しました');
      }
    }
  };
  
  // ピンの削除関数を修正
  const deletePin = async (pinId: string) => {
    try {
      const response = await fetch(`/api/pins/${pinId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ピンの削除に失敗しました');
      }
  
      // ピンリストを更新
      setPins(pins.filter(pin => pin.id !== pinId));
      
      // モーダルを閉じる
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedPin(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('ピンの削除に失敗しました');
      }
    }
  };

  useEffect(() => {
    // 3Dビューまたは通常ビューからのピンクリックイベントを処理
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

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, floorId?: string) => {
    if (!isAddingPin) return;
  
    const targetFloorId = floorId || (activeFloor?.id || '');
    if (!targetFloorId) return;
  
    // ターゲットとなる要素を取得
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    
    // クリック位置をパーセンテージで計算
    // これにより、どのデバイスサイズでも正確な位置を取得できる
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setNewPinPosition({ x, y });
    setNewPinInfo({ title: '', description: '' });
    setIsFormOpen(true);
  };





  if (loading && status !== 'loading') {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">マップ編集</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">マップ編集</h1>
        {/* <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          マップが見つかりません。
        </div> */}
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ダッシュボードに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {mapData.title} の編集
          </h1>
          <div className="flex space-x-2">
            <QRCodeGenerator 
              url={`/viewer?id=${mapId}`} 
              title={`${mapData.title}_QR`}
            />
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側のコントロールパネル */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">コントロールパネル</h2>
              
              {/* エリア選択 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-600">エリア選択</h3>
                  <button
                    onClick={() => setShowAddFloorForm(!showAddFloorForm)}
                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded cursor-pointer"
                  >
                    {showAddFloorForm ? 'キャンセル' : 'エリア追加'}
                  </button>
                </div>
                
                {/* エリア追加フォーム */}
                {showAddFloorForm && (
                  <form onSubmit={handleAddFloor} className="mb-4 p-3 bg-gray-50 rounded-md">
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        エリア
                      </label>
                      <input
                        title="floor-number"
                        placeholder="floor-number"
                        type="number"
                        value={newFloor.floor_number}
                        onChange={(e) => setNewFloor({
                          ...newFloor,
                          floor_number: parseInt(e.target.value)
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        名前
                      </label>
                      <input
                        type="text"
                        value={newFloor.name}
                        onChange={(e) => setNewFloor({
                          ...newFloor,
                          name: e.target.value
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="1階, 2階など"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      追加
                    </button>
                  </form>
                )}
                
                {/* エリアリスト */}
                {floors.length > 0 ? (
                  <div className="space-y-2">
                    {floors.map((floor) => (
                      <div 
                        key={floor.id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          activeFloor?.id === floor.id 
                            ? 'bg-blue-100 border-l-4 border-blue-500' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleFloorChange(floor)}
                      >
                        <div className="flex items-center">
                          <div className="mr-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {floor.floor_number}
                            </div>
                          </div>
                          <span>{floor.name}</span>
                        </div>
                        
                        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                          <label className="relative cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleImageUpload(floor.id, e.target.files[0]);
                                }
                              }}
                            />
                            <div className={`px-3 py-2 rounded text-sm ${
                              floor.image_url 
                                ? 'bg-green-500 text-white' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}>
                              {floor.image_url ? '変更' : '画像追加'}
                            </div>
                          </label>
                          <button
                            onClick={() => handleDeleteFloor(floor.id)}
                            className="mx-3 px-2 py-1 bg-red-400 text-white rounded text-sm hover:bg-red-200 cursor-pointer"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    エリアがありません。「エリア追加」ボタンから追加してください。
                  </div>
                )}
              </div>
              
              {/* アクションボタン */}
              <div className="space-y-3">
                <button
                  onClick={toggleAddPinMode}
                  className={`w-full px-4 py-2 rounded-md transition-colors ${
                    isAddingPin 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={!activeFloor || !activeFloor.image_url}
                >
                  {isAddingPin ? 'ピン追加モードを終了' : 'ピンを追加'}
                </button>
                
                <button
                  onClick={toggle3DView}
                  className={`w-full px-4 py-2 rounded-md transition-colors ${
                    is3DView 
                    ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                  disabled={floors.length === 0}
                >
                  {is3DView ? '通常表示に戻す' : '3D表示にする'}
                </button>
                
                <button
                  onClick={() => setShowPinList(!showPinList)}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                >
                  {showPinList ? 'ピン一覧を閉じる' : 'ピン一覧を表示'}
                </button>
                
                {/* 閲覧ページへのリンク */}
                <Link
                  href={`/viewer?id=${mapId}`}
                  target="_blank"
                  className="block w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors text-center"
                >
                  閲覧ページを表示
                </Link>
              </div>
              
              {/* ピン一覧 */}
              {showPinList && (
                <div className="mt-6">
                  <PinList 
                    pins={pins} 
                    floors={floors}
                    activeFloor={activeFloor?.id || null} 
                    onPinClick={handlePinClick}
                    is3DView={is3DView}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* 右側の表示エリア */}
          <div className="lg:col-span-2">
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
        onImageClick={handleImageClick}
        isAddingPin={isAddingPin}
      />
    ) : (
      // 通常表示モード (新しいコンポーネントを使用)
      <NormalView
        floor={activeFloor}
        pins={pins}
                onImageClick={(e) => handleImageClick(e)}
      />
    )}
    </div>
    </div>
    </div>
            
       
        
        {/* ピン情報入力モーダル */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setIsAddingPin(false);
          }}
          title="ピン情報を入力"
        >
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">タイトル</label>
            <input
              type="text"
              value={newPinInfo.title}
              onChange={(e) => setNewPinInfo({ ...newPinInfo, title: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="タイトルを入力"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">説明</label>
            <textarea
              value={newPinInfo.description}
              onChange={(e) => setNewPinInfo({ ...newPinInfo, description: e.target.value })}
              className="w-full p-2 border rounded-md h-32"
              placeholder="説明を入力"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsFormOpen(false);
                setIsAddingPin(false);
              }}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
            >
              キャンセル
            </button>
            <button
              onClick={savePin}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </Modal>
        
        {/* ピン情報表示モーダル */}
        <Modal
  isOpen={isModalOpen}
  onClose={() => {
    setIsModalOpen(false);
    setSelectedPin(null);  // モーダルを閉じるときに選択中のピンもクリア
  }}
  title={selectedPin?.title || 'ピン情報'}
>
  {selectedPin && (
    <PinInfo
      pin={selectedPin}
      floors={floors}
      isEditable={true}
      onEdit={() => {
        setEditingPin(selectedPin);
        setIsEditModalOpen(true);
        setIsModalOpen(false);  // 編集モーダルを開く前に情報モーダルを閉じる
      }}
      onDelete={() => deletePin(selectedPin.id)}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedPin(null);
      }}
    />
  )}
</Modal>

<Modal
  isOpen={isEditModalOpen}
  onClose={() => {
    setIsEditModalOpen(false);
    setEditingPin(null);  // 編集モーダルを閉じるときに編集中のピンもクリア
  }}
  title="ピン情報を編集"
>
  {editingPin && (
    <div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">タイトル</label>
        <input
          type="text"
          value={editingPin.title}
          onChange={(e) => setEditingPin({ ...editingPin, title: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="タイトルを入力"
        />
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">説明</label>
        <textarea
          value={editingPin.description}
          onChange={(e) => setEditingPin({ ...editingPin, description: e.target.value })}
          className="w-full p-2 border rounded-md h-32"
          placeholder="説明を入力"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => {
            setIsEditModalOpen(false);
            setEditingPin(null);
          }}
          className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
        >
          キャンセル
        </button>
        <button
          onClick={() => {
            updatePin(editingPin);
            // updatePin内でモーダルを閉じるようにした
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          保存
        </button>
      </div>
    </div>
  )}
</Modal>
      </div>
    </div>
  );
}