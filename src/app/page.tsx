"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { ChevronRight, Map, PenLine, Eye, Layers, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"

// アニメーション付きのセクションタイトルコンポーネント
const AnimatedSectionTitle = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" })

  return (
    <motion.h2
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4"
    >
      {children}
    </motion.h2>
  )
}

// アニメーション付きのセクション説明コンポーネント
const AnimatedSectionDescription = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" })

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      className="max-w-[42rem] text-lg text-slate-600"
    >
      {children}
    </motion.p>
  )
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("create")
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const tabs = ["create", "edit", "view"]

  // タブコンテンツのアニメーション用ref
  const tabContentRef = useRef(null)
  const isTabContentInView = useInView(tabContentRef, { once: true, margin: "-100px 0px" })

  // 活用事例セクションのアニメーション用ref
  const casesRef = useRef(null)
  const isCasesInView = useInView(casesRef, { once: true, margin: "-100px 0px" })

  // CTAセクションのアニメーション用ref
  const ctaRef = useRef(null)
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-100px 0px" })

  // タブを次に進める関数
  const goToNextTab = () => {
    const currentIndex = tabs.indexOf(activeTab)
    const nextIndex = (currentIndex + 1) % tabs.length
    setActiveTab(tabs[nextIndex])
  }

  // タブを前に戻す関数
  const goToPrevTab = () => {
    const currentIndex = tabs.indexOf(activeTab)
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length
    setActiveTab(tabs[prevIndex])
  }

  // タイマーをリセットする関数
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      goToNextTab()
    }, 5000) // 5秒ごとに次のタブに移動
  }

  // タブが変更されたときにタイマーをリセット
  useEffect(() => {
    resetTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [activeTab])

  // コンポーネントがマウントされたときにタイマーを開始
  useEffect(() => {
    resetTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* <div className="absolute inset-0 -z-10 bg-[url('/placeholder.svg?height=200&width=200')] bg-center [mask-image:radial-gradient(white,transparent_85%)] opacity-10"></div> */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-50/30 to-white/10 bg-center [mask-image:radial-gradient(white,transparent_85%)] opacity-20"></div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 max-w-3xl"
            >
              あなたの<span className="text-sky-600">地図</span>をもっと
              <br/>
              <span className="text-sky-600">インタラクティブ</span>に
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-[42rem] text-lg text-slate-600 md:text-xl"
            >
              既存の地図やフロアプランを活かしながら、インタラクティブな電子パンフレットに変換。
              訪問者に最高の体験を提供しましょう。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mt-4"
            >
           <Link href="/login">
                <Button size="lg" className="gap-2 bg-sky-600 hover:bg-sky-700 cursor-pointer">
                  無料でお試し <ChevronRight className="h-4 w-4" />
                </Button>
           </Link>
              <Link href="https://www.pamfree.com/public-edit?id=meikoudai_free">
              <Button size="lg" variant="outline" className="gap-2 border-sky-300 text-sky-700 hover:bg-sky-50 cursor-pointer">
                デモを見る <Eye className="h-4 w-4" />
              </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-sky-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-12">
            <AnimatedSectionTitle>3ステップで簡単に作成</AnimatedSectionTitle>
            <AnimatedSectionDescription>
              既存の地図を活用して、誰でも簡単にインタラクティブなマップを作成できます
            </AnimatedSectionDescription>
          </div>

          <Tabs value={activeTab} className="w-full max-w-5xl mx-auto" onValueChange={setActiveTab}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="mb-8 overflow-hidden rounded-lg"
            >
              <div className="grid grid-cols-3 bg-sky-100">
                {tabs.map((tab, index) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      flex items-center justify-center text-center h-12 px-2 transition-colors cursor-pointer
                      ${activeTab === tab ? "bg-sky-600 text-white" : "bg-sky-100 text-slate-700 hover:bg-sky-200"}
                    `}
                  >
                    <span className="text-sm md:text-base">
                      {index === 0 && "1. 地図をアップロード"}
                      {index === 1 && "2. 情報を追加"}
                      {index === 2 && "3. 閲覧者に公開"}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              ref={tabContentRef}
              initial={{ opacity: 0, y: 50 }}
              animate={isTabContentInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              className="relative rounded-xl overflow-hidden border border-sky-200 bg-white p-1 md:p-2"
            >
              <TabsContent value="create" className="mt-0 p-3">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 relative h-[300px] md:h-[400px] rounded-lg overflow-hidden bg-sky-50">
                    <Image
                      src="/ssss.jpeg"
                      alt="元の地図"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="w-full md:w-1/2 space-y-4 text-left">
                    <h3 className="text-2xl font-bold text-sky-800">元の地図をアップロード</h3>
                    <p className="text-slate-600">
                      すでにお持ちの地図やフロアプランをアップロードするだけ。
                      紙の地図をスキャンしたものでも、デジタルイラストでも対応可能です。
                    </p>
                    <ul className="space-y-2">
                      {[
                        "商業施設のフロアマップ",
                        "観光地のガイドマップ",
                        "イベント会場の案内図",
                        "オフィスビルの案内図",
                        "キャンパスマップ",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center">
                            <ChevronRight className="h-3 w-3 text-sky-600" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-0 p-3">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 relative h-[300px] md:h-[400px] rounded-lg overflow-hidden bg-sky-50">
                    <Image
                      src="/ffff.jpeg"
                      alt="編集画面"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="w-full md:w-1/2 space-y-4 text-left">
                    <h3 className="text-2xl font-bold text-sky-800">簡単に情報を追加・編集</h3>
                    <p className="text-slate-600">
                      直感的な管理画面で、地図上の各ポイントに情報を追加できます。
                      テキスト、画像、リンクなどを自由に設定し、いつでも更新可能です。
                    </p>
                    <ul className="space-y-2">
                      {[
                        "ドラッグ＆ドロップでポイントを追加",
                        "各ポイントに詳細情報を設定",
                        "複数のエリアやフロアを管理",
                        "リアルタイムでプレビュー確認",
                        "チームでの共同編集が可能",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center">
                            <ChevronRight className="h-3 w-3 text-sky-600" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="view" className="mt-0 p-3">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2 relative h-[300px] md:h-[400px] rounded-lg overflow-hidden bg-sky-50">
                    <Image
                      src="/ddd.jpeg"
                      alt="外部に公開する"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="w-full md:w-1/2 space-y-4 text-left">
                    <h3 className="text-2xl font-bold text-sky-800">訪問者に最適な閲覧体験</h3>
                    <p className="text-slate-600">
                      訪問者はシンプルで直感的なインターフェースで地図を閲覧できます。
                      各ポイントをクリックすると詳細情報が表示され、目的地を簡単に見つけられます。
                    </p>
                    <ul className="space-y-2">
                      {[
                        "シンプルで使いやすいインターフェース",
                        "各ポイントの詳細情報をワンクリックで表示",
                        "3D表示モードで立体的に確認可能",
                        "スマートフォンやタブレットに最適化",
                        "QRコードで簡単にアクセス",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center">
                            <ChevronRight className="h-3 w-3 text-sky-600" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevTab}
                  className="rounded-full text-sky-600 hover:bg-sky-50"
                  disabled={activeTab === "create"}
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextTab}
                  className="rounded-full text-sky-600 hover:bg-sky-50"
                  disabled={activeTab === "view"}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </Tabs>
        </div>
      </section>

      {/* 活用事例セクション */}
      <section className="py-16 md:py-24 bg-sky-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-12">
            <AnimatedSectionTitle>様々な場面で活用できます</AnimatedSectionTitle>
            <AnimatedSectionDescription>
              インタラクティブマップは多くの場面で訪問者の体験を向上させます
            </AnimatedSectionDescription>
          </div>

          <div ref={casesRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "商業施設",
                description:
                  "ショッピングモールやデパートのフロアガイドとして活用。来店客が目的の店舗を簡単に見つけられます。",
                icon: <Map className="h-10 w-10 text-sky-600" />,
              },
              {
                title: "観光スポット",
                description: "観光地や公園の案内図として。見どころや施設の情報を詳しく紹介できます。",
                icon: <Eye className="h-10 w-10 text-sky-600" />,
              },
              {
                title: "イベント会場",
                description: "展示会や見本市の会場マップとして。ブースの位置や出展者情報を簡単に確認できます。",
                icon: <Layers className="h-10 w-10 text-sky-600" />,
              },
      
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                animate={isCasesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 * i }}
              >
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-sky-100">{item.icon}</div>
                    <h3 className="text-xl font-bold text-sky-800">{item.title}</h3>
                    <p className="text-slate-600">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-sky-50 to-white">
        <div className="container mx-auto px-4 md:px-6">
          <div ref={ctaRef} className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900"
            >
              あなたの地図をインタラクティブに変えませんか？
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="text-lg text-slate-600"
            >
              簡単な操作で、既存の地図を魅力的なインタラクティブマップに変換できます。
              無料トライアルで、その効果をぜひ体験してください。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 mt-4"
            >
              <Link href="/login">
              <Button size="lg" className="gap-2 bg-sky-600 hover:bg-sky-700 cursor-pointer">
                今すぐ始める <ArrowRight className="h-4 w-4" />
              </Button>
              </Link>
              <Link href="https://www.pamfree.com/public-edit?id=meikoudai_free">
              <Button size="lg" variant="outline" className="gap-2 border-sky-300 text-sky-700 hover:bg-sky-50 cursor-pointer">
                デモを見る
              </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* フッター（簡素化） */}
      <footer className="py-8 bg-sky-900 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p> ぱんふりー. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}


