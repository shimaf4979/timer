// app/public-edit/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapData, Floor, Pin, PublicEditor } from '@/types/map-types';
import PinList from '@/components/PinList';
import NormalView from '@/components/NormalView';
import ImprovedModal from '@/components/ImprovedModal';
import LoadingIndicator from '@/components/LoadingIndicator';
import EnhancedPinViewer from '@/components/EnhancedPinViewer';
import { getExactImagePosition } from '@/utils/imageExactPositioning';
import {
  getEditorFromStorage,
  verifyEditorToken,
  registerPublicEditor,
  addPublicPin,
  updatePublicPin,
  deletePublicPin,
} from '@/utils/publicEditHelpers';

// 公開編集用のメインコンテンツコンポーネント
function PublicEditContent() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get('id') || '';

  // 基本状態
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModalArrows, setShowModalArrows] = useState(true);

  // 公開編集状態
  const [editorInfo, setEditorInfo] = useState<PublicEditor | null>(null);
  const [nickName, setNickName] = useState('');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [newPinPosition, setNewPinPosition] = useState({ x: 0, y: 0 });
  const [newPinInfo, setNewPinInfo] = useState({ title: '', description: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // フロントに表示するエリアのインデックス
  const [frontFloorIndex, setFrontFloorIndex] = useState(0);

  // レスポンシブ対応
  const [isMobile, setIsMobile] = useState(false);

  // コンテナへの参照
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

  // 既存の編集者情報をローカルストレージから取得
  useEffect(() => {
    if (!mapId) return;

    const savedEditor = getEditorFromStorage(mapId);
    if (savedEditor) {
      // トークンの検証
      verifyEditorToken(savedEditor.id, savedEditor.token).then(({ verified, editorInfo }) => {
        if (verified && editorInfo) {
          setEditorInfo(editorInfo);
        } else {
          // 無効なトークンの場合はモーダルを表示
          setShowNicknameModal(true);
        }
      });
    } else {
      // 保存された情報がない場合はモーダルを表示
      setShowNicknameModal(true);
    }
  }, [mapId]);

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

        // 公開編集が有効かチェック
        if (!data.map.is_publicly_editable) {
          throw new Error('このマップは公開編集が許可されていません');
        }

        // データを設定
        setMapData(data.map);
        setFloors(data.floors);

        // 編集者情報が欠落しているピンには「不明な編集者」を設定
        const pinsWithEditors = data.pins.map((pin: Pin) => {
          if (!pin.editor_nickname) {
            return {
              ...pin,
              editor_nickname: '不明な編集者',
            };
          }
          return pin;
        });

        setPins(pinsWithEditors);

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

  // 公開編集者の登録
  const registerEditor = async () => {
    if (!mapId || !nickName.trim()) {
      return;
    }

    try {
      setLoading(true);

      const editor = await registerPublicEditor(mapId, nickName);

      if (editor) {
        setEditorInfo(editor);
        setShowNicknameModal(false);
      } else {
        throw new Error('編集者の登録に失敗しました');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '編集者の登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

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

  // 写真上でクリックした位置にピンを追加するモードを切り替える
  const toggleAddPinMode = () => {
    setIsAddingPin(!isAddingPin);

    // ピン追加モードを終了するときは選択状態をクリア
    if (isAddingPin) {
      setSelectedPinId(null);
    }
  };

  // 画像クリック時のピン追加処理
  const handleImageClick = (
    e: React.MouseEvent<HTMLDivElement>,
    exactPosition: { x: number; y: number } | null
  ) => {
    if (!isAddingPin || !editorInfo) return;
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
    if (!activeFloor || !editorInfo || newPinInfo.title.trim() === '') return;

    try {
      // 一時的なピンをUIに追加（楽観的UI更新）
      const tempId = `temp-${Date.now()}`;
      const tempPin: Pin = {
        id: tempId,
        floor_id: activeFloor.id,
        title: newPinInfo.title,
        description: newPinInfo.description,
        x_position: newPinPosition.x,
        y_position: newPinPosition.y,
        editor_id: editorInfo.id,
        editor_nickname: editorInfo.nickname,
        _temp: true,
      };

      setPins((prevPins) => [...prevPins, tempPin]);
      setNewPinInfo({ title: '', description: '' });
      setIsFormOpen(false);
      setIsAddingPin(false);

      // APIリクエスト
      const result = await addPublicPin({
        floorId: activeFloor.id,
        title: newPinInfo.title,
        description: newPinInfo.description,
        x_position: newPinPosition.x,
        y_position: newPinPosition.y,
        editorId: editorInfo.id,
        nickname: editorInfo.nickname,
      });

      if (!result.success) {
        throw new Error(result.error || 'ピンの追加に失敗しました');
      }

      // 一時ピンを実際のピンに置き換え
      setPins((prevPins) => prevPins.filter((pin) => !pin._temp).concat(result.pin));

      // 新しいピンを選択状態にする
      setSelectedPinId(result.pin.id);
    } catch (error) {
      // 一時ピンを削除（失敗時）
      setPins((prevPins) => prevPins.filter((pin) => !pin._temp));

      setError(error instanceof Error ? error.message : 'ピンの追加に失敗しました');
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
        // ピンクリックイベントを処理
        handlePinClick(customEvent.detail);
      }
    };

    window.addEventListener('pinClick', handleGlobalPinClick);

    return () => {
      window.removeEventListener('pinClick', handleGlobalPinClick);
    };
  }, [selectedPinId, floors]); // 依存配列を更新

  // ピン一覧からピンをクリックしたときの処理
  const handlePinListClick = (pin: Pin) => {
    handlePinClick(pin);
  };

  // ピンの編集を開始
  const handleEditPin = (pin: Pin) => {
    // 自分が作成したピンのみ編集可能
    if (editorInfo && pin.editor_id === editorInfo.id) {
      setEditingPin(pin);
      setIsEditModalOpen(true);
    }
  };

  // ピンの更新
  const updatePin = async (updatedPin: Pin) => {
    if (!editorInfo) return;

    try {
      const result = await updatePublicPin({
        pinId: updatedPin.id,
        title: updatedPin.title,
        description: updatedPin.description,
        editorId: editorInfo.id,
      });

      if (!result.success) {
        throw new Error(result.error || 'ピンの更新に失敗しました');
      }

      // ピンリストを更新
      setPins(pins.map((pin) => (pin.id === result.pin.id ? result.pin : pin)));

      // モーダルを閉じる
      setIsEditModalOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ピンの更新に失敗しました');
    }
  };

  // ピンの削除
  const deletePin = async (pin: Pin) => {
    if (!editorInfo) return;

    try {
      // 自分が作成したピンのみ削除可能
      if (pin.editor_id !== editorInfo.id) {
        throw new Error('このピンを削除する権限がありません');
      }

      // UIから先に削除（楽観的UI更新）
      setPins((prevPins) => prevPins.filter((p) => p.id !== pin.id));

      // 選択中のピンだった場合は選択を解除
      if (selectedPinId === pin.id) {
        setSelectedPinId(null);
      }

      // APIリクエスト
      const result = await deletePublicPin({
        pinId: pin.id,
        editorId: editorInfo.id,
      });

      if (!result.success) {
        throw new Error(result.error || 'ピンの削除に失敗しました');
      }
    } catch (error) {
      // エラー時のメッセージ表示
      setError(error instanceof Error ? error.message : 'ピンの削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator message="読み込み中..." isFullScreen={false} />
      </div>
    );
  }

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
            {editorInfo ? (
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
                {editorInfo.nickname}で編集中
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
                {editorInfo && (
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
                          currentEditorId={editorInfo?.id || null}
                          isSelected={selectedPinId === pin.id}
                          onEditPin={handleEditPin}
                          onDeletePin={deletePin}
                        />
                      ))}
                </div>
              </div>
              {/* ピン一覧 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">ピン一覧</h2>
                <PinList
                  pins={pins}
                  floors={floors}
                  activeFloor={activeFloor?.id || null}
                  onPinClick={handlePinListClick}
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
          if (editorInfo) {
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
            disabled={!nickName.trim() || loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? '処理中...' : '編集を始める'}
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
            disabled={!newPinInfo.title.trim()}
          >
            保存
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
                onClick={() => updatePin(editingPin)}
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
