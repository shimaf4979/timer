'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PinList from '@/components/PinList';
import NormalView from '@/components/NormalView';
import ImprovedModal from '@/components/ImprovedModal';
import LoadingIndicator from '@/components/LoadingIndicator';
import EnhancedPinViewer from '@/components/EnhancedPinViewer';
import { getExactImagePosition } from '@/utils/imageExactPositioning';
import { useViewerData, usePublicEditor, usePublicEditPins } from '@/lib/api-hooks';
import { useUIStore, useMapEditStore, usePublicEditStore } from '@/lib/store';
import { Floor, Pin } from '@/types/map-types';

// 公開編集用のメインコンテンツコンポーネント
function PublicEditContent() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get('id') || '';

  // Zustand ストアから状態と操作を取得
  const { loading, error, setLoading, setError, addNotification } = useUIStore();
  const {
    selectedFloorId,
    isAddingPin,
    selectedPinId,
    newPinPosition,
    setSelectedFloorId,
    setSelectedPinId,
    setIsAddingPin,
    setNewPinPosition,
    resetPinEditing,
  } = useMapEditStore();
  const { editorId, editorNickname, editorToken, setEditorInfo, clearEditorInfo } =
    usePublicEditStore();

  // TanStack Query で使用するフック
  const { data, isLoading, isError } = useViewerData(mapId);
  const { register, registerAsync, verify, verifyAsync, isRegistering, isVerifying } =
    usePublicEditor();
  const { addPin, updatePin, deletePin, isAddingPin: isPinAdding } = usePublicEditPins();

  // ローカル状態
  const [mapData, setMapData] = useState<any>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickName, setNickName] = useState('');
  const [newPinInfo, setNewPinInfo] = useState({ title: '', description: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [frontFloorIndex, setFrontFloorIndex] = useState(0);

  // refs
  const normalViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // データの初期化
  useEffect(() => {
    if (data) {
      setMapData(data.map);
      setFloors(data.floors);
      setPins(data.pins);

      // 最初のエリアをアクティブに設定
      if (data.floors && data.floors.length > 0) {
        setActiveFloor(data.floors[0]);
        setSelectedFloorId(data.floors[0].id);
      }
    }
  }, [data, setSelectedFloorId]);

  // エラー処理
  useEffect(() => {
    if (isError) {
      setError('データの取得に失敗しました');
    }
  }, [isError, setError]);

  // 既存の編集者情報をローカルストレージから取得して検証
  useEffect(() => {
    if (!mapId) return;

    const checkStoredEditor = async () => {
      try {
        // ローカルストレージからデータを取得
        const storedData = localStorage.getItem(`public_edit_${mapId}`);

        if (storedData) {
          const savedEditor = JSON.parse(storedData);

          // トークンを検証
          const verifyResult = await verifyAsync({
            editorId: savedEditor.id,
            token: savedEditor.token,
          });

          if (verifyResult.verified && verifyResult.editorInfo) {
            // 有効な編集者情報を設定
            setEditorInfo(
              verifyResult.editorInfo.id,
              verifyResult.editorInfo.nickname,
              verifyResult.editorInfo.token
            );
          } else {
            // 無効なトークンの場合はモーダルを表示
            setShowNicknameModal(true);
          }
        } else {
          // 保存された情報がない場合はモーダルを表示
          setShowNicknameModal(true);
        }
      } catch (error) {
        console.error('編集者情報検証エラー:', error);
        setShowNicknameModal(true);
      }
    };

    checkStoredEditor();
  }, [mapId, verifyAsync, setEditorInfo]);

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
    setSelectedFloorId(floor.id);
  };

  // 公開編集者の登録
  const registerEditor = async () => {
    if (!mapId || !nickName.trim()) {
      return;
    }

    try {
      setLoading(true);

      const editorInfo = await registerAsync({ mapId, nickname: nickName });

      if (editorInfo) {
        // Zustand ストアに保存
        setEditorInfo(editorInfo.id, editorInfo.nickname, editorInfo.token);
        setShowNicknameModal(false);

        addNotification({
          message: '編集者として登録しました',
          type: 'success',
        });
      } else {
        throw new Error('編集者の登録に失敗しました');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('編集者の登録に失敗しました');
      }
    } finally {
      setLoading(false);
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
    if (!isAddingPin || !editorId) return;

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
    if (!activeFloor || !editorId || !editorNickname || newPinInfo.title.trim() === '') return;

    try {
      await addPin({
        floorId: activeFloor.id,
        title: newPinInfo.title,
        description: newPinInfo.description,
        x_position: newPinPosition.x,
        y_position: newPinPosition.y,
        editorId: editorId,
        nickname: editorNickname,
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
        setSelectedFloorId(pinFloor.id);

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

  // ピンの編集を開始
  const handleEditPin = (pin: Pin) => {
    // 自分が作成したピンのみ編集可能
    if (editorId && pin.editor_id === editorId) {
      setEditingPin(pin);
      setIsEditModalOpen(true);
    }
  };

  // ピンの更新
  const updatePinHandler = async () => {
    if (!editingPin || !editorId) return;

    try {
      await updatePin({
        pinId: editingPin.id,
        title: editingPin.title,
        description: editingPin.description,
        editorId: editorId,
      });

      // モーダルを閉じる
      setIsEditModalOpen(false);
      setEditingPin(null);
    } catch (error) {
      console.error('ピン更新エラー:', error);
    }
  };

  // ピンの削除
  const deletePinHandler = async (pin: Pin) => {
    if (!editorId) return;

    try {
      // 自分が作成したピンのみ削除可能
      if (pin.editor_id !== editorId) {
        throw new Error('このピンを削除する権限がありません');
      }

      await deletePin({
        pinId: pin.id,
        editorId: editorId,
      });

      // 選択中のピンだった場合は選択を解除
      if (selectedPinId === pin.id) {
        setSelectedPinId(null);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('ピンの削除に失敗しました');
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
  }, [selectedPinId, floors]);

  // ピン編集・削除イベント処理
  useEffect(() => {
    // ピン編集イベント
    const handleEditPin = (e: Event) => {
      const customEvent = e as CustomEvent<Pin>;
      if (customEvent.detail) {
        const pin = customEvent.detail;
        if (editorId && pin.editor_id === editorId) {
          setEditingPin(pin);
          setIsEditModalOpen(true);
        }
      }
    };

    // ピン削除イベント
    const handleDeletePin = (e: Event) => {
      const customEvent = e as CustomEvent<Pin>;
      if (customEvent.detail) {
        deletePinHandler(customEvent.detail);
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
  }, [editorId]);

  // ロード中表示
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator message="読み込み中..." isFullScreen={false} />
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
            className="h-12 w-12 mx-auto mb-4 text-red-500"
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
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{mapData.title}</h1>
            {mapData.description && <p className="text-gray-600">{mapData.description}</p>}
          </div>
          <div className="flex justify-between flex-wrap gap-2">
            {editorNickname ? (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {editorNickname}で編集中
              </div>
            ) : (
              <button
                onClick={() => setShowNicknameModal(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
              >
                ニックネーム設定
              </button>
            )}

            <Link
              href={`/viewer?id=${mapId}`}
              className="bg-indigo-500 text-white px-3 py-1 rounded-md text-sm flex items-center"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              閲覧モード
            </Link>
          </div>
        </div>

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

              {/* アクションボタン */}
              <div className="space-y-3">
                {editorId && (
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
                )}
              </div>
            </div>
          </div>

          {/* 右側の表示エリア */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                {`${activeFloor?.name || 'エリアを選択してください'} 表示`}
              </h2>

              <div ref={containerRef} className="relative bg-gray-100 rounded-lg overflow-hidden">
                <div ref={normalViewRef} className="w-full h-96 relative">
                  <NormalView
                    floor={activeFloor}
                    pins={[]} // ピン表示はカスタムコンポーネントで行う
                    onImageClick={handleImageClick}
                  />

                  {/* 現在のエリアのピンのみを表示 */}
                  {activeFloor &&
                    pins
                      .filter((pin) => pin.floor_id === activeFloor.id)
                      .map((pin) => (
                        <EnhancedPinViewer
                          key={pin.id}
                          pin={pin}
                          floors={floors}
                          containerRef={normalViewRef}
                          isPublicEdit={true}
                          currentEditorId={editorId}
                          isSelected={selectedPinId === pin.id}
                          onEditPin={handleEditPin}
                          onDeletePin={deletePinHandler}
                        />
                      ))}
                </div>
              </div>
              {/* ピン一覧 */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">ピン一覧</h2>
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

      {/* ニックネーム入力モーダル */}
      <ImprovedModal
        isOpen={showNicknameModal}
        onClose={() => {
          if (editorId) {
            setShowNicknameModal(false);
          }
        }}
        title="ニックネームを設定"
        size="sm"
      >
        <div className="p-4">
          <p className="mb-4 text-gray-600">
            このマップを編集するために、ニックネームを設定してください。
          </p>
          <div className="mb-4">
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              ニックネーム
            </label>
            <input
              type="text"
              id="nickname"
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="例：山田太郎"
              required
            />
          </div>
          <button
            onClick={registerEditor}
            disabled={!nickName.trim() || isRegistering}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isRegistering ? '処理中...' : '編集を始める'}
          </button>
        </div>
      </ImprovedModal>

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
            disabled={!newPinInfo.title.trim() || isPinAdding}
          >
            {isPinAdding ? '保存中...' : '保存'}
          </button>
        </div>
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
                onClick={updatePinHandler}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={!editingPin.title.trim()}
              >
                保存
              </button>
            </div>
          </div>
        )}
      </ImprovedModal>
    </main>
  );
}

// メインコンポーネントをSuspenseでラップ
export default function PublicEditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingIndicator message="読み込み中..." isFullScreen={false} />
        </div>
      }
    >
      <PublicEditContent />
    </Suspense>
  );
}
