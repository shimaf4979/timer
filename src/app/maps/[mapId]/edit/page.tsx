// app/maps/[mapId]/edit/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth';
import { MapAPI, FloorAPI, PinAPI, CloudinaryAPI } from '@/lib/api-client';
import { MapData, Floor, Pin } from '@/types';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';
import FloorForm from '@/components/FloorForm';
import MapViewer from '@/components/MapViewer';
import PinEditorModal from '@/components/PinEditorModal';
import PinDetailModal from '@/components/PinDetailModal';
import BookmarkList from '@/components/BookmarkList';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import ImageUploader from '@/components/ImageUploader';

export default function MapEditPage() {
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const mapId = params.mapId as string;
  
  // 状態
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // フォームと編集モード
  const [editingMapInfo, setEditingMapInfo] = useState(false);
  const [showAddFloorForm, setShowAddFloorForm] = useState(false);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [mapInfo, setMapInfo] = useState({
    title: '',
    description: '',
    is_publicly_editable: false
  });
  
  // モーダル関連の状態
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [showPinDetailModal, setShowPinDetailModal] = useState(false);
  const [showPinEditorModal, setShowPinEditorModal] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  
  // 削除確認モーダルの状態
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'pin' | 'floor' | null;
    id: string;
    title: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    type: null,
    id: '',
    title: '',
    isDeleting: false
  });
  
  // API操作の状態
  const [apiStatus, setApiStatus] = useState<{
    loading: boolean;
    message: string;
    error: string | null;
  }>({
    loading: false,
    message: '',
    error: null
  });
  
  // マップデータ取得
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }
    
    fetchMapData();
  }, [isAuthenticated, token, authLoading, router, mapId]);
  
  // マップデータを取得
  const fetchMapData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      // マップ情報を取得
      console.log("mapId", mapId);
      const mapData = await MapAPI.getMap(mapId, token);
      console.log("mapData", mapData);
      setMapData(mapData);
      setMapInfo({
        title: mapData.title,
        description: mapData.description || '',
        is_publicly_editable: mapData.is_publicly_editable || false
      });
      
      // フロア情報を取得
      const floorData = await FloorAPI.getFloors(mapId);
      console.log("floorData", floorData);
      setFloors(floorData );
      console.log("floors", floors);
      
      // 最初のフロアをアクティブに設定
      if (floorData.length > 0) {
        setActiveFloor(floorData[0]);
        
        // ピン情報を取得
        // const promises = floorData.map(floor => FloorAPI.getPins(floor.id));
        const promises = floorData.map((floor: Floor) => PinAPI.getPins(floor.id));
        const pinsArrays = await Promise.all(promises);
        const allPins = pinsArrays.flat();
        setPins(allPins);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // マップ情報の更新
  const updateMapInfo = async () => {
    if (!token || !mapData) return;
    
    setApiStatus({
      loading: true,
      message: 'マップ情報を更新中...',
      error: null
    });
    
    try {
      const updatedMap = await MapAPI.updateMap(mapData.id, mapInfo, token);
      setMapData(updatedMap);
      setEditingMapInfo(false);
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : 'マップの更新に失敗しました'
      });
    }
  };
  
  // フロア追加
  const handleAddFloor = async (floorData: Partial<Floor>) => {
    if (!token || !mapData) return;
    
    setApiStatus({
      loading: true,
      message: 'エリアを追加中...',
      error: null
    });
    
    try {
      const newFloor = await FloorAPI.createFloor(mapData.id, {
        floor_number: floorData.floor_number || 1,
        name: floorData.name || ''
      }, token);
      
      setFloors([...floors, newFloor]);
      setActiveFloor(newFloor);
      setShowAddFloorForm(false);
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : 'エリアの追加に失敗しました'
      });
    }
  };
  
  // フロア削除
  const handleDeleteFloor = (floorId: string, floorName: string) => {
    setDeleteConfirmState({
      isOpen: true,
      type: 'floor',
      id: floorId,
      title: floorName,
      isDeleting: false
    });
  };
  
  // ピン削除
  const handleDeletePin = (pin: Pin) => {
    setDeleteConfirmState({
      isOpen: true,
      type: 'pin',
      id: pin.id,
      title: pin.title,
      isDeleting: false
    });
  };
  
  // 削除確認
  const confirmDelete = async () => {
    if (!token) return;
    
    const { type, id } = deleteConfirmState;
    if (!type) return;
    
    setDeleteConfirmState({
      ...deleteConfirmState,
      isDeleting: true
    });
    
    try {
      if (type === 'pin') {
        await PinAPI.deletePin(id, token);
        setPins(pins.filter(pin => pin.id !== id));
        setSelectedPin(null);
        setShowPinDetailModal(false);
      } else if (type === 'floor') {
        await FloorAPI.deleteFloor(id, token);
        
        // 関連するピンを削除
        const newPins = pins.filter(pin => pin.floor_id !== id);
        setPins(newPins);
        
        // フロアのリストを更新
        const newFloors = floors.filter(floor => floor.id !== id);
        setFloors(newFloors);
        
        // アクティブなフロアを変更
        if (activeFloor?.id === id) {
          setActiveFloor(newFloors.length > 0 ? newFloors[0] : null);
        }
      }
      
      setDeleteConfirmState({
        isOpen: false,
        type: null,
        id: '',
        title: '',
        isDeleting: false
      });
    } catch (error) {
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : '削除に失敗しました'
      });
    }
  };
  
  // 画像アップロード
  const handleImageUpload = async (floorId: string, imageUrl: string) => {
    if (!token) return;
    
    setApiStatus({
      loading: true,
      message: '画像を保存中...',
      error: null
    });
    
    try {
      const updatedFloor = await FloorAPI.updateFloor(floorId, { image_url: imageUrl }, token);
      
      // フロアリストを更新
      setFloors(floors.map(floor => floor.id === floorId ? updatedFloor : floor));
      
      // アクティブなフロアを更新
      if (activeFloor?.id === floorId) {
        setActiveFloor(updatedFloor);
      }
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : '画像の保存に失敗しました'
      });
    }
  };
  
  // ピン追加モードの切り替え
  const toggleAddPinMode = () => {
    setIsAddingPin(!isAddingPin);
  };
  
  // 画像クリック時のピン追加処理
  const handleImageClick = (x: number, y: number) => {
    if (!isAddingPin || !activeFloor) return;
    
    // 新しいピンの作成
    const newPin: Partial<Pin> = {
      floor_id: activeFloor.id,
      title: '',
      description: '',
      x_position: x,
      y_position: y
    };
    
    setEditingPin(newPin as Pin);
    setIsCreatingPin(true);
    setShowPinEditorModal(true);
    setIsAddingPin(false);
  };
  
  // ピンのクリック処理
  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
    setShowPinDetailModal(true);
  };
  
  // ピンの編集
  const handleEditPin = (pin: Pin) => {
    setEditingPin(pin);
    setIsCreatingPin(false);
    setShowPinEditorModal(true);
  };
  
  // ピンの保存
  const handleSavePin = async (pin: Pin) => {
    if (!token) return;
    
    setApiStatus({
      loading: true,
      message: isCreatingPin ? 'ピンを作成中...' : 'ピンを更新中...',
      error: null
    });
    
    try {
      if (isCreatingPin) {
        // 新規作成
        const newPin = await PinAPI.createPin(pin.floor_id, {
          title: pin.title,
          description: pin.description,
          x_position: pin.x_position,
          y_position: pin.y_position,
          image_url: pin.image_url
        }, token);
        
        setPins([...pins, newPin]);
      } else {
        // 更新
        const updatedPin = await PinAPI.updatePin(pin.id, {
          title: pin.title,
          description: pin.description,
          image_url: pin.image_url
        }, token);
        
        setPins(pins.map(p => p.id === pin.id ? updatedPin : p));
      }
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : 'ピンの保存に失敗しました'
      });
    }
  };
  
  // マップ情報編集フォームの入力ハンドラ
  const handleMapInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setMapInfo({ ...mapInfo, [name]: target.checked });
    } else {
      setMapInfo({ ...mapInfo, [name]: value });
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }
  
  if (error || !mapData) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'マップが見つかりません'}
        </div>
        
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ダッシュボードに戻る
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        {!editingMapInfo ? (
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{mapData.title}</h1>
              {mapData.description && (
                <p className="text-gray-600 mt-1">{mapData.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                マップID: {mapData.map_id}
                {mapData.is_publicly_editable && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    公開編集モード有効
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingMapInfo(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                マップ情報を編集
              </button>
              
              <QRCodeGenerator
                url={`/viewer/${mapId}`}
                title={mapData.title}
                publicEditUrl={mapData.is_publicly_editable ? `/public-edit/${mapId}` : undefined}
              />
              
              <Link
                href="/dashboard"
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <h2 className="text-lg font-semibold mb-3">マップ情報を編集</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={mapInfo.title}
                  onChange={handleMapInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={mapInfo.description}
                  onChange={handleMapInfoChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_publicly_editable"
                    checked={mapInfo.is_publicly_editable}
                    onChange={handleMapInfoChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    公開編集を許可する（誰でもピンを追加・編集できます）
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingMapInfo(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  キャンセル
                </button>
                
                <button
                  onClick={updateMapInfo}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  disabled={apiStatus.loading}
                >
                  {apiStatus.loading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {apiStatus.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {apiStatus.error}
        </div>
      )}
      
      {apiStatus.loading && (
        <div className="mb-4">
          <Loading text={apiStatus.message} size="small" />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* サイドバー */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="font-semibold text-lg mb-3">エリア管理</h2>
            
            <button
              onClick={() => setShowAddFloorForm(!showAddFloorForm)}
              className="w-full mb-3 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
            >
              {showAddFloorForm ? 'キャンセル' : 'エリアを追加'}
            </button>
            
            {showAddFloorForm && (
              <FloorForm
                initialFloor={{
                  floor_number: floors.length > 0 ? Math.max(...floors.map(f => f.floor_number)) + 1 : 1,
                  name: `エリア ${floors.length + 1}`
                }}
                onSubmit={handleAddFloor}
                onCancel={() => setShowAddFloorForm(false)}
                isSubmitting={apiStatus.loading}
              />
            )}
            
            <div className="space-y-2 mt-4">
              {floors.length > 0 ? (
                floors.map((floor) => (
                  <div
                    key={floor.id}
                    className={`p-3 rounded-lg border ${
                      activeFloor?.id === floor.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div
                        className="flex items-center flex-grow cursor-pointer"
                        onClick={() => setActiveFloor(floor)}
                      >
                        <div className="mr-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {floor.floor_number}
                          </div>
                        </div>
                        <span className="font-medium">{floor.name}</span>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleDeleteFloor(floor.id, floor.name)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="削除"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* 画像アップロード */}
                    {activeFloor?.id === floor.id && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        {floor.image_url ? (
                          <div className="relative group">
                            <img
                              src={floor.image_url}
                              alt={floor.name}
                              className="w-full h-20 object-cover rounded-md"
                            />
                            
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                              <ImageUploader
                                onUploadComplete={(url) => handleImageUpload(floor.id, url)}
                                onUploadError={(msg) => setApiStatus({
                                  loading: false,
                                  message: '',
                                  error: msg
                                })}
                                currentImageUrl={floor.image_url}
                                token={token}
                                folder="floor_images"
                                buttonText="画像を変更"
                                className="z-10"
                              />
                            </div>
                          </div>
                        ) : (
                          <ImageUploader
                            onUploadComplete={(url) => handleImageUpload(floor.id, url)}
                            onUploadError={(msg) => setApiStatus({
                              loading: false,
                              message: '',
                              error: msg
                            })}
                            token={token}
                            folder="floor_images"
                            buttonText="画像をアップロード"
                            className="w-full"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  エリアがありません
                </div>
              )}
            </div>
          </div>
          
          {/* ピン一覧 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="font-semibold text-lg mb-3">しおり一覧</h2>
            
            {pins.length > 0 ? (
              <BookmarkList
                pins={pins}
                floors={floors}
                activeFloorId={activeFloor?.id}
                onPinClick={handlePinClick}
                selectedPinId={selectedPin?.id}
              />
            ) : (
              <div className="text-center py-4 text-gray-500">
                ピンがありません
              </div>
            )}
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">
                {activeFloor ? activeFloor.name : 'エリアがありません'}
              </h2>
              
              {activeFloor && (
                <button
                  onClick={toggleAddPinMode}
                  className={`px-3 py-2 rounded-md transition-colors text-sm ${
                    isAddingPin
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={!activeFloor?.image_url}
                >
                  {isAddingPin ? 'ピン追加をキャンセル' : 'ピンを追加'}
                </button>
              )}
            </div>
            
            {/* マップビューワー */}
            {activeFloor && (
              <MapViewer
                floor={activeFloor}
                pins={pins.filter(pin => pin.floor_id === activeFloor.id)}
                isAddingPin={isAddingPin}
                isEditable={true}
                selectedPinId={selectedPin?.id}
                onPinClick={handlePinClick}
                onEditPin={handleEditPin}
                onDeletePin={handleDeletePin}
                onImageClick={handleImageClick}
                zoomable={true}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* ピン詳細モーダル */}
      <PinDetailModal
        pin={selectedPin}
        floors={floors}
        isOpen={showPinDetailModal}
        isEditable={true}
        onClose={() => setShowPinDetailModal(false)}
        onEdit={handleEditPin}
        onDelete={handleDeletePin}
      />
      
      {/* ピン編集モーダル */}
      {token && (
        <PinEditorModal
          pin={editingPin}
          isOpen={showPinEditorModal}
          isCreating={isCreatingPin}
          token={token}
          onClose={() => {
            setShowPinEditorModal(false);
            setEditingPin(null);
          }}
          onSave={handleSavePin}
        />
      )}
      
      {/* 削除確認モーダル */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmState.isOpen}
        title={`${deleteConfirmState.type === 'pin' ? 'ピン' : 'エリア'}の削除`}
        message={`この${deleteConfirmState.type === 'pin' ? 'ピン' : 'エリア'}を削除してもよろしいですか？${
          deleteConfirmState.type === 'floor' ? 'このエリアに関連するすべてのピンも削除されます。' : ''
        }`}
        itemName={deleteConfirmState.title}
        isDeleting={deleteConfirmState.isDeleting}
        onClose={() => {
          if (!deleteConfirmState.isDeleting) {
            setDeleteConfirmState({
              ...deleteConfirmState,
              isOpen: false
            });
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}