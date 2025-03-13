
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
  title: "Pamfree",
  description:
    "地図やフロアプランをインタラクティブに変える電子パンフレット。",
    icons: {
      icon: "/logo.svg",
    },
  openGraph: {
    title: "Pamfree",
    description:
      "地図やフロアプランをインタラクティブに変える電子パンフレット。",
    type: "website",
    url: "https://pamfree.com/", // 実際のURLに変更
    images: [
      {
        url: "https://pamfree.com/pamfree.png", // 絶対URLに変更
        width: 80,
        height: 80,
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

