'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PinList from '@/components/PinList';
import ImprovedModal from '@/components/ImprovedModal';
import PinInfo from '@/components/PinInfo';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import NormalView from '@/components/NormalView';
import LoadingIndicator from '@/components/LoadingIndicator';
import ImageUploader from '@/components/ImageUploader';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { getExactImagePosition } from '@/utils/imageExactPositioning';
import EnhancedPinViewer from '@/components/EnhancedPinViewer';
import {
  useMapData,
  useFloors,
  usePins,
  useAddFloor,
  useDeleteFloor,
  useAddPin,
  useUpdatePin,
  useDeletePin,
  useUploadFloorImage,
} from '@/lib/api-hooks';
import { useUIStore, useMapEditStore } from '@/lib/store';
import { Pin, Floor } from '@/types/map-types';
import { useQueryClient } from '@tanstack/react-query';

export default function MapEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const mapId = params.mapId as string;
  const queryClient = useQueryClient();

  // Zustand ストアから状態と操作を取得
  const { loading, error, setLoading, setError } = useUIStore();
  const {
    selectedFloorId,
    isAddingPin,
    newPinPosition,
    setSelectedFloorId,
    setIsAddingPin,
    setNewPinPosition,
    resetPinEditing,
  } = useMapEditStore();

  // TanStack Query フック
  const { data: mapData, isLoading: isMapLoading } = useMapData(mapId);
  const { data: floors = [], isLoading: isFloorsLoading } = useFloors(mapId);
  const floorIds = floors.map((floor) => floor.id);
  const { data: pins = [], isLoading: isPinsLoading } = usePins(floorIds);

  // ミューテーションフック
  const addFloorMutation = useAddFloor(mapId);
  const deleteFloorMutation = useDeleteFloor(mapId);
  const addPinMutation = useAddPin();
  const updatePinMutation = useUpdatePin();
  const deletePinMutation = useDeletePin();

  // ローカル状態
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [newPinInfo, setNewPinInfo] = useState({ title: '', description: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [showPinList, setShowPinList] = useState(true);
  const [showAddFloorForm, setShowAddFloorForm] = useState(false);
  const [newFloor, setNewFloor] = useState({ floor_number: 1, name: '' });
  const [showModalArrows, setShowModalArrows] = useState(true);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [frontFloorIndex, setFrontFloorIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 削除確認モーダルの状態
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'pin' | 'floor' | null;
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: null,
    id: '',
    title: '',
  });

  // マップ情報編集状態
  const [editingMapInfo, setEditingMapInfo] = useState(false);
  const [mapInfo, setMapInfo] = useState({
    title: '',
    description: '',
    is_publicly_editable: false,
  });

  // refs
  const normalViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // スマホ検出のためのuseEffect
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // モーダル表示時は矢印を非表示にする
  useEffect(() => {
    setShowModalArrows(
      !(isModalOpen || isEditModalOpen || isFormOpen || deleteConfirmState.isOpen)
    );
  }, [isModalOpen, isEditModalOpen, isFormOpen, deleteConfirmState.isOpen]);

  // 認証状態の確認とリダイレクト
  useEffect(() => {
    if (status === 'loading') return;

    // 非認証ユーザーはログインページへリダイレクト
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // マップデータ取得後に編集用の状態を初期化
  useEffect(() => {
    if (mapData) {
      setMapInfo({
        title: mapData.title,
        description: mapData.description || '',
        is_publicly_editable: mapData.is_publicly_editable || false,
      });
    }
  }, [mapData]);

  // フロアデータの初期化
  useEffect(() => {
    if (floors.length > 0 && !activeFloor) {
      setActiveFloor(floors[0]);
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, activeFloor, setSelectedFloorId]);

  // 画像の読み込みイベントリスナー
  useEffect(() => {
    const handleImageLoaded = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        // 画像の読み込みが完了した時の処理
        setIsImageUploading(false);
        setUploadProgress(100);

        // タイムアウトでプログレスバーをクリア
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      }
    };

    window.addEventListener('imageLoaded', handleImageLoaded);

    return () => {
      window.removeEventListener('imageLoaded', handleImageLoaded);
    };
  }, []);

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

  // アクティブなエリアを変更
  const handleFloorChange = (floor: Floor) => {
    // 同じ階層を再選択した場合は何もしない
    if (activeFloor?.id === floor.id) return;

    // 階層を変更
    setActiveFloor(floor);
    setSelectedFloorId(floor.id);
  };

  // エリアの追加
  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapData) return;

    try {
      await addFloorMutation.mutateAsync(newFloor);

      // フォームをリセット
      setNewFloor({
        floor_number: floors.length > 0 ? Math.max(...floors.map((f) => f.floor_number)) + 1 : 1,
        name: '',
      });
      setShowAddFloorForm(false);
    } catch (error) {
      console.error('エリア追加エラー:', error);
    }
  };

  // エリアの削除 - 改善版
  const handleDeleteFloor = (floorId: string, floorName: string) => {
    // 削除確認モーダルを表示
    setDeleteConfirmState({
      isOpen: true,
      type: 'floor',
      id: floorId,
      title: floorName,
    });
  };

  // ピンの削除 - 改善版
  const deletePin = (pinId: string, pinTitle: string) => {
    // 削除確認モーダルを表示
    setDeleteConfirmState({
      isOpen: true,
      type: 'pin',
      id: pinId,
      title: pinTitle,
    });
  };

  // 削除確認のキャンセル
  const cancelDelete = () => {
    setDeleteConfirmState({
      isOpen: false,
      type: null,
      id: '',
      title: '',
    });
  };

  // 削除の実行
  const confirmDelete = async () => {
    if (!deleteConfirmState.type) return;

    const { type, id } = deleteConfirmState;

    try {
      if (type === 'pin') {
        await deletePinMutation.mutateAsync(id);

        // UI更新
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedPin(null);
      } else if (type === 'floor') {
        await deleteFloorMutation.mutateAsync(id);

        // 削除したエリアがアクティブだった場合、別のエリアをアクティブに設定
        if (activeFloor?.id === id) {
          const updatedFloors = floors.filter((floor) => floor.id !== id);
          if (updatedFloors.length > 0) {
            setActiveFloor(updatedFloors[0]);
            setSelectedFloorId(updatedFloors[0].id);
          } else {
            setActiveFloor(null);
            setSelectedFloorId(null);
          }
        }
      }
    } catch (error) {
      console.error('削除処理エラー:', error);
    } finally {
      // モーダルを閉じる
      cancelDelete();
    }
  };

  // 画像アップロード
  const handleImageUpload = (floorId: string, imageUrl: string) => {
    // 画像アップロードが完了した時に呼ばれるコールバック
    try {
      // エリアリストを更新
      const updatedFloors = floors.map((floor) =>
        floor.id === floorId ? { ...floor, image_url: imageUrl } : floor
      );

      // アクティブなエリアが更新された場合、アクティブなエリアも更新
      if (activeFloor?.id === floorId) {
        setActiveFloor((prevFloor) => (prevFloor ? { ...prevFloor, image_url: imageUrl } : null));
      }
    } catch (error) {
      console.error('画像の処理に失敗しました:', error);
    }
  };

  // 写真上でクリックした位置にピンを追加するモードを切り替える
  const toggleAddPinMode = () => {
    setIsAddingPin(!isAddingPin);
  };

  // 画像クリック時のピン追加処理
  const handleImageClick = (
    e: React.MouseEvent<HTMLDivElement>,
    exactPosition: { x: number; y: number } | null
  ) => {
    if (!isAddingPin) return;
    if (!exactPosition) {
      // 通常のクリック位置計算（フォールバック）
      const targetFloorId = activeFloor?.id;
      if (!targetFloorId) return;

      // コンテナRef
      const containerRef = normalViewRef.current ? normalViewRef : { current: e.currentTarget };

      // 正規化された位置情報を取得
      const normalizedPosition = getExactImagePosition(
        e,
        containerRef as React.RefObject<HTMLElement>
      );
      if (!normalizedPosition) return;

      // 位置情報を更新
      setNewPinPosition(normalizedPosition);
    } else {
      // 正確な位置が指定されている場合はそれを使用
      setNewPinPosition(exactPosition);
    }

    setNewPinInfo({ title: '', description: '' });
    setIsFormOpen(true);
  };

  // 新しいピンの情報を保存
  const savePin = async () => {
    if (!activeFloor || newPinInfo.title.trim() === '') return;

    try {
      await addPinMutation.mutateAsync({
        floor_id: activeFloor.id,
        title: newPinInfo.title,
        description: newPinInfo.description,
        x_position: newPinPosition.x,
        y_position: newPinPosition.y,
      });

      // フォームをリセット
      setNewPinInfo({ title: '', description: '' });
      setIsFormOpen(false);
      setIsAddingPin(false);
    } catch (error) {
      console.error('ピン追加エラー:', error);
    }
  };

  // ピンをクリックしたときの処理
  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
    setIsModalOpen(true);
  };

  // ピンの編集を開始
  const handleEditPin = (pin: Pin) => {
    setEditingPin(pin);
    setIsEditModalOpen(true);
    setIsModalOpen(false);
  };

  // ピンの更新
  const updatePin = async () => {
    if (!editingPin) return;

    try {
      await updatePinMutation.mutateAsync({
        id: editingPin.id,
        title: editingPin.title,
        description: editingPin.description,
      });

      // モーダルを閉じる
      setIsEditModalOpen(false);
      setEditingPin(null);
    } catch (error) {
      console.error('ピン更新エラー:', error);
    }
  };

  // グローバルPinClickイベントのハンドラー
  useEffect(() => {
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

  // 3Dビューでのフロアクリックハンドラー
  const handleFloorClickIn3D = (
    e: React.MouseEvent<HTMLDivElement> & { exactPosition?: { x: number; y: number } },
    floorId: string
  ) => {
    if (isAddingPin && e.exactPosition) {
      // カスタムイベントから正確な位置を取得
      setNewPinPosition(e.exactPosition);
      setNewPinInfo({ title: '', description: '' });
      setIsFormOpen(true);
    }
  };

  // ピン編集・削除のグローバルイベントハンドラー
  useEffect(() => {
    // ピン編集イベント
    const handleEditPin = (e: Event) => {
      const customEvent = e as CustomEvent<Pin>;
      if (customEvent.detail) {
        const pin = customEvent.detail;
        setEditingPin(pin);
        setIsEditModalOpen(true);
      }
    };

    // ピン削除イベント
    const handleDeletePin = (e: Event) => {
      const customEvent = e as CustomEvent<Pin>;
      if (customEvent.detail) {
        const pin = customEvent.detail;
        setDeleteConfirmState({
          isOpen: true,
          type: 'pin',
          id: pin.id,
          title: pin.title,
        });
      }
    };

    // イベントリスナーを追加
    window.addEventListener('editPin', handleEditPin);
    window.addEventListener('deletePin', handleDeletePin);

    // クリーンアップ
    return () => {
      window.removeEventListener('editPin', handleEditPin);
      window.removeEventListener('deletePin', handleDeletePin);
    };
  }, []);

  // マップ情報の更新関数
  const updateMapInfo = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/maps/${mapId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapInfo),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'マップの更新に失敗しました');
      }

      await response.json();
      // キャッシュを無効化して再フェッチします
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
      setEditingMapInfo(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('マップの更新に失敗しました');
      }
    } finally {
      setLoading(false);
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

  // ローディング中表示
  const isLoading = isMapLoading || isFloorsLoading || isPinsLoading || loading;

  if (isLoading && status !== 'loading') {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">マップ編集</h1>
        <div className="flex justify-center">
          <LoadingIndicator message="マップデータを読み込み中..." isFullScreen={false} />
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">マップ編集</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          {/* <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {mapData.title}
          </h1> */}
          {/* <div className="flex justify-end space-x-2">
            <QRCodeGenerator 
             url={`/viewer?id=${mapId}`} 
             title={`${mapData.title}_QR`}
             publicEditUrl={mapData.is_publicly_editable ? `/public-edit?id=${mapId}` : undefined}
            />
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              {isMobile ? 'マップ一覧に戻る' : 'ダッシュボードに戻る'}
            </Link>
          </div> */}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="mb-4">
            <LoadingIndicator message="処理中..." isFullScreen={false} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 右側の表示エリア */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                {`${activeFloor?.name || 'エリアを選択してください'} `}
              </h2>
              <div className="flex justify-start items-center mb-4 gap-2">
                <button
                  onClick={() => setShowAddFloorForm(!showAddFloorForm)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md cursor-pointer"
                >
                  {showAddFloorForm ? 'キャンセル' : isMobile ? 'エリア追加' : 'エリア追加'}
                </button>
                <button
                  onClick={toggleAddPinMode}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isAddingPin
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={!activeFloor || !activeFloor.image_url}
                >
                  {isAddingPin
                    ? isMobile
                      ? '終了'
                      : 'ピン追加終了'
                    : isMobile
                      ? 'ピン追加'
                      : 'ピンを追加'}
                </button>
                <QRCodeGenerator
                  url={`/viewer?id=${mapId}`}
                  title={`${mapData.title}_QR`}
                  publicEditUrl={
                    mapData.is_publicly_editable ? `/public-edit?id=${mapId}` : undefined
                  }
                />
              </div>
              {/* エリア選択 */}
              <div className="mb-6">
                {/* エリア追加フォーム */}
                {showAddFloorForm && (
                  <form onSubmit={handleAddFloor} className="mb-4 p-3 bg-gray-50 rounded-md">
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">エリア</label>
                      <input
                        title="floor-number"
                        placeholder="floor-number"
                        type="number"
                        value={newFloor.floor_number}
                        onChange={(e) =>
                          setNewFloor({
                            ...newFloor,
                            floor_number: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">名前</label>
                      <input
                        type="text"
                        value={newFloor.name}
                        onChange={(e) =>
                          setNewFloor({
                            ...newFloor,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="1階, 2階など"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      disabled={addFloorMutation.isPending}
                    >
                      {addFloorMutation.isPending ? '処理中...' : '追加'}
                    </button>
                  </form>
                )}

                {/* エリアリスト */}
                {floors.length > 0 ? (
                  <div className="space-y-2">
                    {floors.map((floor) => (
                      <div
                        key={floor.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          activeFloor?.id === floor.id
                            ? 'bg-blue-100 border-l-4 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div
                          className="flex items-center flex-grow cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFloorChange(floor);
                          }}
                        >
                          <div className="mr-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {floor.floor_number}
                            </div>
                          </div>
                          <span>{floor.name}</span>
                        </div>

                        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                          <ImageUploader
                            floorId={floor.id}
                            onUploadComplete={(imageUrl) => handleImageUpload(floor.id, imageUrl)}
                            onUploadError={(message) => setError(message)}
                            currentImageUrl={floor.image_url}
                            buttonText={
                              floor.image_url
                                ? isMobile
                                  ? '変更'
                                  : '画像変更'
                                : isMobile
                                  ? '追加'
                                  : '画像追加'
                            }
                            className="px-3 rounded text-sm"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteFloor(floor.id, floor.name);
                            }}
                            className="px-2 bg-red-400 text-white rounded text-sm hover:bg-red-200 cursor-pointer"
                            data-floor-id={floor.id}
                          >
                            {isMobile ? '削除' : '削除'}
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
              <div
                ref={containerRef}
                className="relative bg-gray-100 rounded-lg overflow-hidden flex flex-col justify-center items-center"
              >
                <div ref={normalViewRef} className="relative w-full h-96">
                  <NormalView
                    floor={activeFloor}
                    pins={[]} // ピンは空にして、EnhancedPinViewerで管理
                    onImageClick={(e, exact) => handleImageClick(e, exact)}
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
                          isEditable={true}
                        />
                      ))}
                </div>
              </div>

              {/* ピン一覧 */}
              {showPinList && (
                <div className="mt-6">
                  <PinList
                    pins={pins}
                    floors={floors}
                    activeFloor={activeFloor?.id || null}
                    onPinClick={handlePinClick}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 左側のコントロールパネル */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">マップ情報</h2>
                  {!editingMapInfo ? (
                    <button
                      onClick={() => setEditingMapInfo(true)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                    >
                      編集
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMapInfo(false)}
                        className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={updateMapInfo}
                        className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                      >
                        保存
                      </button>
                    </div>
                  )}
                </div>

                {!editingMapInfo ? (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{mapData?.title}</h3>
                    <p className="text-gray-600 mt-2">{mapData?.description || '説明なし'}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          mapData?.is_publicly_editable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {mapData?.is_publicly_editable ? '公開編集有効' : '公開編集無効'}
                      </span>
                      {mapData?.is_publicly_editable && (
                        <Link
                          href={`/public-edit?id=${mapId}`}
                          target="_blank"
                          className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          公開編集ページを開く
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <form>
                    <div className="mb-4">
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        タイトル
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={mapInfo.title}
                        onChange={handleMapInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        説明
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={mapInfo.description}
                        onChange={handleMapInfoChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="mb-4">
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
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        チェックすると、ログインしていないユーザーでもニックネームを設定してピンの追加・編集ができるようになります。
                      </p>
                    </div>
                  </form>
                )}
              </div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">コントロールパネル</h2>

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
            </div>
          </div>
        </div>

        {/* ピン情報入力モーダル */}
        <ImprovedModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setIsAddingPin(false);
          }}
          title="ピン情報を入力"
          size="md"
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
              disabled={addPinMutation.isPending}
            >
              {addPinMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </ImprovedModal>

        {/* ピン情報表示モーダル */}
        <ImprovedModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPin(null);
          }}
          title={selectedPin?.title || 'ピン情報'}
          size="md"
        >
          {selectedPin && (
            <div>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {floors.find((floor) => floor.id === selectedPin.floor_id)?.name ||
                    '不明なエリア'}
                </span>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-line">{selectedPin.description}</p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deletePin(selectedPin.id, selectedPin.title);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  削除
                </button>

                <button
                  onClick={() => {
                    setEditingPin(selectedPin);
                    setIsEditModalOpen(true);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  編集
                </button>
              </div>
            </div>
          )}
        </ImprovedModal>

        {/* ピン編集モーダル */}
        <ImprovedModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPin(null);
          }}
          title="ピン情報を編集"
          size="md"
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
                  onClick={updatePin}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={updatePinMutation.isPending}
                >
                  {updatePinMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}
        </ImprovedModal>

        {/* 削除確認モーダル */}
        <DeleteConfirmationModal
          isOpen={deleteConfirmState.isOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title={`${deleteConfirmState.type === 'pin' ? 'ピン' : 'エリア'}の削除`}
          message={`この${deleteConfirmState.type === 'pin' ? 'ピン' : 'エリア'}を削除してもよろしいですか？${
            deleteConfirmState.type === 'floor'
              ? 'このエリアに関連するすべてのピンも削除されます。'
              : ''
          }`}
          itemName={deleteConfirmState.title}
        />
      </div>
    </div>
  );
}
