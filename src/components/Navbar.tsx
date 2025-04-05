// components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/auth';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // ログインページとレジスターページではナビゲーションバーを表示しない
  const shouldHideNavbar = pathname === '/login' || pathname === '/register';
  
  // モバイルメニューが開いているときは背景スクロールを無効化
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);
  
  if (shouldHideNavbar) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                ぱんふりー
              </Link>
            </div>
            
            {/* デスクトップナビゲーション */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                ホーム
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link
                    href="/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/dashboard'
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    マイマップ
                  </Link>
                  
                  <Link
                    href="/account"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/account'
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    アカウント
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* 右側のアカウントメニュー */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex text-sm rounded-full focus:outline-none"
                >
                  <span className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    {user?.name || user?.email}
                    <svg
                      className="-mr-1 ml-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
                
                {/* ドロップダウンメニュー */}
                {isMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      アカウント設定
                    </Link>
                    
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin/users"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        ユーザー管理
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  ログイン
                </Link>
                
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 border-blue-600"
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>
          
          {/* モバイルメニューボタン */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">メニューを開く</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl z-50 overflow-y-auto">
            <div className="pt-5 pb-6 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <Link href="/" className="text-2xl font-bold text-blue-600">
                    ぱんふりー
                  </Link>
                </div>
                <div className="-mr-2">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                  >
                    <span className="sr-only">閉じる</span>
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mt-6">
                <nav className="grid gap-y-8">
                  <Link
                    href="/"
                    className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="ml-3 text-base font-medium text-gray-900">ホーム</span>
                  </Link>
                  
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="ml-3 text-base font-medium text-gray-900">マイマップ</span>
                      </Link>
                      
                      <Link
                        href="/account"
                        className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="ml-3 text-base font-medium text-gray-900">アカウント</span>
                      </Link>
                      
                      {user?.role === 'admin' && (
                        <Link
                          href="/admin/users"
                          className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="ml-3 text-base font-medium text-gray-900">ユーザー管理</span>
                        </Link>
                      )}
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          logout();
                        }}
                        className="w-full -m-3 p-3 flex items-center rounded-md hover:bg-gray-50 text-left"
                      >
                        <span className="ml-3 text-base font-medium text-gray-900">ログアウト</span>
                      </button>
                    </>
                  ) : (
                    <div className="pt-4 pb-3 border-t border-gray-200">
                      <div className="mt-3 space-y-3">
                        <Link
                          href="/login"
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          ログイン
                        </Link>
                        
                        <Link
                          href="/register"
                          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          新規登録
                        </Link>
                      </div>
                    </div>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}