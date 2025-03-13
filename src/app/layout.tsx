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
  metadataBase: new URL('https://pamfree.com'),
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
        url: 'https://pamfree.com/pamfree.png', // 相対パスに変更
        width: 1200,
        height: 630,
        alt: 'PamfreeのOGP画像',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pamfree - 地図やフロアプランをインタラクティブに変える電子パンフレット。',
    description: '地図やフロアプランをインタラクティブに変える電子パンフレット。',
    images: ['https://pamfree.com/pamfree.png'], // 相対パスに変更
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <meta property="og:image" content="https://pamfree.com/pamfree.png" />
        <meta name="twitter:image" content="https://pamfree.com/pamfree.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <NavigationBar /> 
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}