
// utils/publicEditHelpers.ts を作成
/**
 * 公開編集用のセッション管理ヘルパー
 */
import { PublicEditor } from '@/types/map-types';

// ローカルストレージのキープレフィックス
const STORAGE_PREFIX = 'public_edit_';

/**
 * 公開編集者情報をローカルストレージに保存
 */
export const saveEditorToStorage = (mapId: string, editor: PublicEditor): void => {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${mapId}`,
      JSON.stringify(editor)
    );
  } catch (error) {
    console.error('公開編集者情報の保存に失敗しました:', error);
  }
};

/**
 * ローカルストレージから公開編集者情報を取得
 */
export const getEditorFromStorage = (mapId: string): PublicEditor | null => {
  try {
    const editorData = localStorage.getItem(`${STORAGE_PREFIX}${mapId}`);
    return editorData ? JSON.parse(editorData) : null;
  } catch (error) {
    console.error('公開編集者情報の取得に失敗しました:', error);
    return null;
  }
};

/**
 * 公開編集者情報をローカルストレージから削除
 */
export const removeEditorFromStorage = (mapId: string): void => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${mapId}`);
  } catch (error) {
    console.error('公開編集者情報の削除に失敗しました:', error);
  }
};

/**
 * 公開編集者情報が有効かサーバーで検証
 */
export const verifyEditorToken = async (
  editorId: string,
  token: string
): Promise<{ verified: boolean; editorInfo?: PublicEditor }> => {
  try {
    const response = await fetch('/api/public-edit/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ editorId, token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'トークンの検証に失敗しました');
    }

    return {
      verified: data.verified,
      editorInfo: data.verified
        ? {
            id: data.editorId,
            map_id: data.mapId,
            nickname: data.nickname,
            token,
          }
        : undefined,
    };
  } catch (error) {
    console.error('トークン検証エラー:', error);
    return { verified: false };
  }
};

/**
 * 新規公開編集者の登録
 */
export const registerPublicEditor = async (
  mapId: string,
  nickname: string
): Promise<PublicEditor | null> => {
  try {
    const response = await fetch('/api/public-edit/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mapId, nickname }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '編集者登録に失敗しました');
    }

    const editorInfo: PublicEditor = {
      id: data.editorId,
      map_id: mapId,
      nickname: data.nickname,
      token: data.token,
    };

    // ローカルストレージに保存
    saveEditorToStorage(mapId, editorInfo);

    return editorInfo;
  } catch (error) {
    console.error('編集者登録エラー:', error);
    return null;
  }
};

/**
 * 公開編集用のピン追加
 */
export const addPublicPin = async (
  params: {
    floorId: string;
    title: string;
    description: string;
    x_position: number;
    y_position: number;
    editorId: string;
    nickname: string;
  }
): Promise<{ success: boolean; pin?: any; error?: string }> => {
  try {
    const response = await fetch('/api/public-edit/pins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'ピンの追加に失敗しました');
    }

    return { success: true, pin: data };
  } catch (error) {
    console.error('公開ピン追加エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ピンの追加に失敗しました',
    };
  }
};

/**
 * 公開編集用のピン更新
 */
export const updatePublicPin = async (
  params: {
    pinId: string;
    title: string;
    description: string;
    editorId: string;
  }
): Promise<{ success: boolean; pin?: any; error?: string }> => {
  try {
    const response = await fetch(`/api/public-edit/pins/${params.pinId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'ピンの更新に失敗しました');
    }

    return { success: true, pin: data };
  } catch (error) {
    console.error('公開ピン更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ピンの更新に失敗しました',
    };
  }
};

/**
 * 公開編集用のピン削除
 */
export const deletePublicPin = async (
  params: {
    pinId: string;
    editorId: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(
      `/api/public-edit/pins/${params.pinId}?editorId=${params.editorId}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'ピンの削除に失敗しました');
    }

    return { success: true };
  } catch (error) {
    console.error('公開ピン削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ピンの削除に失敗しました',
    };
  }
};