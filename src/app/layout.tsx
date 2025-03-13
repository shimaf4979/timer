
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


// export const metadata: Metadata = {
//   title: "Pamfree",
//   description:
//     "地図やフロアプランをインタラクティブに変える電子パンフレット。",
//   icons: {
//     icon: "/logo.svg",
//   },
//   openGraph: {
//     title: "Pamfree",
//     description:
//       "地図やフロアプランをインタラクティブに変える電子パンフレット。",
//     type: "website",
//     url: "https://pamfree.com/", // 実際のURLに変更
//     images: [
//       {
//         url: "https://pamfree.com/pamfree.png", // 絶対URLに変更
//       },
//     ],
//   },
// };

// export const metadata: Metadata = {
//   title: "Pamfree",
//   description: "地図やフロアプランをインタラクティブに変える電子パンフレット。",
//   icons: {
//     icon: "/logo.svg",
//   },
//   openGraph: {
//     title: "Pamfree",
//     description: "地図やフロアプランをインタラクティブに変える電子パンフレット。",
//     type: "website",
//     url: "https://pamfree.com/",
//     images: [
//       {
//         url: "https://pamfree.com/logo.svg",
//       },
//     ],
//   },
//   twitter: {
//     card: "summary_large_image", // 画像付きカードを表示
//     title: "Pamfree",
//     description: "地図やフロアプランをインタラクティブに変える電子パンフレット。",
//     site: "@nitech_citizen", // Twitter アカウント
//     creator: "@nitech_citizen", // 作成者の Twitter アカウント
//     images: ["https://pamfree.com/pamfree.png"],
//   },
// };


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
        url: 'https://pamfree.com/pamfree.png', // 固定のOGP画像URLを指定
        alt: 'PamfreeのOGP画像',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pamfree - 地図やフロアプランをインタラクティブに変える電子パンフレット。',
    description: '地図やフロアプランをインタラクティブに変える電子パンフレット。',
    images: ['https://pamfree.com/pamfree.png'], // 固定のOGP画像URLを指定
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
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://pamfree.com/pamfree.png" />
        <meta name="twitter:description" content="地図やフロアプランをインタラクティブに変える電子パンフレット。" />
        <meta name="twitter:title" content="Pamfree - 地図やフロアプランをインタラクティブに変える電子パンフレット。" />
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

