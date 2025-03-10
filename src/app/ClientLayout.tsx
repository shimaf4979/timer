"use client"
import { SessionProvider } from "next-auth/react"
import type React from "react"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

function NavigationBar() {
  const { data: session } = useSession()

  return (
    <header className="bg-sky-900 text-white py-4">
      <div className="container px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          電子パンフレットアプリ
        </Link>
        <nav>
          <ul className="flex items-center space-x-4">
            <li>
              <Link href="/" className="hover:text-sky-200 transition-colors">
                ホーム
              </Link>
            </li>
            {session?.user ? (
              <>
                <li>
                  <Link href="/dashboard" className="hover:text-sky-200 transition-colors">
                    ダッシュボード
                  </Link>
                </li>
                <li>
                  <button onClick={() => signOut()} className="hover:text-sky-200 transition-colors">
                    ログアウト
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className="hover:text-sky-200 transition-colors">
                    ログイン
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-sky-200 transition-colors">
                    登録
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Providers>
      <NavigationBar />
      {children}
    </Providers>
  )
}

function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

