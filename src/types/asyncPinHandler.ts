// utils/asyncPinHandler.ts
import { Pin } from "@/types/map-types";

interface PinCreationData {
  floorId: string;
  title: string;
  description: string;
  x_position: number;
  y_position: number;
}

interface PinUpdateData {
  pinId: string;
  title: string;
  description: string;
}

// ピン追加用の非同期処理
export const addPinAsync = async (
  pinData: PinCreationData,
  optimisticCallback: (tempPin: Pin) => void,
  successCallback: (newPin: Pin) => void,
  errorCallback: (error: Error) => void
) => {
  // 一時的なIDを生成
  const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // 楽観的更新のための一時ピンを作成
  const tempPin: Pin = {
    id: tempId,
    floor_id: pinData.floorId,
    title: pinData.title,
    description: pinData.description,
    x_position: pinData.x_position,
    y_position: pinData.y_position,
    // 楽観的更新用の一時フラグ
    _temp: true
  };
  
  // 楽観的更新でUIを即座に更新
  optimisticCallback(tempPin);
  
  try {
    // 実際のAPI呼び出し
    const response = await fetch(`/api/floors/${pinData.floorId}/pins`, {
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
      const data = await response.json();
      throw new Error(data.error || 'ピンの追加に失敗しました');
    }

    const newPin = await response.json();
    
    // 成功コールバックを呼び出し
    successCallback(newPin);
    return newPin;
  } catch (error) {
    // エラー処理
    console.error('ピン追加エラー:', error);
    if (error instanceof Error) {
      errorCallback(error);
    } else {
      errorCallback(new Error('ピンの追加に失敗しました'));
    }
    throw error;
  }
};

// ピン更新用の非同期処理
export const updatePinAsync = async (
  updateData: PinUpdateData,
  optimisticCallback: (updatedPin: Partial<Pin>) => void,
  successCallback: (pin: Pin) => void,
  errorCallback: (error: Error, originalPin: Partial<Pin>) => void,
  originalPin: Partial<Pin>
) => {
  // 楽観的更新のための一時更新データ
  const tempUpdatedPin: Partial<Pin> = {
    ...originalPin,
    title: updateData.title,
    description: updateData.description,
    _updating: true
  };
  
  // 楽観的更新でUIを即座に更新
  optimisticCallback(tempUpdatedPin);
  
  try {
    // 実際のAPI呼び出し
    const response = await fetch(`/api/pins/${updateData.pinId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: updateData.title,
        description: updateData.description,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'ピンの更新に失敗しました');
    }

    const updatedPin = await response.json();
    
    // 成功コールバックを呼び出し
    successCallback(updatedPin);
    return updatedPin;
  } catch (error) {
    // エラー処理 - 元のデータに戻す
    console.error('ピン更新エラー:', error);
    if (error instanceof Error) {
      errorCallback(error, originalPin);
    } else {
      errorCallback(new Error('ピンの更新に失敗しました'), originalPin);
    }
    throw error;
  }
};

// ピン削除用の非同期処理
export const deletePinAsync = async (
  pinId: string,
  optimisticCallback: () => void,
  successCallback: () => void,
  errorCallback: (error: Error) => void
) => {
  // 楽観的更新でUIを即座に更新
  optimisticCallback();
  
  try {
    // 実際のAPI呼び出し
    const response = await fetch(`/api/pins/${pinId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'ピンの削除に失敗しました');
    }
    
    // 成功コールバックを呼び出し
    successCallback();
  } catch (error) {
    // エラー処理
    console.error('ピン削除エラー:', error);
    if (error instanceof Error) {
      errorCallback(error);
    } else {
      errorCallback(new Error('ピンの削除に失敗しました'));
    }
    throw error;
  }
};