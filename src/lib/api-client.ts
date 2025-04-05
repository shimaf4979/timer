// lib/api-client.ts
import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pamfree.com/api';

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOptions } = options;
  
  const headers = new Headers(fetchOptions.headers);
  
  if (!headers.has('Content-Type') && !fetchOptions.body?.toString().includes('FormData')) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers
  });
  
  // 認証エラーの場合
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      redirect('/login');
    }
    throw new Error('認証が必要です');
  }
  
  // その他のエラー
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `APIエラー (${response.status})`
    }));
    throw new Error(error.error || 'APIリクエストに失敗しました');
  }
  
  // 成功レスポンス
  return await response.json();
}

// 認証関連
export const AuthAPI = {
  login: async (email: string, password: string) => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // トークンをローカルストレージに保存
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
    }
    
    return data;
  },
  
  register: async (email: string, password: string, name: string) => {
    return await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
  },
  
  getMe: async (token: string) => {
    return await fetchAPI('/auth/me', { token });
  },
  
  updateProfile: async (name: string, token: string) => {
    return await fetchAPI('/account/update-profile', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
      token
    });
  },
  
  changePassword: async (currentPassword: string, newPassword: string, token: string) => {
    return await fetchAPI('/account/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
      token
    });
  }
};

// マップ関連
export const MapAPI = {
  getMaps: async (token: string) => {
    console.log("token", token);
    return await fetchAPI('/maps', { token }) || [];
  },
  
  getMap: async (mapId: string, token?: string) => {
    if (token) {
      console.log("mapId", mapId);
      return await fetchAPI(`/maps/${mapId}`, { token }) || [];
    }
    // 閲覧用はトークン不要
    return await fetchAPI(`/maps/by-map-id/${mapId}`) || [];
  },
  
  createMap: async (data: {
    map_id: string;
    title: string;
    description?: string;
    is_publicly_editable?: boolean;
  }, token: string) => {
    return await fetchAPI('/maps', {
      method: 'POST',
      body: JSON.stringify(data),
      token
    });
  },
  
  updateMap: async (mapId: string, data: {
    title?: string;
    description?: string;
    is_publicly_editable?: boolean;
  }, token: string) => {
    return await fetchAPI(`/maps/${mapId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token
    });
  },
  
  deleteMap: async (mapId: string, token: string) => {
    return await fetchAPI(`/maps/${mapId}`, {
      method: 'DELETE',
      token
    });
  }
};

// フロア関連
export const FloorAPI = {
  getFloors: async (mapId: string) => {
    console.log("mapId", mapId);
    return await fetchAPI(`/maps/${mapId}/floors`) || [];
  },
  
  createFloor: async (mapId: string, data: {
    floor_number: number;
    name: string;
  }, token: string) => {
    console.log("createFloor", mapId, data);
    return await fetchAPI(`/maps/${mapId}/floors`, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    });
  },
  
  updateFloor: async (floorId: string, data: {
    name?: string;
    image_url?: string;
  }, token: string) => {
    return await fetchAPI(`/floors/${floorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token
    });
  },
  
  deleteFloor: async (floorId: string, token: string) => {
    return await fetchAPI(`/floors/${floorId}`, {
      method: 'DELETE',
      token
    });
  }
};

// ピン関連
export const PinAPI = {
  getPins: async (floorId: string) => {
    return await fetchAPI(`/floors/${floorId}/pins`) || [];
  },
  
  createPin: async (floorId: string, data: {
    title: string;
    description?: string;
    x_position: number;
    y_position: number;
    image_url?: string;
  }, token: string) => {
    return await fetchAPI(`/floors/${floorId}/pins`, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    });
  },
  
  updatePin: async (pinId: string, data: {
    title?: string;
    description?: string;
    image_url?: string;
  }, token: string) => {
    return await fetchAPI(`/pins/${pinId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token
    });
  },
  
  deletePin: async (pinId: string, token: string) => {
    return await fetchAPI(`/pins/${pinId}`, {
      method: 'DELETE',
      token
    });
  }
};

// 閲覧者向けAPI
export const ViewerAPI = {
  getMapData: async (mapId: string) => {
    return await fetchAPI(`/viewer/${mapId}`) || [];
  }
};

// 公開編集関連
export const PublicEditAPI = {
  registerEditor: async (mapId: string, nickname: string) => {
    return await fetchAPI('/public-edit/register', {
      method: 'POST',
      body: JSON.stringify({ mapId, nickname })
    });
  },
  
  verifyEditor: async (editorId: string, token: string) => {
    return await fetchAPI('/public-edit/verify', {
      method: 'POST',
      body: JSON.stringify({ editorId, token })
    });
  },
  
  createPin: async (data: {
    floorId: string;
    title: string;
    description: string;
    x_position: number;
    y_position: number;
    editorId: string;
    editorNickname: string;
    image_url?: string;
  }) => {
    return await fetchAPI('/public-edit/pins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  updatePin: async (pinId: string, data: {
    title: string;
    description: string;
    editorId: string;
  }) => {
    return await fetchAPI(`/public-edit/pins/${pinId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  
  deletePin: async (pinId: string, editorId: string) => {
    return await fetchAPI(`/public-edit/pins/${pinId}?editorId=${editorId}`, {
      method: 'DELETE'
    });
  }
};

// Cloudinary関連
export const CloudinaryAPI = {
  uploadImage: async (file: File, folder: string = 'map_images', token: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    
    return await fetchAPI('/cloudinary/upload', {
      method: 'POST',
      body: formData,
      token
    });
  },
  
  deleteImage: async (publicId: string, token: string) => {
    return await fetchAPI('/cloudinary/delete', {
      method: 'POST',
      body: JSON.stringify({ publicId }),
      token
    });
  }
};