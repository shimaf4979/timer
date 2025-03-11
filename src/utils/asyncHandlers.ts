// utils/asyncHandlers.ts
import { Pin, Floor } from '@/types/map-types';

// ピン関連の非同期ハンドラー
export interface PinData {
  id?: string;
  floor_id: string;
  title: string;
  description: string;
  x_position: number;
  y_position: number;
}

export interface AsyncResponse<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

// ピンを非同期で追加し、即時UIを更新するハンドラー
export const addPinAsync = async (
  pinData: Omit<PinData, 'id'>,
  onOptimisticUpdate: (tempPin: Pin) => void,
  onSuccess: (pin: Pin) => void,
  onError: (error: Error) => void
): Promise<Pin> => {
  const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  // 一時的なピンをUIに追加
  const tempPin: Pin = {
    id: tempId,
    floor_id: pinData.floor_id,
    title: pinData.title,
    description: pinData.description,
    x_position: pinData.x_position,
    y_position: pinData.y_position,
    _temp: true
  };
  
  // 楽観的更新
  onOptimisticUpdate(tempPin);
  
  try {
    // 実際のAPI呼び出し
    const response = await fetch(`/api/floors/${pinData.floor_id}/pins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: pinData.title,
        description: pinData.description,
        x_position: pinData.x_position,
        y_position: pinData.y_position,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ピンの追加に失敗しました');
    }
    
    const newPin = await response.json();
    onSuccess(newPin);
    return newPin;
  } catch (error) {
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error('ピンの追加中にエラーが発生しました'));
    }
    throw error;
  }
};

// フロア画像をアップロードする非同期ハンドラー
export const uploadFloorImageAsync = async (
  floorId: string,
  file: File,
  onProgress: (progress: number) => void,
  onSuccess: (floor: Floor) => void,
  onError: (error: Error) => void
): Promise<Floor> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const xhr = new XMLHttpRequest();
    
    // アップロード進捗の監視
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });
    
    // リクエスト完了時の処理
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          onSuccess(response);
          resolve(response);
        } catch (error) {
          const err = new Error('レスポンスの解析に失敗しました');
          onError(err);
          reject(err);
        }
      } else {
        let errorMessage = '画像のアップロードに失敗しました';
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.error) {
            errorMessage = errorResponse.error;
          }
        } catch (e) {
          // エラーレスポンスのパースに失敗した場合は無視
        }
        const err = new Error(errorMessage);
        onError(err);
        reject(err);
      }
    };
    
    // エラーハンドリング
    xhr.onerror = function() {
      const err = new Error('ネットワークエラーが発生しました');
      onError(err);
      reject(err);
    };
    
    // タイムアウト設定
    xhr.timeout = 30000; // 30秒
    xhr.ontimeout = function() {
      const err = new Error('アップロードがタイムアウトしました');
      onError(err);
      reject(err);
    };
    
    // リクエスト送信
    xhr.open('POST', `/api/floors/${floorId}/image`, true);
    xhr.send(formData);
  });
};

// フロア情報を非同期で取得するハンドラー
export const fetchFloorsAsync = async (
  mapId: string,
  onLoading: () => void,
  onSuccess: (floors: Floor[]) => void,
  onError: (error: Error) => void
): Promise<Floor[]> => {
  onLoading();
  
  try {
    const response = await fetch(`/api/maps/${mapId}/floors`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'エリアの取得に失敗しました');
    }
    
    const floors = await response.json();
    onSuccess(floors);
    return floors;
  } catch (error) {
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error('エリアの取得中にエラーが発生しました'));
    }
    throw error;
  }
};

// ピン情報を非同期で取得するハンドラー
export const fetchAllPinsAsync = async (
  floors: Floor[],
  onLoading: () => void,
  onSuccess: (pins: Pin[]) => void,
  onError: (error: Error) => void
): Promise<Pin[]> => {
  if (floors.length === 0) return [];
  
  onLoading();
  
  try {
    // すべてのフロアのピンを同時に取得
    const floorIds = floors.map(floor => floor.id);
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
    
    onSuccess(pins);
    return pins;
  } catch (error) {
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error('ピンの取得中にエラーが発生しました'));
    }
    throw error;
  }
};