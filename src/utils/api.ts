// utils/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // ローカルストレージからトークンを取得
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // トークンがある場合は認証ヘッダーを追加
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
  
  // レスポンスが401（認証エラー）の場合はログアウト
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
  
  return response;
}

// API呼び出し用のラッパー関数群
export const api = {
  // 認証関連
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },
  
  register: async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  },
  
  // マップ関連
  getMaps: async () => {
    const response = await fetchWithAuth('/maps');
    return response.json();
  },
  
  getMap: async (mapId: string) => {
    const response = await fetchWithAuth(`/maps/${mapId}`);
    return response.json();
  },
  
  createMap: async (data: any) => {
    const response = await fetchWithAuth('/maps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  updateMap: async (mapId: string, data: any) => {
    const response = await fetchWithAuth(`/maps/${mapId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  deleteMap: async (mapId: string) => {
    const response = await fetchWithAuth(`/maps/${mapId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
  
  // フロア関連
  getFloors: async (mapId: string) => {
    const response = await fetchWithAuth(`/maps/${mapId}/floors`);
    return response.json();
  },
  
  createFloor: async (mapId: string, data: any) => {
    const response = await fetchWithAuth(`/maps/${mapId}/floors`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  updateFloor: async (floorId: string, data: any) => {
    const response = await fetchWithAuth(`/floors/${floorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  deleteFloor: async (floorId: string) => {
    const response = await fetchWithAuth(`/floors/${floorId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
  
  // ピン関連
  getPins: async (floorId: string) => {
    const response = await fetchWithAuth(`/floors/${floorId}/pins`);
    return response.json();
  },
  
  createPin: async (floorId: string, data: any) => {
    const response = await fetchWithAuth(`/floors/${floorId}/pins`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  updatePin: async (pinId: string, data: any) => {
    const response = await fetchWithAuth(`/pins/${pinId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  deletePin: async (pinId: string) => {
    const response = await fetchWithAuth(`/pins/${pinId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
  
  // 閲覧者向けAPI
  getViewerData: async (mapId: string) => {
    const response = await fetch(`${API_URL}/viewer/${mapId}`);
    return response.json();
  },
  
  // 公開編集関連
  registerPublicEditor: async (mapId: string, nickname: string) => {
    const response = await fetch(`${API_URL}/public-edit/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapId, nickname }),
    });
    return response.json();
  },
  
  verifyPublicEditor: async (editorId: string, token: string) => {
    const response = await fetch(`${API_URL}/public-edit/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editorId, token }),
    });
    return response.json();
  },
};