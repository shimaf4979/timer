import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { Floor, MapData, Pin, PublicEditor } from '@/types/map-types';
import { useUIStore } from './store';
import { useEffect } from 'react';

// マップデータ取得
export function useMapData(mapId: string) {
  const { setError } = useUIStore();
  const result = useQuery({
    queryKey: ['map', mapId],
    queryFn: async (): Promise<MapData> => {
      const response = await fetch(`/api/maps/${mapId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'マップの取得に失敗しました');
      }
      return response.json();
    },
    enabled: !!mapId,
    staleTime: 60 * 1000, // 1分
    retry: 1,
  });

  useEffect(() => {
    if (result.error) {
      setError((result.error as Error).message);
    }
  }, [result.error, setError]);

  return result;
}

// フロア一覧取得
export function useFloors(mapId: string) {
  const { setError } = useUIStore();
  const result = useQuery({
    queryKey: ['floors', mapId],
    queryFn: async (): Promise<Floor[]> => {
      const response = await fetch(`/api/maps/${mapId}/floors`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'エリアの取得に失敗しました');
      }
      return response.json();
    },
    enabled: !!mapId,
    staleTime: 30 * 1000, // 30秒
  });

  useEffect(() => {
    if (result.error) {
      setError((result.error as Error).message);
    }
  }, [result.error, setError]);

  return result;
}

// フロア追加
export function useAddFloor(mapId: string) {
  const queryClient = useQueryClient();
  const { setError, addNotification } = useUIStore();

  return useMutation({
    mutationFn: async (newFloor: { floor_number: number; name: string }): Promise<Floor> => {
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

      return response.json();
    },
    onSuccess: (data) => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['floors', mapId] });
      addNotification({
        message: 'エリアを追加しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}

// フロア削除
export function useDeleteFloor(mapId: string) {
  const queryClient = useQueryClient();
  const { setError, addNotification } = useUIStore();

  return useMutation({
    mutationFn: async (floorId: string): Promise<void> => {
      const response = await fetch(`/api/floors/${floorId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'エリアの削除に失敗しました');
      }
    },
    onSuccess: () => {
      // 関連するキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['floors', mapId] });
      queryClient.invalidateQueries({ queryKey: ['pins'] });
      addNotification({
        message: 'エリアを削除しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}

// フロア画像アップロード
export function useUploadFloorImage(floorId: string, onProgress?: (progress: number) => void) {
  const queryClient = useQueryClient();
  const { setError, addNotification } = useUIStore();

  return useMutation({
    mutationFn: async (file: File): Promise<{ image_url: string }> => {
      const formData = new FormData();
      formData.append('image', file);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('レスポンスの解析に失敗しました'));
            }
          } else {
            let errorMessage = '画像アップロードに失敗しました';
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              if (errorResponse.error) {
                errorMessage = errorResponse.error;
              }
            } catch (e) {
              // エラーレスポンスのパースに失敗した場合
            }
            reject(new Error(errorMessage));
          }
        };

        xhr.onerror = function () {
          reject(new Error('ネットワークエラーが発生しました'));
        };

        xhr.open('POST', `/api/floors/${floorId}/image`, true);
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      // 画像アップロード完了後、フロア情報を更新
      queryClient.invalidateQueries({ queryKey: ['floors'] });

      // カスタムイベントを発火して画像の読み込みを通知
      window.dispatchEvent(
        new CustomEvent('imageLoaded', {
          detail: { src: data.image_url },
        })
      );

      addNotification({
        message: '画像をアップロードしました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}

// ピン一覧取得
export function usePins(floorIds: string[]) {
  const { setError } = useUIStore();
  const result = useQuery({
    queryKey: ['pins', floorIds],
    queryFn: async (): Promise<Pin[]> => {
      if (!floorIds.length) return [];

      // すべてのフロアのピンを並列で取得
      const requests = floorIds.map((floorId) =>
        fetch(`/api/floors/${floorId}/pins`).then((response) => {
          if (!response.ok) {
            throw new Error(`フロア ${floorId} のピン取得に失敗しました`);
          }
          return response.json();
        })
      );

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

      return pins;
    },
    enabled: floorIds.length > 0,
    staleTime: 30 * 1000, // 30秒
  });

  useEffect(() => {
    if (result.error) {
      setError((result.error as Error).message);
    }
  }, [result.error, setError]);

  return result;
}

// ピン追加
export function useAddPin() {
  const queryClient = useQueryClient();
  const { setError, addNotification } = useUIStore();

  return useMutation({
    mutationFn: async (newPin: {
      floor_id: string;
      title: string;
      description: string;
      x_position: number;
      y_position: number;
    }): Promise<Pin> => {
      const response = await fetch(`/api/floors/${newPin.floor_id}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPin),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ピンの追加に失敗しました');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // ピン一覧を更新
      queryClient.invalidateQueries({ queryKey: ['pins'] });
      addNotification({
        message: 'ピンを追加しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}

// ピン更新
export function useUpdatePin() {
  const queryClient = useQueryClient();
  const { setError, addNotification } = useUIStore();

  return useMutation({
    mutationFn: async (updatedPin: {
      id: string;
      title: string;
      description: string;
    }): Promise<Pin> => {
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

      return response.json();
    },
    onSuccess: (data) => {
      // ピン一覧を更新
      queryClient.invalidateQueries({ queryKey: ['pins'] });
      addNotification({
        message: 'ピンを更新しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}

// ピン削除
export function useDeletePin() {
  const queryClient = useQueryClient();
  const { setError, addNotification } = useUIStore();

  return useMutation({
    mutationFn: async (pinId: string): Promise<void> => {
      const response = await fetch(`/api/pins/${pinId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ピンの削除に失敗しました');
      }
    },
    onSuccess: () => {
      // ピン一覧を更新
      queryClient.invalidateQueries({ queryKey: ['pins'] });
      addNotification({
        message: 'ピンを削除しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}

// ビューア用APIフック - 全データ取得
export function useViewerData(mapId: string) {
  const { setError } = useUIStore();
  const result = useQuery({
    queryKey: ['viewer', mapId],
    queryFn: async () => {
      if (!mapId) throw new Error('マップIDが指定されていません');

      const response = await fetch(`/api/viewer/${mapId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'データの取得に失敗しました');
      }

      return response.json();
    },
    enabled: !!mapId,
    staleTime: 60 * 1000, // 1分
  });

  useEffect(() => {
    if (result.error) {
      setError((result.error as Error).message);
    }
  }, [result.error, setError]);

  return result;
}

// 公開編集者の登録/検証
export function usePublicEditor() {
  const { setError, addNotification } = useUIStore();

  // 公開編集者登録
  const registerMutation = useMutation({
    mutationFn: async ({
      mapId,
      nickname,
    }: {
      mapId: string;
      nickname: string;
    }): Promise<PublicEditor> => {
      const response = await fetch('/api/public-edit/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mapId, nickname }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '編集者登録に失敗しました');
      }

      const data = await response.json();

      return {
        id: data.editorId,
        map_id: mapId,
        nickname: data.nickname,
        token: data.token,
      };
    },
    onSuccess: (data) => {
      // ローカルストレージに保存
      try {
        localStorage.setItem(`public_edit_${data.map_id}`, JSON.stringify(data));
      } catch (error) {
        console.error('公開編集者情報の保存に失敗しました:', error);
      }

      addNotification({
        message: '編集者として登録しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // トークン検証
  const verifyMutation = useMutation({
    mutationFn: async ({ editorId, token }: { editorId: string; token: string }) => {
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
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    verify: verifyMutation.mutate,
    verifyAsync: verifyMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    isVerifying: verifyMutation.isPending,
    registerError: registerMutation.error,
    verifyError: verifyMutation.error,
  };
}

// 公開ピン追加/更新/削除
export function usePublicEditPins() {
  const queryClient = useQueryClient();
  const { setError, addNotification } = useUIStore();

  // ピン追加
  const addPinMutation = useMutation({
    mutationFn: async (params: {
      floorId: string;
      title: string;
      description: string;
      x_position: number;
      y_position: number;
      editorId: string;
      nickname: string;
    }) => {
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
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pins'] });
      queryClient.invalidateQueries({ queryKey: ['viewer'] });
      addNotification({
        message: 'ピンを追加しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // ピン更新
  const updatePinMutation = useMutation({
    mutationFn: async (params: {
      pinId: string;
      title: string;
      description: string;
      editorId: string;
    }) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pins'] });
      queryClient.invalidateQueries({ queryKey: ['viewer'] });
      addNotification({
        message: 'ピンを更新しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // ピン削除
  const deletePinMutation = useMutation({
    mutationFn: async (params: { pinId: string; editorId: string }) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pins'] });
      queryClient.invalidateQueries({ queryKey: ['viewer'] });
      addNotification({
        message: 'ピンを削除しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    addPin: addPinMutation.mutate,
    addPinAsync: addPinMutation.mutateAsync,
    updatePin: updatePinMutation.mutate,
    updatePinAsync: updatePinMutation.mutateAsync,
    deletePin: deletePinMutation.mutate,
    deletePinAsync: deletePinMutation.mutateAsync,
    isAddingPin: addPinMutation.isPending,
    isUpdatingPin: updatePinMutation.isPending,
    isDeletingPin: deletePinMutation.isPending,
  };
}
