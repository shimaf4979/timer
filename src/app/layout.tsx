import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react";
import NavigationBar from "@/components/NavigationBar";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})


export const metadata: Metadata = {
  title: {
    template: '%s | Pamfree',
    default: 'Pamfree - 地図やフロアプランをインタラクティブに変える電子パンフレット。',
  },
  description: '地図やフロアプランをインタラクティブに変える電子パンフレット。',
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://pamfree.com/',
    title: 'Pamfree - 地図やフロアプランをインタラクティブに変える電子パンフレット。',
    description: '地図やフロアプランをインタラクティブに変える電子パンフレット。',
    siteName: 'Pamfree',
    images: [
      {
        url: 'https://timer-git-main-yudaishimamuras-projects.vercel.app/pamfree.png', // 相対パスに変更
        alt: 'PamfreeのOGP画像',
      },
    ],
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <NavigationBar /> 
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}