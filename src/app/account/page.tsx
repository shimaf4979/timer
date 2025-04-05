// app/account/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth';
import Loading from '@/components/Loading';

export default function AccountPage() {
  const { user, isAuthenticated, loading, updateProfile, changePassword } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  
  // ユーザー情報の読み込み
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    
    if (user) {
      setName(user.name || '');
    }
  }, [user, isAuthenticated, loading, router]);
  
  // プロフィール更新処理
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setIsProfileUpdating(true);
    
    try {
      await updateProfile(name);
      setProfileMessage('プロフィールを更新しました');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsProfileUpdating(false);
    }
  };
  
  // パスワード変更処理
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    
    // 新しいパスワードの検証
    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードが一致しません');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('パスワードは8文字以上にしてください');
      return;
    }
    
    setIsPasswordChanging(true);
    
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage('パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'パスワードの変更に失敗しました');
    } finally {
      setIsPasswordChanging(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="読み込み中..." />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">アカウント設定</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* プロフィール情報 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">プロフィール情報</h2>
          
          {profileMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {profileMessage}
            </div>
          )}
          
          {profileError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {profileError}
            </div>
          )}
          
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={user?.email || ''}
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">メールアドレスは変更できません</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                名前
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="名前を入力"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isProfileUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isProfileUpdating ? '更新中...' : '更新する'}
              </button>
            </div>
          </form>
        </div>
        
        {/* パスワード変更 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">パスワード変更</h2>
          
          {passwordMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {passwordMessage}
            </div>
          )}
          
          {passwordError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {passwordError}
            </div>
          )}
          
          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                現在のパスワード
              </label>
              <input
                type="password"
                id="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="現在のパスワード"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                新しいパスワード
              </label>
              <input
                type="password"
                id="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="新しいパスワード（8文字以上）"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                新しいパスワード（確認）
              </label>
              <input
                type="password"
                id="confirm-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="新しいパスワード（確認）"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPasswordChanging}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isPasswordChanging ? '変更中...' : 'パスワードを変更'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}