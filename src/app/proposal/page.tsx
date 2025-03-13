"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ChevronRight,
  Map,
  Navigation,
  Compass,
  Building2,
  Users,
  Lightbulb,
  Target,
  PenToolIcon as Tool,
  Check,
} from "lucide-react"

export default function Proposal() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container px-4 md:px-6 py-12 md:py-20 max-w-4xl mx-auto">
        {/* ヘッダーセクション */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block rounded-full bg-sky-100 p-3 text-sky-600 mb-4"
          >
            <Navigation className="h-6 w-6" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4"
          >
            屋内における方向推定を可能にする3Dパンフレット
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl"
          >
            企画提案書
          </motion.p>
        </div>

        {/* メインコンテンツ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-12"
        >
          {/* 制作背景セクション */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 flex items-center gap-2">
              <Lightbulb className="h-6 w-6" />
              制作背景
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">1. 屋内での方向認識の課題</h3>
              <p className="mb-4">
                多くの施設では案内図が設置されているものの、ユーザーは自分の現在地や向いている方向を直感的に把握するのが難しい状況です。
                特に、複数のフロアが存在する建物や、広大なイベント会場では、平面のマップだけでは十分なナビゲーションができず、
                迷いやすいという課題があります。
              </p>
              <div className="bg-sky-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-sky-900 mb-2">具体的な課題例：</h4>
                <ul className="list-none space-y-2">
                  {[
                    "ショッピングモール：エレベーターやエスカレーターの位置が分からず、目的の店舗へ行くのに時間がかかる",
                    "イベント会場：広大な展示会場で、自分がどのブースにいるのか、次にどこへ向かえばよいのか分からない",
                    "病院や大学キャンパス：似たような構造の建物が多く、目的地までの正しいルートを把握するのが困難",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-4">2. 屋内ナビゲーション技術の進展</h3>
              <p className="mb-4">
                屋外ではGPSを活用したナビゲーションが一般的になっていますが、GPSは建物内では精度が低下するため、
                従来の方法では屋内での方向推定が困難でした。しかし、最近では以下の技術により、
                屋内でも高精度なナビゲーションが可能になりつつあります。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  {
                    icon: <Compass className="h-6 w-6" />,
                    title: "方位センサー",
                    description: "スマートフォンのジャイロ・加速度センサーで向いている方向を特定",
                  },
                  {
                    icon: <Building2 className="h-6 w-6" />,
                    title: "Bluetoothビーコン",
                    description: "位置情報を補正し、より正確な屋内ナビゲーションを実現",
                  },
                  {
                    icon: <Map className="h-6 w-6" />,
                    title: "AR技術",
                    description: "カメラ映像とマップを重ね合わせ、直感的な道案内を提供",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-sky-100">
                    <div className="text-sky-600 mb-2">{item.icon}</div>
                    <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-4">3. 3Dパンフレットによる新しい案内方式の提案</h3>
              <p className="mb-4">
                従来の紙のパンフレットは情報提供には優れているものの、リアルタイムでの案内や方向認識には不向きでした。
                しかし、紙のパンフレットとデジタルマップを組み合わせることで、これまでにない「直感的な屋内案内システム」を
                構築することができます。
              </p>
            </div>
          </section>

          {/* 目的セクション */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 flex items-center gap-2">
              <Target className="h-6 w-6" />
              目的
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-lg mb-6">
                本プロジェクトの目的は、
                <strong>
                  屋内施設における移動のしやすさを向上させるため、 方向推定が可能な3Dパンフレットを開発すること
                </strong>
                です。
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: "方向推定を活用した直感的なナビゲーションの実現",
                    description:
                      "スマートフォンの方位センサーを活用し、リアルタイムで進むべき方向を提示することで、直感的なナビゲーションを実現します。",
                  },
                  {
                    title: "デジタルと紙のパンフレットの融合",
                    description:
                      "紙のパンフレットの配布のしやすさとデジタルマップのインタラクティブ性を組み合わせ、最適な情報提供を行います。",
                  },
                  {
                    title: "施設管理者にとって簡単な運用システムの構築",
                    description:
                      "ドラッグ＆ドロップでのマップ作成、簡単な情報更新など、施設管理者の負担を軽減する機能を提供します。",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-sky-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-sky-900 mb-2">{item.title}</h3>
                    <p className="text-slate-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 目標セクション */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 flex items-center gap-2">
              <Tool className="h-6 w-6" />
              目標
            </h2>
            <div className="prose prose-slate max-w-none">
              <div className="space-y-6">
                {[
                  {
                    title: "直感的な方向認識が可能なナビゲーションの提供",
                    items: [
                      "スマートフォンのセンサーを活用し、ユーザーが現在向いている方向を可視化",
                      "目的地までの進行方向をリアルタイムで案内",
                      "階層の移動も考慮したルート案内の実現",
                    ],
                  },
                  {
                    title: "使いやすいマップ編集機能の開発",
                    items: [
                      "直感的なUIで、施設管理者が簡単にマップを作成・更新可能",
                      "施設ごとにカスタマイズ可能な階層管理やピン登録機能",
                      "イベントや期間限定情報にも対応できる柔軟なシステム設計",
                    ],
                  },
                  {
                    title: "多様な用途に適応できる汎用性の確保",
                    items: [
                      "商業施設（ショッピングモール、デパート）",
                      "展示会・イベント会場",
                      "大学キャンパス",
                      "病院",
                      "公共施設（駅構内、空港、博物館など）",
                    ],
                  },
                ].map((section, i) => (
                  <div key={i} className="bg-white rounded-lg border border-sky-100 p-4">
                    <h3 className="text-lg font-semibold text-sky-800 mb-3">{section.title}</h3>
                    <ul className="space-y-2">
                      {section.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 開発スケジュール */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 flex items-center gap-2">
              <Users className="h-6 w-6" />
              開発スケジュール
            </h2>
            <div className="prose prose-slate max-w-none">
              <div className="space-y-4">
                {[
                  {
                    phase: "フェーズ1：基本機能の開発（2-3ヶ月）",
                    items: [
                      "3Dマップの表示機能の実装",
                      "方向推定アルゴリズムの開発",
                      "基本的なナビゲーション機能の実装",
                    ],
                  },
                  {
                    phase: "フェーズ2：管理機能の開発（2-3ヶ月）",
                    items: ["マップ編集インターフェースの開発", "データ管理システムの構築", "施設情報登録機能の実装"],
                  },
                  {
                    phase: "フェーズ3：テストと改善（2-3ヶ月）",
                    items: [
                      "実際の施設でのプロトタイプテスト",
                      "ユーザーフィードバックの収集と分析",
                      "機能の改善と最適化",
                    ],
                  },
                ].map((phase, i) => (
                  <div key={i} className="bg-sky-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-sky-900 mb-2">{phase.phase}</h3>
                    <ul className="space-y-2">
                      {phase.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </motion.div>

        {/* フッター */}
        <div className="flex justify-center mt-12">
          <Link href="/" className="flex items-center text-sky-600 hover:text-sky-700 transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

