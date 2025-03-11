// utils/deleteHandlers.ts
import { Pin, Floor } from '@/types/map-types';

/**
 * ピンの削除を処理する関数（改善版）
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
    console.log('deletePinWithRetry', pinId);
    try {
      // fetchよりもXMLHttpRequestを使用
      const xhr = new XMLHttpRequest();
      
      // Promiseでラップして同期的に扱えるようにする
      await new Promise<void>((resolve, reject) => {
        xhr.open('DELETE', `/api/pins/${pinId}`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        // キャッシュ関連のヘッダーを追加
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store');
        xhr.setRequestHeader('Pragma', 'no-cache');
        
        // CORSセットアップ
        xhr.withCredentials = true;
        
        // タイムアウト設定
        xhr.timeout = 10000; // 10秒
        
        // レスポンスハンドラ
        xhr.onload = function() {
          console.log(`Delete API response: status ${xhr.status}`);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Delete success:', xhr.responseText);
            resolve();
          } else {
            // HTTPエラーの場合
            let errorMessage = 'ピンの削除に失敗しました';
            try {
              const errorData = JSON.parse(xhr.responseText);
              if (errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (e) {
              // レスポンスのJSONパースに失敗した場合
            }
            reject(new Error(`${errorMessage} (Status: ${xhr.status})`));
          }
        };
        
        // エラーハンドラ
        xhr.onerror = function() {
          console.error('Network error during delete');
          reject(new Error('ネットワークエラーが発生しました'));
        };
        
        // タイムアウトハンドラ
        xhr.ontimeout = function() {
          console.error('Delete request timed out');
          reject(new Error('リクエストがタイムアウトしました'));
        };
        
        // リクエスト送信
        xhr.send();
      });
      
      // 成功時のコールバック
      onSuccess();
      console.log('Pin deletion successful');
      
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
 * フロア（エリア）の削除を処理する関数（改善版）
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
    console.log('deleteFloorWithRetry', floorId);
    try {
      // fetchよりもXMLHttpRequestを使用
      const xhr = new XMLHttpRequest();
      
      // Promiseでラップして同期的に扱えるようにする
      await new Promise<void>((resolve, reject) => {
        xhr.open('DELETE', `/api/floors/${floorId}`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        // キャッシュ関連のヘッダーを追加
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store');
        xhr.setRequestHeader('Pragma', 'no-cache');
        
        // CORSセットアップ
        xhr.withCredentials = true;
        
        // タイムアウト設定
        xhr.timeout = 15000; // 15秒
        
        // レスポンスハンドラ
        xhr.onload = function() {
          console.log(`Delete API response: status ${xhr.status}`);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Delete success:', xhr.responseText);
            resolve();
          } else {
            // HTTPエラーの場合
            let errorMessage = 'フロアの削除に失敗しました';
            try {
              const errorData = JSON.parse(xhr.responseText);
              if (errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (e) {
              // レスポンスのJSONパースに失敗した場合
            }
            reject(new Error(`${errorMessage} (Status: ${xhr.status})`));
          }
        };
        
        // エラーハンドラ
        xhr.onerror = function() {
          console.error('Network error during delete');
          reject(new Error('ネットワークエラーが発生しました'));
        };
        
        // タイムアウトハンドラ
        xhr.ontimeout = function() {
          console.error('Delete request timed out');
          reject(new Error('リクエストがタイムアウトしました'));
        };
        
        // リクエスト送信
        xhr.send();
      });
      
      // 成功時のコールバック
      onSuccess();
      console.log('Floor deletion successful');
      
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
 * マップの削除を処理する関数（改善版）
 * @param mapId 削除するマップのID
 * @param onSuccess 成功時のコールバック
 * @param onError エラー時のコールバック
 */
// マップ削除を処理する関数（改善版）
export const deleteMapWithRetry = async (
  mapId: string,
  onSuccess: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  // リトライ回数の設定
  const maxRetries = 3;
  let retryCount = 0;
  
  const deleteWithRetry = async (): Promise<void> => {
    console.log('deleteMapWithRetry', mapId);
    try {
      // map_idとIDのどちらが渡されたか確認する試み
      let urlPath = '';
      
      // IDが UUID形式かどうかをチェック（mapIdが実際のIDの場合）
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(mapId)) {
        // UUIDの形式ならIDとして扱う
        urlPath = `/api/maps/${mapId}`;
        console.log('Using direct ID for deletion:', mapId);
      } else {
        // それ以外はmap_idとして扱う - 別のエンドポイントを使用
        urlPath = `/api/maps/by-map-id/${mapId}`;
        console.log('Using map_id for deletion:', mapId);
      }
      
      // fetchよりもXMLHttpRequestを使用
      const xhr = new XMLHttpRequest();
      
      // Promiseでラップして同期的に扱えるようにする
      await new Promise<void>((resolve, reject) => {
        xhr.open('DELETE', urlPath, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        // キャッシュ関連のヘッダーを追加
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store');
        xhr.setRequestHeader('Pragma', 'no-cache');
        
        // CORSセットアップ
        xhr.withCredentials = true;
        
        // タイムアウト設定
        xhr.timeout = 20000; // 20秒
        
        // レスポンスハンドラ
        xhr.onload = function() {
          console.log(`Delete API response for map ${mapId}: status ${xhr.status}, response:`, xhr.responseText);
          
          // 成功判定を緩めに - 200番台だけでなく404も「すでに削除済み」と見なす
          if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 404) {
            console.log('Delete success or already deleted:', xhr.responseText);
            resolve();
          } else {
            // HTTPエラーの場合
            let errorMessage = 'マップの削除に失敗しました';
            try {
              const errorData = JSON.parse(xhr.responseText);
              if (errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (e) {
              // レスポンスのJSONパースに失敗した場合
              console.warn('Failed to parse error response:', e);
            }
            console.error(`Delete API error: ${errorMessage} (Status: ${xhr.status})`);
            reject(new Error(`${errorMessage} (Status: ${xhr.status})`));
          }
        };
        
        // エラーハンドラ
        xhr.onerror = function() {
          console.error('Network error during map delete');
          reject(new Error('ネットワークエラーが発生しました'));
        };
        
        // タイムアウトハンドラ
        xhr.ontimeout = function() {
          console.error('Delete request timed out');
          reject(new Error('リクエストがタイムアウトしました'));
        };
        
        // リクエスト送信
        xhr.send();
      });
      
      // 成功時のコールバック
      onSuccess();
      console.log('Map deletion successful');
      
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