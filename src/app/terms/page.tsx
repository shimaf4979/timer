// app/terms/page.tsx

"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight, FileText } from "lucide-react"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container px-4 md:px-6 py-12 md:py-20 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block rounded-full bg-sky-100 p-3 text-sky-600 mb-4"
          >
            <FileText className="h-6 w-6" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4"
          >
            利用規約
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl"
          >
            本利用規約は、本サービスが提供する電子パンフレットアプリのご利用に関する条件を定めるものです。サービスをご利用いただく前に、本規約をよくお読みください。
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8"
        >
          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4">1. サービスの概要</h2>
            <p>
              電子パンフレットアプリ（以下「本サービス」）は、既存の地図やフロアプランをインタラクティブな電子パンフレットに変換するサービスです。
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">2. 利用登録</h2>
            <p>
              本サービスの利用にはアカウント登録が必要です。登録の際には、正確かつ最新の情報を提供していただく必要があります。
            </p>
            <p>以下の場合、本サービスは登録を拒否したり、アカウントを削除したりする権利を有します：</p>
            <ul>
              <li>虚偽の情報を提供した場合</li>
              <li>過去に本規約に違反したことがある場合</li>
              <li>法律や規制に違反する目的で本サービスを利用しようとする場合</li>
              <li>その他本サービスが不適切と判断した場合</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">3. アカウントの管理</h2>
            <p>
              ユーザーは、自身のアカウント情報（特にパスワード）の機密性を維持する責任があります。アカウントの不正使用や不審な活動に気づいた場合は、直ちに本サービスにご連絡ください。
            </p>
            <p>アカウントの管理不備によって生じた損害について、本サービスは責任を負いません。</p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">5. 知的財産権</h2>
            <p>
              本サービスのコンテンツ（ソフトウェア、デザイン、ロゴ、テキストなど）に関する知的財産権は、本サービスまたは本サービスにライセンスを提供している第三者に帰属します。
            </p>
            <p>
              ユーザーがアップロードしたコンテンツ（地図データなど）の知的財産権は、ユーザーまたはそのライセンサーに帰属します。ただし、ユーザーは本サービスに対し、サービス提供に必要な範囲でそのコンテンツを使用、複製、修正、配布する権利を許諾するものとします。
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">6. 禁止事項</h2>
            <p>本サービスの利用にあたり、以下の行為を禁止します：</p>
            <ul>
              <li>法律、規制、本規約に違反する行為</li>
              <li>他者の知的財産権、プライバシー権、パブリシティ権などを侵害する行為</li>
              <li>虚偽、誤解を招く、または詐欺的な情報を提供する行為</li>
              <li>ハラスメント、差別、脅迫、名誉毀損などの行為</li>
              <li>マルウェア、ウイルスなどの有害なコードを送信する行為</li>
              <li>本サービスのセキュリティを侵害する行為</li>
              <li>本サービスの正常な運営を妨げる行為</li>
              <li>本サービスの書面による許可なく本サービスを商業目的で利用する行為</li>
              <li>本サービスのリバースエンジニアリングを行う行為</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">7. 免責事項</h2>
            <p>
              本サービスは「現状有姿」で提供され、特定の目的への適合性、商品性、完全性などについて、明示的または黙示的な保証はありません。
            </p>
            <p>
              本サービスは、本サービスの中断、遅延、セキュリティ侵害、データ損失などによって生じた損害について、法律で許容される最大限の範囲で責任を負いません。
            </p>
            <p>
              ユーザーが本サービスを通じてアクセスする第三者のコンテンツやサービスについて、本サービスは責任を負いません。
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">8. サービスの変更・中断・終了</h2>
            <p>
              本サービスは、事前の通知なく本サービスの内容を変更したり、一時的または永続的に中断または終了したりする権利を有します。
            </p>
            <p>サービスの変更・中断・終了によって生じた損害について、本サービスは責任を負いません。</p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">9. 規約の変更</h2>
            <p>
              本サービスは、必要に応じて本規約を変更することがあります。重要な変更がある場合は、サービス内での通知やメールでお知らせします。
            </p>
            <p>変更後も本サービスを継続して利用することにより、変更後の規約に同意したものとみなされます。</p>



            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">10. お問い合わせ</h2>
            <p>本規約に関するご質問やご懸念がある場合は、以下の連絡先までお問い合わせください：</p>
            <p>メール：shimayuu3412@gmail.com</p>
            <p>最終更新日：2025年3月12日</p>
          </div>
        </motion.div>

        <div className="flex justify-center mt-8">
          <Link href="/" className="flex items-center text-sky-600 hover:text-sky-700 transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

