// utils/deleteHandlers.ts
import { Pin, Floor } from '@/types/map-types';

/**
 * ピンの削除を処理する関数
 * @param pinId 削除するピンのID
 * @param onSuccess 成功時のコールバック
 * @param onError エラー時のコールバック
 */
export const deletePinWithRetry = async (
  pinId: string,
  onSuccess: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  // リトライ回数の設定
  const maxRetries = 3;
  let retryCount = 0;
  
  const deleteWithRetry = async (): Promise<void> => {
    console.log('deletePinWithRetry');
    try {
      // fetch APIを使用
      const response = await fetch(`/api/pins/${pinId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // キャッシュ関連のヘッダーを追加
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        // クレデンシャルを含める (CORS対策)
        credentials: 'include'
      });
      
      // レスポンスのステータスコードをチェック
      if (response.ok) {
        const data = await response.json();
        console.log('削除成功:', data);
        onSuccess();
      } else {
        // HTTPエラーの場合
        const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
        throw new Error(errorData.error || `ステータスコード ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('削除エラー (試行 ' + (retryCount + 1) + '/' + maxRetries + '):', error);
      
      // リトライ判定
      retryCount++;
      if (retryCount < maxRetries) {
        // リトライ間隔を少し空ける (500ms * リトライ回数)
        const retryDelay = 500 * retryCount;
        console.log(`${retryDelay}ms後にリトライします...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return deleteWithRetry();
      } else {
        // 最大リトライ回数に達した場合
        if (error instanceof Error) {
          onError(error);
        } else {
          onError(new Error('ピンの削除に失敗しました'));
        }
      }
    }
  };
  
  // 最初の実行
  await deleteWithRetry();
};

/**
 * フロア（エリア）の削除を処理する関数
 * @param floorId 削除するフロアのID
 * @param onSuccess 成功時のコールバック
 * @param onError エラー時のコールバック
 */
export const deleteFloorWithRetry = async (
  floorId: string,
  onSuccess: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  // リトライ回数の設定
  const maxRetries = 3;
  let retryCount = 0;
  
  const deleteWithRetry = async (): Promise<void> => {
    try {
      // fetch APIを使用
      const response = await fetch(`/api/floors/${floorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // キャッシュ関連のヘッダーを追加
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        // クレデンシャルを含める (CORS対策)
        credentials: 'include'
      });
      
      // レスポンスのステータスコードをチェック
      if (response.ok) {
        const data = await response.json();
        console.log('削除成功:', data);
        onSuccess();
      } else {
        // HTTPエラーの場合
        const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
        throw new Error(errorData.error || `ステータスコード ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('削除エラー (試行 ' + (retryCount + 1) + '/' + maxRetries + '):', error);
      
      // リトライ判定
      retryCount++;
      if (retryCount < maxRetries) {
        // リトライ間隔を少し空ける (500ms * リトライ回数)
        const retryDelay = 500 * retryCount;
        console.log(`${retryDelay}ms後にリトライします...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return deleteWithRetry();
      } else {
        // 最大リトライ回数に達した場合
        if (error instanceof Error) {
          onError(error);
        } else {
          onError(new Error('フロアの削除に失敗しました'));
        }
      }
    }
  };
  
  // 最初の実行
  await deleteWithRetry();
};

/**
 * マップの削除を処理する関数
 * @param mapId 削除するマップのID
 * @param onSuccess 成功時のコールバック
 * @param onError エラー時のコールバック
 */
export const deleteMapWithRetry = async (
  mapId: string,
  onSuccess: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  // リトライ回数の設定
  const maxRetries = 3;
  let retryCount = 0;
  
  const deleteWithRetry = async (): Promise<void> => {
    try {
      // fetch APIを使用
      const response = await fetch(`/api/maps/${mapId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // キャッシュ関連のヘッダーを追加
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        // クレデンシャルを含める (CORS対策)
        credentials: 'include'
      });
      
      // レスポンスのステータスコードをチェック
      if (response.ok) {
        const data = await response.json();
        console.log('削除成功:', data);
        onSuccess();
      } else {
        // HTTPエラーの場合
        const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
        throw new Error(errorData.error || `ステータスコード ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('削除エラー (試行 ' + (retryCount + 1) + '/' + maxRetries + '):', error);
      
      // リトライ判定
      retryCount++;
      if (retryCount < maxRetries) {
        // リトライ間隔を少し空ける (500ms * リトライ回数)
        const retryDelay = 500 * retryCount;
        console.log(`${retryDelay}ms後にリトライします...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return deleteWithRetry();
      } else {
        // 最大リトライ回数に達した場合
        if (error instanceof Error) {
          onError(error);
        } else {
          onError(new Error('マップの削除に失敗しました'));
        }
      }
    }
  };
  
  // 最初の実行
  await deleteWithRetry();
};