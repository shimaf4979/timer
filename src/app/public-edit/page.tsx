// app/public-edit/[mapId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ViewerAPI, PublicEditAPI } from '@/lib/api-client';
import { ViewerMapData, Floor, Pin, PublicEditor } from '@/types';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';
import MapViewer from '@/components/MapViewer';
import BookmarkList from '@/components/BookmarkList';
import PinDetailModal from '@/components/PinDetailModal';
import PinEditorModal from '@/components/PinEditorModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

// ローカルストレージキー
const getEditorStorageKey = (mapId: string) => `pamfree_editor_${mapId}`;

export default function PublicEditPage() {
  const params = useParams();
  const router = useRouter();
  const mapId = params.mapId as string;
  
  // 状態
  const [viewerData, setViewerData] = useState<ViewerMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [editor, setEditor] = useState<PublicEditor | null>(null);
  
  // UI状態
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showPinDetailModal, setShowPinDetailModal] = useState(false);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(true);
  
  // 編集関連
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [showPinEditorModal, setShowPinEditorModal] = useState(false);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [pinToDelete, setPinToDelete] = useState<Pin | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // データの取得
  useEffect(() => {
    if (!mapId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await ViewerAPI.getMapData(mapId);
        
        // 公開編集が有効かチェック
        if (!data.map.is_publicly_editable) {
          setError('このマップは公開編集が許可されていません');
          setLoading(false);
          return;
        }
        
        setViewerData(data);
        
        // 最初のフロアをアクティブに設定
        if (data.floors.length > 0) {
          setActiveFloor(data.floors[0]);
        }
        
        // ローカルストレージから編集者情報を取得
        const storedEditor = localStorage.getItem(getEditorStorageKey(mapId));
        if (storedEditor) {
          const parsedEditor = JSON.parse(storedEditor) as PublicEditor;
          
          // 編集者情報を検証
          try {
            const verifyResult = await PublicEditAPI.verifyEditor(parsedEditor.id, parsedEditor.token);
            if (verifyResult.verified) {
              setEditor(parsedEditor);
            } else {
              // 検証失敗したらモーダルを表示
              setShowNicknameModal(true);
            }
          } catch (error) {
            console.error('編集者検証エラー:', error);
            setShowNicknameModal(true);
          }
        } else {
          // 保存された情報がなければモーダルを表示
          setShowNicknameModal(true);
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
  
  // 編集者登録
  const registerEditor = async () => {
    if (!nickname.trim() || !mapId) return;
    
    setIsSubmitting(true);
    
    try {
      const newEditor = await PublicEditAPI.registerEditor(mapId, nickname);
      
      // 編集者情報をローカルストレージに保存
      localStorage.setItem(getEditorStorageKey(mapId), JSON.stringify(newEditor));
      
      setEditor(newEditor);
      setShowNicknameModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : '編集者の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ピン追加モードの切り替え
  const toggleAddPinMode = () => {
    if (!editor) {
      setShowNicknameModal(true);
      return;
    }
    
    setIsAddingPin(!isAddingPin);
  };
  
  // 画像クリック時のピン追加処理
  const handleImageClick = (x: number, y: number) => {
    if (!isAddingPin || !activeFloor || !editor) return;
    
    // 新しいピンの作成
    const newPin: Partial<Pin> = {
      floor_id: activeFloor.id,
      title: '',
      description: '',
      x_position: x,
      y_position: y,
      editor_id: editor.id,
      editor_nickname: editor.nickname
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
    if (!editor) {
      setShowNicknameModal(true);
      return;
    }
    
    // 自分のピンかどうかチェック
    if (pin.editor_id !== editor.id) {
      setError('他のユーザーが作成したピンは編集できません');
      return;
    }
    
    setEditingPin(pin);
    setIsCreatingPin(false);
    setShowPinEditorModal(true);
  };
  
  // ピンの削除
  const handleDeletePin = (pin: Pin) => {
    if (!editor) {
      setShowNicknameModal(true);
      return;
    }
    
    // 自分のピンかどうかチェック
    if (pin.editor_id !== editor.id) {
      setError('他のユーザーが作成したピンは削除できません');
      return;
    }
    
    setPinToDelete(pin);
    setShowDeleteModal(true);
  };
  
  // ピンの保存
  const handleSavePin = async (pin: Pin) => {
    if (!editor || !viewerData) return;
    
    setIsSubmitting(true);
    
    try {
      if (isCreatingPin) {
        // 新規作成
        const newPin = await PublicEditAPI.createPin({
          floorId: pin.floor_id,
          title: pin.title,
          description: pin.description,
          x_position: pin.x_position,
          y_position: pin.y_position,
          editorId: editor.id,
          editorNickname: editor.nickname,
          image_url: pin.image_url
        });
        
        // ピンを追加
        setViewerData({
          ...viewerData,
          pins: [...viewerData.pins, newPin]
        });
      } else {
        // 更新
        const updatedPin = await PublicEditAPI.updatePin(pin.id, {
          title: pin.title,
          description: pin.description,
          editorId: editor.id
        });
        
        // ピンを更新
        setViewerData({
          ...viewerData,
          pins: viewerData.pins.map(p => p.id === pin.id ? updatedPin : p)
        });
      }
      
      setShowPinEditorModal(false);
      setEditingPin(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ピンの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ピンの削除確認
  const confirmDeletePin = async () => {
    if (!editor || !pinToDelete || !viewerData) return;
    
    setIsSubmitting(true);
    
    try {
      await PublicEditAPI.deletePin(pinToDelete.id, editor.id);
      
      // ピンを削除
      setViewerData({
        ...viewerData,
        pins: viewerData.pins.filter(p => p.id !== pinToDelete.id)
      });
      
      // モーダルを閉じる
      setShowDeleteModal(false);
      setPinToDelete(null);
      setShowPinDetailModal(false);
      setSelectedPin(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ピンの削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{map.title}</h1>
          {map.description && <p className="text-gray-600 mt-1">{map.description}</p>}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {editor ? (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {editor.nickname}で編集中
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
            href={`/viewer/${mapId}`}
            className="bg-indigo-500 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            閲覧モード
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* サイドバー */}
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
                onClick={toggleAddPinMode}
                className={`w-full px-3 py-2 rounded-md transition-colors text-sm mb-3 ${
                  isAddingPin
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                disabled={!activeFloor?.image_url}
              >
                {isAddingPin ? 'ピン追加をキャンセル' : 'ピンを追加'}
              </button>
              
              <button
                onClick={() => setShowBookmarks(!showBookmarks)}
                className="w-full px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-sm"
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
        
        {/* メインコンテンツ */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">
                {activeFloor ? activeFloor.name : 'エリアがありません'}
              </h2>
              
              {activeFloor && (
                <div className="text-sm text-gray-500">
                  {isAddingPin ? (
                    <span className="text-red-500">画像をクリックしてピンを追加してください</span>
                  ) : (
                    <span>ピンをクリックすると詳細が表示されます</span>
                  )}
                </div>
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
      
      {/* ニックネーム設定モーダル */}
      <Modal
        isOpen={showNicknameModal}
        onClose={() => {
          if (!editor && !isSubmitting) {
            // 編集者登録されていなければページ遷移
            router.push(`/viewer/${mapId}`);
          } else {
            setShowNicknameModal(false);
          }
        }}
        title="ニックネームを設定"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            このマップを編集するには、ニックネームの設定が必要です。
          </p>
          
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              ニックネーム
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="あなたの名前を入力"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="pt-2">
            <button
              onClick={registerEditor}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={!nickname.trim() || isSubmitting}
            >
              {isSubmitting ? '登録中...' : 'はじめる'}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* ピン詳細モーダル */}
      <PinDetailModal
        pin={selectedPin}
        floors={floors}
        isOpen={showPinDetailModal}
        isEditable={editor ? selectedPin?.editor_id === editor.id : false}
        onClose={() => setShowPinDetailModal(false)}
        onEdit={handleEditPin}
        onDelete={handleDeletePin}
      />
      
      {/* ピン編集モーダル */}
      <PinEditorModal
        pin={editingPin}
        isOpen={showPinEditorModal}
        isCreating={isCreatingPin}
        token={editor?.token || ''}
        onClose={() => {
          setShowPinEditorModal(false);
          setEditingPin(null);
        }}
        onSave={handleSavePin}
      />
      
      {/* 削除確認モーダル */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="ピンの削除"
        message="このピンを削除してもよろしいですか？この操作は元に戻せません。"
        itemName={pinToDelete?.title}
        isDeleting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setShowDeleteModal(false);
            setPinToDelete(null);
          }
        }}
        onConfirm={confirmDeletePin}
      />
    </div>
  );
}