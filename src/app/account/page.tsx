'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store';
import { useMutation } from '@tanstack/react-query';

// プロフィール更新フック
const useUpdateProfile = () => {
  const { update } = useSession();
  const { setError, addNotification } = useUIStore();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/account/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'プロフィールの更新に失敗しました');
      }

      return data;
    },
    onSuccess: async (_, variables) => {
      // セッション情報を更新
      await update({ name: variables });

      addNotification({
        message: 'プロフィールを更新しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

// パスワード変更フック
const useChangePassword = () => {
  const { setError, addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワードの変更に失敗しました');
      }

      return data;
    },
    onSuccess: () => {
      addNotification({
        message: 'パスワードを変更しました',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
};

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error } = useUIStore();

  // TanStack Query フック
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  // ローカル状態
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    // 未認証ユーザーはログインページへリダイレクト
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // セッションからユーザー名を設定
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session, status, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfileMutation.mutateAsync(name);
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (newPassword !== confirmPassword) {
      setValidationError('新しいパスワードが一致しません');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      // 成功したらフォームをリセット
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('パスワード変更エラー:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">アカウント設定</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* プロフィール情報 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">プロフィール情報</h2>

          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={session?.user?.email || ''}
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
                disabled={updateProfileMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {updateProfileMutation.isPending ? '更新中...' : '更新する'}
              </button>
            </div>
          </form>
        </div>

        {/* パスワード変更 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">パスワード変更</h2>

          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label
                htmlFor="current-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                新しいパスワード
              </label>
              <input
                type="password"
                id="new-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="新しいパスワード"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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

            {validationError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                {validationError}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {changePasswordMutation.isPending ? '変更中...' : 'パスワードを変更'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
