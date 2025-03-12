// app/public-edit/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapData, Floor, Pin, PublicEditor } from '@/types/map-types';
import PinList from '@/components/PinList';
import ImprovedView3D from '@/components/ImprovedView3D';
import NormalView from '@/components/NormalView';
import ImprovedModal from '@/components/ImprovedModal';
import LoadingIndicator from '@/components/LoadingIndicator';
import { getExactImagePosition } from '@/utils/imageExactPositioning';
import {
  getEditorFromStorage,
  verifyEditorToken,
  registerPublicEditor,
  addPublicPin,
  updatePublicPin,
  deletePublicPin
} from '@/utils/publicEditHelpers';

// 公開編集用のカスタムピンコンポーネント（EnhancedPinViewerの簡易版）
function PublicPinViewer({ 
  pin, 
  floors, 
  containerRef, 
  is3DView, 
  onPinClick,
  editorInfo,
  isSelected=false
}: {
  pin: Pin;
  floors: Floor[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  is3DView: boolean;
  onPinClick: (pin: Pin) => void;
  editorInfo: PublicEditor | null;
  isSelected?: boolean;
}) {
  // ピン関連の実装（既存のEnhancedPinViewerを参考に、公開編集向けに簡略化）
  const pinRef = useRef<HTMLButtonElement>(null);
  
  // DOMでのピン位置を状態として管理
  const [pinPosition, setPinPosition] = useState({
    left: 0,
    top: 0,
    display: 'none' // 最初は非表示
  });

  // ピン位置を計算して更新
  useEffect(() => {
    if (!containerRef?.current) return;
    let isMounted = true;
    let frameId: number | null = null;
    
    // ピン位置の計算と更新を行う関数
    const updatePinPosition = () => {
      if (!containerRef?.current || !isMounted) return;
      
      try {
        // ピンの親要素（フロアコンテナ）を探す
        const floorContainer = containerRef.current.closest('.floor-container') || containerRef.current;
        
        // 画像要素を取得
        const imageEl = floorContainer.querySelector('img');
        if (!imageEl) {
          frameId = requestAnimationFrame(updatePinPosition);
          return;
        }
        
        // コンテナの位置とサイズを取得
        const containerRect = floorContainer.getBoundingClientRect();
        
        // 画像の表示サイズと位置を取得
        const imageRect = imageEl.getBoundingClientRect();
        
        // 画像がレンダリングされているかチェック
        if (imageRect.width === 0 || imageRect.height === 0) {
          frameId = requestAnimationFrame(updatePinPosition);
          return;
        }
        
        // ピンの座標を計算（画像の実際のサイズに基づく）
        const pinXPercent = pin.x_position / 100;
        const pinYPercent = pin.y_position / 100;
        
        // コンテナ内での画像のオフセット
        const imageOffsetX = imageRect.left - containerRect.left;
        const imageOffsetY = imageRect.top - containerRect.top;
        
        // 画像サイズ
        const imageWidth = imageRect.width;
        const imageHeight = imageRect.height;
        
        // ピンの位置計算
        const pinX = imageOffsetX + (pinXPercent * imageWidth);
        const pinY = imageOffsetY + (pinYPercent * imageHeight);
        
        if (isMounted) {
          setPinPosition({
            left: pinX,
            top: pinY,
            display: 'block'
          });
        }
      } catch (err) {
        console.error('Error updating pin position:', err);
      }
    };
    
    // 初回更新
    updatePinPosition();
    
    // 画像読み込み、リサイズ、スクロールでの位置更新
    const handleUpdate = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updatePinPosition);
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('imageLoaded', handleUpdate);
    window.addEventListener('imageFullyLoaded', handleUpdate);
    
    // 3Dビューの場合は定期的に更新
    let intervalId: NodeJS.Timeout | null = null;
    if (is3DView) {
      intervalId = setInterval(handleUpdate, 100);
    }
    
    // 再レンダリング時や非マウント時にクリーンアップ
    return () => {
      isMounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (intervalId) clearInterval(intervalId);
      
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('imageLoaded', handleUpdate);
      window.removeEventListener('imageFullyLoaded', handleUpdate);
    };
  }, [pin.x_position, pin.y_position, containerRef, is3DView]);

  // 現在のユーザーが作成したピンかを判定
  const isMyPin = editorInfo && pin.editor_id === editorInfo.id;


  // 選択されたピンにフォーカスする
  useEffect(() => {
    if (isSelected && pinRef.current) {
      // 選択されたピンのアニメーション効果
      const element = pinRef.current;
      
      // スクロールが必要な場合は、ピンが見えるようにスクロール
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [isSelected, pinRef]);
  return (
    <button
      ref={pinRef}
      onClick={() => onPinClick(pin)}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${is3DView ? 'pin-3d' : 'pin-normal'}`}
      style={{
        left: `${pinPosition.left}px`,
        top: `${pinPosition.top}px`,
        display: pinPosition.display,
        zIndex: isSelected ? 100 : 50,
        pointerEvents: 'auto'
      }}
      data-pin-id={pin.id}
      data-pin-x={pin.x_position}
      data-pin-y={pin.y_position}
      data-floor-id={pin.floor_id}
    >
              <div className="w-6 h-12 relative flex flex-col items-center group">
        {/* ピンのヘッド部分 - 選択中は青く表示 */}
        <div className={`w-6 h-6 ${
          isSelected 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : isMyPin 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-red-500 hover:bg-red-600'
        } rounded-full flex items-center justify-center text-white 
                    shadow-md transition-all duration-200 border-2 border-white
                    hover:scale-110 z-10 transform-gpu group-hover:-translate-y-1`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* ピンの棒部分 - 選択中は青く表示 */}
        <div className="absolute flex flex-col items-center">
          {/* 上部 - 棒の上部 */}
          <div className={`h-4 w-2 ${
            isSelected 
              ? 'bg-blue-600' 
              : isMyPin 
                ? 'bg-green-600' 
                : 'bg-red-600'
          } z-0 transform-gpu rounded-b-none mt-4`}></div>
          
          {/* 下部 - 尖った部分 */}
          <div className={`h-3 w-2 ${
            isSelected 
              ? 'bg-blue-700' 
              : isMyPin 
                ? 'bg-green-700' 
                : 'bg-red-700'
          } clip-path-triangle z-0 transform-gpu`}></div>
        </div>
        
        {/* ピンの影 */}
        <div className="absolute bottom-0 w-4 h-1 bg-black/30 rounded-full blur-sm"></div>
        
        {/* 選択中のピンには小さな吹き出しを表示 */}
        {isSelected && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap z-20">
            {pin.title}
          </div>
        )}
      </div>
    </button>
  );
}


// メインコンポーネント
function PublicEditContent() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get('id') || '';
  
  // 基本状態
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [is3DView, setIs3DView] = useState<boolean>(false);
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
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  
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
      verifyEditorToken(savedEditor.id, savedEditor.token)
        .then(({ verified, editorInfo }) => {
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
            console.log('公開編集が許可されていません');
          throw new Error('このマップは公開編集が許可されていません');
        }
        
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
    
    // 3Dビューの場合、フロントインデックスも更新
    if (is3DView) {
      const index = floors.findIndex(f => f.id === floor.id);
      if (index !== -1) {
        setFrontFloorIndex(index);
      }
    }
  };

  // 3D表示モードを切り替え
  const toggle3DView = () => {
    setIs3DView(!is3DView);
    
    // 3Dビューに切り替えるとき、現在のアクティブフロアがフロント表示されるようにする
    if (!is3DView && activeFloor) {
      const index = floors.findIndex(f => f.id === activeFloor.id);
      if (index !== -1) {
        setFrontFloorIndex(index);
      }
    }
  };

  // 写真上でクリックした位置にピンを追加するモードを切り替える
  const toggleAddPinMode = () => {
    setIsAddingPin(!isAddingPin);
  };

  // 画像クリック時のピン追加処理
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, exactPosition: { x: number, y: number } | null) => {
    if (!isAddingPin || !editorInfo) return;
    if (!exactPosition) {
      // 通常のクリック位置計算（フォールバック）
      const targetFloorId = activeFloor?.id;
      if (!targetFloorId) return;
      
      // コンテナRef
      const containerRef = normalViewRef.current ? normalViewRef : { current: e.currentTarget };
      
      // 正規化された位置情報を取得
      const normalizedPosition = getExactImagePosition(e, containerRef as React.RefObject<HTMLElement>);
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
      setLoading(true);
      
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
        _temp: true
      };
      
      setPins(prevPins => [...prevPins, tempPin]);
      setNewPinInfo({ title: '', description: '' });
      setIsFormOpen(false);
      
      // APIリクエスト
      const result = await addPublicPin({
        floorId: activeFloor.id,
        title: newPinInfo.title,
        description: newPinInfo.description,
        x_position: newPinPosition.x,
        y_position: newPinPosition.y,
        editorId: editorInfo.id,
        nickname: editorInfo.nickname
      });

      if (!result.success) {
        throw new Error(result.error || 'ピンの追加に失敗しました');
      }

      // 一時ピンを実際のピンに置き換え
      setPins(prevPins => prevPins.filter(pin => !pin._temp).concat(result.pin));
      
    } catch (error) {
      // 一時ピンを削除（失敗時）
      setPins(prevPins => prevPins.filter(pin => !pin._temp));
      
      setError(error instanceof Error ? error.message : 'ピンの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };
// ピンをクリックしたときの処理
const handlePinClick = (pin: Pin) => {
    // 既に選択中のピンをクリックした場合は詳細を表示
    if (selectedPinId === pin.id) {
      setSelectedPin(pin);
      setIsModalOpen(true);
    } else {
      // 新しいピンを選択した場合は選択状態を更新
      setSelectedPinId(pin.id);
      setSelectedPin(pin);
      
      // フロア切り替えが必要か確認
      if (activeFloor?.id !== pin.floor_id) {
        const pinFloor = floors.find(floor => floor.id === pin.floor_id);
        if (pinFloor) {
          setActiveFloor(pinFloor);
          
          // 3Dビューの場合、フロントインデックスも更新
          if (is3DView) {
            const index = floors.findIndex(f => f.id === pinFloor.id);
            if (index !== -1) {
              setFrontFloorIndex(index);
            }
          }
        }
      }
      
      // 少し遅延させて詳細モーダルを表示
      setTimeout(() => {
        setIsModalOpen(true);
      }, 500); // 0.5秒後に表示
    }
  };

  // ピンの編集を開始
  const handleEditPin = (pin: Pin) => {
    // 自分が作成したピンのみ編集可能
    if (editorInfo && pin.editor_id === editorInfo.id) {
      setEditingPin(pin);
      setIsEditModalOpen(true);
      setIsModalOpen(false);
    }
  };

  // ピンの更新
  const updatePin = async (updatedPin: Pin) => {
    if (!editorInfo) return;
    
    try {
      setLoading(true);
      
      const result = await updatePublicPin({
        pinId: updatedPin.id,
        title: updatedPin.title,
        description: updatedPin.description,
        editorId: editorInfo.id
      });

      if (!result.success) {
        throw new Error(result.error || 'ピンの更新に失敗しました');
      }
      
      // ピンリストを更新
      setPins(pins.map(pin => pin.id === result.pin.id ? result.pin : pin));
      
      // モーダルを閉じる
      setIsEditModalOpen(false);
      setSelectedPin(null);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ピンの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ピンの削除
  const deletePin = async (pinId: string) => {
    if (!editorInfo) return;
    
    try {
      setLoading(true);
      
      // 削除するピンを取得
      const pinToDelete = pins.find(pin => pin.id === pinId);
      if (!pinToDelete) throw new Error('ピンが見つかりません');
      
      // 自分が作成したピンのみ削除可能
      if (pinToDelete.editor_id !== editorInfo.id) {
        throw new Error('このピンを削除する権限がありません');
      }
      
      // UIから先に削除（楽観的UI更新）
      setPins(prevPins => prevPins.filter(pin => pin.id !== pinId));
      
      // モーダルを閉じる
      setIsModalOpen(false);
      setSelectedPin(null);
      
      // APIリクエスト
      const result = await deletePublicPin({
        pinId,
        editorId: editorInfo.id
      });

      if (!result.success) {
        throw new Error(result.error || 'ピンの削除に失敗しました');
      }
      
    } catch (error) {
      // エラー時に元に戻す処理を追加
      setError(error instanceof Error ? error.message : 'ピンの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

 // ピン一覧からピンをクリックしたときの処理
 const handlePinListClick = (pin: Pin) => {
    // 選択状態を更新
    setSelectedPinId(pin.id);
    setSelectedPin(pin);
    
    // ピンがあるフロアをアクティブにする
    const pinFloor = floors.find(floor => floor.id === pin.floor_id);
    if (pinFloor) {
      setActiveFloor(pinFloor);
      
      // 3Dビューの場合、フロントインデックスも更新
      if (is3DView) {
        const index = floors.findIndex(f => f.id === pinFloor.id);
        if (index !== -1) {
          setFrontFloorIndex(index);
        }
      }
      
      // 少し遅延させてモーダルを表示
      setTimeout(() => {
        setIsModalOpen(true);
      }, 500); // 0.5秒後に表示
    }
  };
  // モーダルが閉じられたときの処理
  const handleModalClose = () => {
    setIsModalOpen(false);
    // モーダルを閉じてもピンの選択状態は維持する
  };

  // 編集完了時の処理
  const handleEditComplete = () => {
    // 編集モーダルを閉じる
    setIsEditModalOpen(false);
    setEditingPin(null);
    
    // 詳細モーダルも閉じる
    setIsModalOpen(false);
    
    // 選択状態はクリアしない - ピンの選択状態を維持
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator
          message="読み込み中..."
          isFullScreen={false}
        />
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{mapData.title}</h1>
            {mapData.description && (
              <p className="text-gray-600">{mapData.description}</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {editorInfo ? (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {editorInfo.nickname}さんとして編集中
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              閲覧モードで開く
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
                  <div className="text-gray-500 text-center py-4">
                    エリア情報がありません
                  </div>
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
                
                <button
                  onClick={toggle3DView}
                  className={`w-full px-4 py-2 rounded-md transition-colors ${
                    is3DView 
                    ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
                disabled={floors.length <= 1}
              >
                {is3DView ? '通常表示に戻す' : '3D表示にする(ベータ版)'}
              </button>
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
              is3DView={is3DView}
              selectedPinId={selectedPinId}
            />
          </div>
        </div>
        
        {/* 右側の表示エリア */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              {is3DView ? '3D表示(ベータ版)' : `${activeFloor?.name || 'エリアを選択してください'} 表示`}
            </h2>
            
            <div 
              ref={containerRef}
              className="relative bg-gray-100 rounded-lg overflow-hidden"
            >
              {is3DView ? (
                <div className="w-full h-96 relative">
                  <ImprovedView3D 
                    floors={floors}
                    pins={[]} // ピン表示はカスタムコンポーネントで行う
                    frontFloorIndex={frontFloorIndex}
                    showArrows={showModalArrows}
                    onPrevFloor={showPrevFloor}
                    onNextFloor={showNextFloor}
                    onImageClick={(e, floorId) => {
                      // 3Dビューでの画像クリック時の処理
                      const currentFloor = floors.find(f => f.id === floorId);
                      if (currentFloor && isAddingPin && e.nativeEvent) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setNewPinPosition({ x, y });
                        setNewPinInfo({ title: '', description: '' });
                        setIsFormOpen(true);
                      }
                    }}
                  />
                  
                  {/* 各エリアのピンを表示 */}
                  {pins.map((pin) => (
                    <PublicPinViewer
                      key={pin.id}
                      pin={pin}
                      floors={floors}
                      containerRef={containerRef}
                      is3DView={true}
                      onPinClick={handlePinClick}
                      editorInfo={editorInfo}
                      isSelected={selectedPinId === pin.id} // 選択状態を渡す
                    />
                  ))}
                </div>
              ) : (
                <div 
                  ref={normalViewRef} 
                  className="w-full h-96 relative"
                >
                  <NormalView
                    floor={activeFloor}
                    pins={[]} // ピン表示はカスタムコンポーネントで行う
                    onImageClick={handleImageClick}
                  />
                  
                  {/* 現在のエリアのピンのみを表示 */}
                  {activeFloor && pins
                    .filter(pin => pin.floor_id === activeFloor.id)
                    .map((pin) => (
                      <PublicPinViewer
                        key={pin.id}
                        pin={pin}
                        floors={floors}
                        containerRef={normalViewRef}
                        is3DView={false}
                        onPinClick={handlePinClick}
                        editorInfo={editorInfo}
                        isSelected={selectedPinId === pin.id} // 選択状態を渡す
                      />
                    ))}
                </div>
              )}
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
          disabled={!newPinInfo.title.trim() || loading}
        >
          {loading ? '保存中...' : '保存'}
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
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {floors.find(floor => floor.id === selectedPin.floor_id)?.name || '不明なエリア'}
            </span>
            
            {selectedPin.editor_nickname && (
              <span className="text-xs text-gray-500">
                作成者: {selectedPin.editor_nickname}
              </span>
            )}
          </div>
          
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-line">{selectedPin.description}</p>
          </div>
          
          {/* 自分が作成したピンの場合は編集と削除ボタンを表示 */}
          {editorInfo && selectedPin.editor_id === editorInfo.id && (
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => deletePin(selectedPin.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                disabled={loading}
              >
                {loading ? '処理中...' : '削除'}
              </button>
              <button
                onClick={() => handleEditPin(selectedPin)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                編集
              </button>
            </div>
          )}
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
              onClick={() => updatePin(editingPin)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={!editingPin.title.trim() || loading}
            >
              {loading ? '保存中...' : '保存'}
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
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center">
      <LoadingIndicator
        message="読み込み中..."
        isFullScreen={false}
      />
    </div>
  }>
    <PublicEditContent />
  </Suspense>
);
}