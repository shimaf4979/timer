// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// クライアントサイドのみで使用される公開クライアント
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// サーバーサイドでのみ使用される管理者権限クライアント
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 型定義
export type UserDB = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

export type MapDB = {
  id: string;
  map_id: string;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type FloorDB = {
  id: string;
  map_id: string;
  floor_number: number;
  name: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PinDB = {
  id: string;
  floor_id: string;
  title: string;
  description: string;
  x_position: number;
  y_position: number;
  created_at: string;
  updated_at: string;
};