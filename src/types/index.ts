// types/index.ts
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    created_at?: string;
  }
  
  export interface MapData {
    id: string;
    map_id: string;
    title: string;
    description: string;
    user_id?: string;
    is_publicly_editable?: boolean;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface Floor {
    id: string;
    map_id: string;
    floor_number: number;
    name: string;
    image_url: string | null;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface Pin {
    id: string;
    floor_id: string;
    title: string;
    description: string;
    x_position: number;
    y_position: number;
    image_url?: string | null;
    editor_id?: string;
    editor_nickname?: string;
    created_at?: string;
    updated_at?: string;
    _temp?: boolean; // UI用一時的なフラグ
  }
  
  export interface PublicEditor {
    id: string;
    map_id: string;
    nickname: string;
    token: string;
    created_at?: string;
    last_active?: string;
  }
  
  export interface CloudinaryUploadResult {
    url: string;
    public_id: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    created_at: string;
  }
  
  export interface ViewerMapData {
    map: MapData;
    floors: Floor[];
    pins: Pin[];
  }
  
  export interface ApiResponse<T> {
    loading: boolean;
    data: T | null;
    error: string | null;
  }
  
  export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
  }