// app/maps/[mapId]/edit/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
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
import LoadingIndicator from '@/components/LoadingIndicator';
import ImageUploader from '@/components/ImageUploader';
import { getExactImagePosition } from '@/utils/imageExactPositioning';

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
  const [showAddFloorForm, setShowAddFloorForm] = useState(false);
  const [newFloor, setNewFloor] = useState({ floor_number: 1, name: '' });
  const [showModalArrows, setShowModalArrows] = useState(true);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<{
    loading: boolean;
    message: string;
    error: string | null;
  }>({
    loading: false,
    message: '',
    error: null
  });
  
  // refs
  const normalViewRef = useRef<HTMLDivElement>(null);
  
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

  // API操作のラッパー関数 - 状態を管理して非同期処理を行う
  const executeApiCall = async (
    apiCall: () => Promise<any>,
    loadingMessage: string,
    successCallback?: (data: any) => void
  ) => {
    setApiStatus({
      loading: true,
      message: loadingMessage,
      error: null
    });
    
    try {
      const result = await apiCall();
      
      // 成功時の処理
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
      
      if (successCallback && result) {
        successCallback(result);
      }
      
      return result;
    } catch (error) {
      // エラー時の処理
      let errorMessage = 'エラーが発生しました';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setApiStatus({
        loading: false,
        message: '',
        error: errorMessage
      });
      
      // 3秒後にエラーメッセージをクリア
      setTimeout(() => {
        setApiStatus(prevState => ({
          ...prevState,
          error: null
        }));
      }, 3000);
      
      throw error;
    }
  };

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
      }
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
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

  // 全ピンを取得する関数
  const fetchAllPins = useCallback(async () => {
    if (floors.length === 0) return;
    
    setApiStatus({
      loading: true,
      message: 'ピンデータを読み込み中...',
      error: null
    });
    
    try {
      // マップに関連する全てのエリアのIDを取得
      const floorIds = floors.map(floor => floor.id);
      
      // すべてのエリアのピンを同時に取得
      const requests = floorIds.map(floorId => 
        fetch(`/api/floors/${floorId}/pins`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`フロア ${floorId} のピン取得に失敗しました`);
            }
            return response.json();
          })
      );
      
      // すべてのリクエストを並列実行
      const results = await Promise.allSettled(requests);
      
      // 成功したリクエストの結果を結合
      const pins: Pin[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          pins.push(...result.value);
        } else {
          console.error(`フロア ${floorIds[index]} のピン取得エラー:`, result.reason);
        }
      });
      
      setPins(pins);
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      console.error('全ピンの取得エラー:', error);
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : 'ピンの取得に失敗しました'
      });
    }
  }, [floors]);
  
  // フロアデータ取得後に全ピンを取得
  useEffect(() => {
    if (floors.length > 0) {
      fetchAllPins();
    }
  }, [floors, fetchAllPins]);

  // アクティブなエリアを変更
  const handleFloorChange = (floor: Floor) => {
    setActiveFloor(floor);
  };

  // エリアの追加
  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapData) return;

    try {
      setApiStatus({
        loading: true,
        message: 'エリアを追加中...',
        error: null
      });
      
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
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        setApiStatus({
          loading: false,
          message: '',
          error: error.message
        });
      } else {
        setError('エリアの追加に失敗しました');
        setApiStatus({
          loading: false,
          message: '',
          error: 'エリアの追加に失敗しました'
        });
      }
    }
  };

  // エリアの削除 - 修正版
  const handleDeleteFloor = async (floorId: string) => {
    console.log(`handleDeleteFloor関数が呼び出されました。FLOOR ID: ${floorId}`);
    
    // 削除確認ダイアログ - キャンセルされた場合はここで処理終了
    if (!window.confirm('このエリアを削除してもよろしいですか？ 関連するピンもすべて削除されます。')) {
      console.log('削除がキャンセルされました');
      return;
    }

    // 削除するフロアと関連ピンをバックアップ
    const floorToDelete = floors.find(floor => floor.id === floorId);
    const relatedPins = pins.filter(pin => pin.floor_id === floorId);
    
    if (!floorToDelete) {
      console.error(`ID ${floorId} のフロアが見つかりません`);
      setError('削除するエリアが見つかりません');
      return;
    }

    // UI状態を更新 - 処理中表示
    setApiStatus({
      loading: true,
      message: 'エリアを削除中...',
      error: null
    });
    
    // UI上でフロアと関連ピンを先に非表示（楽観的UI更新）
    setFloors(prevFloors => prevFloors.filter(floor => floor.id !== floorId));
    setPins(prevPins => prevPins.filter(pin => pin.floor_id !== floorId));
    
    // 削除したエリアがアクティブだった場合、別のエリアをアクティブに設定
    if (activeFloor?.id === floorId) {
      const updatedFloors = floors.filter(floor => floor.id !== floorId);
      if (updatedFloors.length > 0) {
        setActiveFloor(updatedFloors[0]);
      } else {
        setActiveFloor(null);
      }
    }

    try {
      console.log(`フロア削除APIを呼び出します: /api/floors/${floorId}`);
      
      // APIリクエストを直接XMLHttpRequestで実行
      const xhr = new XMLHttpRequest();
      xhr.open('DELETE', `/api/floors/${floorId}`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store');
      xhr.setRequestHeader('Pragma', 'no-cache');
      
      // タイムアウト設定
      xhr.timeout = 15000; // 15秒
      
      // レスポンスハンドラ
      xhr.onload = function() {
        console.log(`フロア削除API応答: ステータス ${xhr.status}, レスポンス:`, xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // 成功処理
          setApiStatus({
            loading: false,
            message: '',
            error: null
          });
          
          // 成功通知
          const notification = document.createElement('div');
          notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
          notification.textContent = 'エリアを削除しました';
          document.body.appendChild(notification);
          
          // 3秒後に通知を削除
          setTimeout(() => {
            notification.remove();
          }, 3000);
        } else {
          // エラー処理
          console.error(`フロア削除APIエラー: ステータス ${xhr.status}`);
          
          let errorMessage = 'エリアの削除に失敗しました';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse && errorResponse.error) {
              errorMessage = errorResponse.error;
            }
          } catch (e) {
            // レスポンスのJSONパースに失敗した場合
            console.warn('エラーレスポンスのパースに失敗:', e);
          }
          
          // エラーメッセージを表示
          setApiStatus({
            loading: false,
            message: '',
            error: `${errorMessage} (ステータス: ${xhr.status})`
          });
          
          // 削除に失敗した場合、エリアとピンを元に戻す
          setFloors(prevFloors => {
            // すでに含まれていなければ追加
            if (!prevFloors.some(f => f.id === floorToDelete.id)) {
              return [...prevFloors, floorToDelete];
            }
            return prevFloors;
          });
          setPins(prevPins => [...prevPins, ...relatedPins]);
          
          // アクティブフロアも元に戻す
          if (activeFloor === null && floorToDelete) {
            setActiveFloor(floorToDelete);
          }
        }
      };
      
      // エラーハンドラ
      xhr.onerror = function() {
        console.error('フロア削除API通信エラー');
        
        // エラーメッセージを表示
        setApiStatus({
          loading: false,
          message: '',
          error: 'ネットワークエラー：エリアの削除に失敗しました'
        });
        
        // 削除に失敗した場合、エリアとピンを元に戻す
        setFloors(prevFloors => [...prevFloors, floorToDelete]);
        setPins(prevPins => [...prevPins, ...relatedPins]);
        
        // アクティブフロアも元に戻す
        if (activeFloor === null && floorToDelete) {
          setActiveFloor(floorToDelete);
        }
      };
      
      // タイムアウトハンドラ
      xhr.ontimeout = function() {
        console.error('フロア削除APIタイムアウト');
        
        // エラーメッセージを表示
        setApiStatus({
          loading: false,
          message: '',
          error: 'タイムアウト：エリアの削除に失敗しました'
        });
        
        // 削除に失敗した場合、エリアとピンを元に戻す
        setFloors(prevFloors => [...prevFloors, floorToDelete]);
        setPins(prevPins => [...prevPins, ...relatedPins]);
        
        // アクティブフロアも元に戻す
        if (activeFloor === null && floorToDelete) {
          setActiveFloor(floorToDelete);
        }
      };
      
      // リクエスト送信
      xhr.send();
      
    } catch (error) {
      console.error('フロア削除中の例外:', error);
      
      // エラーメッセージを表示
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : 'エリアの削除に失敗しました'
      });
      
      // 削除に失敗した場合、エリアとピンを元に戻す
      setFloors(prevFloors => [...prevFloors, floorToDelete]);
      setPins(prevPins => [...prevPins, ...relatedPins]);
      
      // アクティブフロアも元に戻す
      if (activeFloor === null && floorToDelete) {
        setActiveFloor(floorToDelete);
      }
    }
  };

  // 画像アップロード
  const handleImageUpload = (floorId: string, imageUrl: string) => {
    // 画像アップロードが完了した時に呼ばれるコールバック
    try {
      // エリアリストを更新
      setFloors(prevFloors => prevFloors.map(floor => 
        floor.id === floorId ? {...floor, image_url: imageUrl} : floor
      ));
      
      // アクティブなエリアが更新された場合、アクティブなエリアも更新
      if (activeFloor?.id === floorId) {
        setActiveFloor(prevFloor => prevFloor ? {...prevFloor, image_url: imageUrl} : null);
      }
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      let errorMessage = '画像の処理に失敗しました';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setApiStatus({
        loading: false,
        message: '',
        error: errorMessage
      });
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

  // 画像クリック時のピン追加処理
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, exactPosition: { x: number, y: number } | null) => {
    if (!isAddingPin) return;
    if (!exactPosition) {
      // 通常のクリック位置計算（フォールバック）
      const targetFloorId = activeFloor?.id;
      if (!targetFloorId) return;
      
      // コンテナRef
      const containerRef = normalViewRef.current ? normalViewRef : { current: e.currentTarget };
      
      // 正規化された位置情報を取得
      const normalizedPosition = getExactImagePosition(e, containerRef as RefObject<HTMLElement>);
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
      setApiStatus({
        loading: true,
        message: 'ピンを追加中...',
        error: null
      });
      
      // 一時的なピンをUIに追加（楽観的UI更新）
      const tempId = `temp-${Date.now()}`;
      const tempPin: Pin = {
        id: tempId,
        floor_id: activeFloor.id,
        title: newPinInfo.title,
        description: newPinInfo.description,
        x_position: newPinPosition.x,
        y_position: newPinPosition.y,
        _temp: true
      };
      
      setPins(prevPins => [...prevPins, tempPin]);
      setNewPinInfo({ title: '', description: '' });
      setIsFormOpen(false);
      
      // APIリクエスト
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
      
      // 一時ピンを実際のピンに置き換え
      setPins(prevPins => prevPins.filter(pin => !pin._temp).concat(newPin));
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      // 一時ピンを削除（失敗時）
      setPins(prevPins => prevPins.filter(pin => !pin._temp));
      
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : 'ピンの追加に失敗しました'
      });
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

  // ピンの削除 - 修正版
  const deletePin = async (pinId: string) => {
    console.log(`deletePin関数が呼び出されました。PIN ID: ${pinId}`);
    
    // 削除対象のピンのバックアップを保存（削除が失敗した場合に備えて）
    const pinToDelete = pins.find(pin => pin.id === pinId);
    if (!pinToDelete) {
      console.error(`ID ${pinId} のピンが見つかりません`);
      setError('削除するピンが見つかりませんでした');
      return;
    }
    
    // UI状態を処理中に設定
    setApiStatus({
      loading: true,
      message: 'ピンを削除しています...',
      error: null
    });
    
    // UI上でピンを先に非表示（楽観的UI更新）
    setPins(pins.filter(pin => pin.id !== pinId));
    
    // モーダルを閉じる
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedPin(null);
    
    try {
      console.log(`ピン削除APIを呼び出します: /api/pins/${pinId}`);
      
      // XMLHttpRequestを使用した削除処理（FetchAPIの代わりに）
      const xhr = new XMLHttpRequest();
      xhr.open('DELETE', `/api/pins/${pinId}`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store');
      xhr.setRequestHeader('Pragma', 'no-cache');
      
      // タイムアウト設定
      xhr.timeout = 10000; // 10秒
      
      // レスポンスハンドラ
      xhr.onload = function() {
        console.log(`ピン削除API応答: ステータス ${xhr.status}, レスポンス: ${xhr.responseText}`);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // 成功処理
          setApiStatus({
            loading: false,
            message: '',
            error: null
          });
          
          // 成功通知
          const notification = document.createElement('div');
          notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
          notification.textContent = 'ピンを削除しました';
          document.body.appendChild(notification);
          
          // 3秒後に通知を削除
          setTimeout(() => {
            notification.remove();
          }, 3000);
        } else {
          // エラー処理
          console.error(`ピン削除APIエラー: ステータス ${xhr.status}`);
          
          // エラーメッセージを表示
          setApiStatus({
            loading: false,
            message: '',
            error: `ピンの削除に失敗しました (ステータス: ${xhr.status})`
          });
          
          // 削除に失敗した場合、ピンを元に戻す
          setPins(prevPins => [...prevPins, pinToDelete]);
        }
      };
      
      // エラーハンドラ
      xhr.onerror = function() {
        console.error('ピン削除API通信エラー');
        
        // エラーメッセージを表示
        setApiStatus({
          loading: false,
          message: '',
          error: 'ネットワークエラー：ピンの削除に失敗しました'
        });
        
        // 削除に失敗した場合、ピンを元に戻す
        setPins(prevPins => [...prevPins, pinToDelete]);
      };
      
      // タイムアウトハンドラ
      xhr.ontimeout = function() {
        console.error('ピン削除APIタイムアウト');
        
        // エラーメッセージを表示
        setApiStatus({
          loading: false,
          message: '',
          error: 'タイムアウト：ピンの削除に失敗しました'
        });
        
        // 削除に失敗した場合、ピンを元に戻す
        setPins(prevPins => [...prevPins, pinToDelete]);
      };
      
      // リクエスト送信
      xhr.send();
      
    } catch (error) {
      console.error('ピン削除中の例外:', error);
      
      // エラーメッセージを表示
      setApiStatus({
        loading: false,
        message: '',
        error: error instanceof Error ? error.message : 'ピンの削除に失敗しました'
      });
      
      // 削除に失敗した場合、ピンを元に戻す
      setPins(prevPins => [...prevPins, pinToDelete]);
    }
  };

  // ピンの更新
  const updatePin = async (updatedPin: Pin) => {
    try {
      setApiStatus({
        loading: true,
        message: 'ピンを更新中...',
        error: null
      });
      
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
      
      setApiStatus({
        loading: false,
        message: '',
        error: null
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        setApiStatus({
          loading: false,
          message: '',
          error: error.message
        });
      } else {
        setError('ピンの更新に失敗しました');
        setApiStatus({
          loading: false,
          message: '',
          error: 'ピンの更新に失敗しました'
        });
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

  if (loading && status !== 'loading') {
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          マップが見つかりません。
        </div>
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
        
        {apiStatus.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{apiStatus.error}</span>
          </div>
        )}
        
        {apiStatus.loading && (
          <div className="mb-4">
            <LoadingIndicator 
              message={apiStatus.message} 
              isFullScreen={false} 
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* 右側の表示エリア */}
           <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold mb-4 text-gray-700">
                              {is3DView ? '3D表示' : `${activeFloor?.name || 'エリアを選択してください'} `}
                            </h2>
                            <button
                                onClick={() => setShowAddFloorForm(!showAddFloorForm)}
                                className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded cursor-pointer"
                              >
                                {showAddFloorForm ? 'キャンセル' : 'エリア追加'}
                              </button>
            </div>
              
              {is3DView ? (
                // 3D表示モード
                <View3D 
                  floors={floors}
                  pins={pins}
                  frontFloorIndex={frontFloorIndex}
                  showArrows={showModalArrows}
                  onPrevFloor={showPrevFloor}
                  onNextFloor={showNextFloor}
                  onImageClick={(e) => handleImageClick(e, null)}
                  isAddingPin={isAddingPin}
                />
              ) : (
                // 通常表示モード
                <div ref={normalViewRef}>
                  <NormalView
                    floor={activeFloor}
                    pins={pins}
                    onImageClick={(e) => handleImageClick(e, null)}
                  />
                </div>
                
              )}
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
                      disabled={apiStatus.loading}
                    >
                      {apiStatus.loading ? '処理中...' : '追加'}
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
                        <div className="flex items-center" onClick={() => handleFloorChange(floor)}>
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
                            buttonText={floor.image_url ? '変更' : '画像追加'}
                            className="px-3 py-2 rounded text-sm"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log(`フロア削除ボタンがクリックされました。FLOOR ID: ${floor.id}`);
                              handleDeleteFloor(floor.id);
                            }}
                            className="mx-3 px-2 py-1 bg-red-400 text-white rounded text-sm hover:bg-red-200 cursor-pointer"
                            data-floor-id={floor.id}
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
              {/* {showPinList && (
                <div className="mt-6">
                  <PinList 
                    pins={pins} 
                    floors={floors}
                    activeFloor={activeFloor?.id || null} 
                    onPinClick={handlePinClick}
                    is3DView={is3DView}
                  />
                </div>
              )} */}
            </div>
          </div>
          
          {/* 右側の表示エリア */}
          {/* <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                {is3DView ? '3D表示' : `${activeFloor?.name || 'エリアを選択してください'} 表示`}
              </h2>
              
              {is3DView ? (
                // 3D表示モード
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
                // 通常表示モード
                <div ref={normalViewRef}>
                  <NormalView
                    floor={activeFloor}
                    pins={pins}
                    onImageClick={(e) => handleImageClick(e, null)}
                  />
                </div>
              )}
            </div>
          </div> */}
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
              disabled={apiStatus.loading}
            >
              {apiStatus.loading ? '保存中...' : '保存'}
            </button>
          </div>
        </Modal>
        
        {/* ピン情報表示モーダル */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPin(null);
          }}
          title={selectedPin?.title || 'ピン情報'}
        >
          {selectedPin && (
            <div>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {floors.find(floor => floor.id === selectedPin.floor_id)?.name || '不明なエリア'}
                </span>
              </div>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-line">{selectedPin.description}</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                {/* 直接DOMイベントを使用した削除ボタン */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // 削除確認
                    if (window.confirm(`このピン「${selectedPin.title}」を削除してもよろしいですか？`)) {
                      console.log('削除処理実行: PIN ID:', selectedPin.id);
                      deletePin(selectedPin.id);
                    }
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
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPin(null);
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
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={apiStatus.loading}
                >
                  {apiStatus.loading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}