// hooks/auth.ts
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { AuthAPI } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 初期化時にローカルストレージからトークンを取得
  useEffect(() => {
    const initAuth = async () => {
      try {
        // ローカルストレージからトークンを取得
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);

        // トークンでユーザー情報を取得
        const userData = await AuthAPI.getMe(storedToken);
        setUser(userData.user);
      } catch (err) {
        console.error('認証初期化エラー:', err);
        // エラー時はローカルストレージをクリア
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ログイン処理
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await AuthAPI.login(email, password);
      
      // ユーザー情報とトークンをセット
      setUser(data.user);
      setToken(data.token);
      
      // ダッシュボードへリダイレクト
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 新規登録処理
  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);

    try {
      await AuthAPI.register(email, password, name);
      
      // 登録成功後、ログインページへリダイレクト
      router.push('/login?registered=true');
    } catch (err) {
      const message = err instanceof Error ? err.message : '新規登録に失敗しました';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ログアウト処理
  const logout = () => {
    // ローカルストレージからトークンを削除
    localStorage.removeItem('authToken');
    
    // 状態をリセット
    setUser(null);
    setToken(null);
    
    // ログインページへリダイレクト
    router.push('/login');
  };

  // プロフィール更新
  const updateProfile = async (name: string) => {
    if (!token) {
      setError('認証が必要です');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await AuthAPI.updateProfile(name, token);
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'プロフィールの更新に失敗しました';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // パスワード変更
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) {
      setError('認証が必要です');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await AuthAPI.changePassword(currentPassword, newPassword, token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'パスワードの変更に失敗しました';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}