// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const isAuthPage = 
    request.nextUrl.pathname === '/login' || 
    request.nextUrl.pathname === '/register';
  
  // 認証が必要なページ
  const protectedPaths = [
    '/dashboard',
    '/account',
    '/maps',
    '/admin'
  ];
  
  // パスが保護されたパスのいずれかで始まるか確認
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // 未認証でログインが必要なページにアクセスした場合
  if (isProtectedPath && !authToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // 認証済みでログインページにアクセスした場合
  if (isAuthPage && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/account/:path*',
    '/maps/:path*',
    '/admin/:path*',
    '/login',
    '/register'
  ],
};