"use client"
// app/privacy/page.tsx

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight, Shield } from "lucide-react"

export default function PrivacyPolicy() {
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
            <Shield className="h-6 w-6" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4"
          >
            プライバシーポリシー
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl"
          >
            本サービスは、お客様のプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーでは、本サービスのサービス利用における個人情報の取り扱いについて説明します。
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8"
        >
          <div className="prose prose-slate max-w-none">
            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4">1. 収集する情報</h2>
            <p>本サービスは、以下の情報を収集することがあります：</p>
            <ul>
              <li>
                <strong>アカウント情報</strong>：氏名、メールアドレス、パスワード（暗号化して保存）
              </li>
              <li>
                <strong>プロフィール情報</strong>：プロフィール画像、所属組織など
              </li>
              <li>
                <strong>コンテンツ情報</strong>：アップロードされた地図データ、作成したインタラクティブマップの内容
              </li>
              <li>
                <strong>利用情報</strong>：アクセスログ、IPアドレス、ブラウザ情報、デバイス情報
              </li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">2. 情報の利用目的</h2>
            <p>収集した情報は、以下の目的で利用します：</p>
            <ul>
              <li>サービスの提供・維持・改善</li>
              <li>ユーザー認証とアカウント管理</li>
              <li>カスタマーサポートの提供</li>
              <li>サービスに関する重要なお知らせの送信</li>
              <li>新機能や更新情報のご案内（マーケティングメールはオプトアウト可能）</li>
              <li>不正利用の検出と防止</li>
              <li>法的義務の遵守</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">3. 情報の共有</h2>
            <p>本サービスは、以下の場合を除き、お客様の個人情報を第三者と共有することはありません：</p>
            <ul>
              <li>お客様の同意がある場合</li>
              <li>サービス提供に必要なパートナー企業（データ処理業者、クラウドサービスプロバイダーなど）</li>
              <li>法的要請に応じる必要がある場合</li>
              <li>本サービスの権利や財産を保護する必要がある場合</li>
              <li>緊急事態においてユーザーや公共の安全を保護する必要がある場合</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">4. データセキュリティ</h2>
            <p>
              本サービスは、お客様の個人情報を不正アクセス、改ざん、漏洩から保護するために、適切な技術的・組織的措置を講じています。ただし、インターネット上での完全なセキュリティを保証することはできません。
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">5. データ保持</h2>
            <p>
              本サービスは、サービス提供に必要な期間、または法的義務を遵守するために必要な期間、お客様の情報を保持します。アカウント削除をご希望の場合は、カスタマーサポートにお問い合わせください。
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">6. Cookieの使用</h2>
            <p>
              本サービスのサービスでは、ユーザー体験の向上や分析のためにCookieを使用しています。ブラウザの設定でCookieを無効にすることも可能ですが、一部の機能が正常に動作しなくなる可能性があります。
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">7. お子様のプライバシー</h2>
            <p>
              本サービスのサービスは、13歳未満のお子様を対象としていません。13歳未満のお子様の個人情報を意図的に収集することはありません。
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">8. ユーザーの権利</h2>
            <p>お客様には以下の権利があります：</p>
            <ul>
              <li>個人情報へのアクセス</li>
              <li>個人情報の訂正</li>
              <li>個人情報の削除（法的義務がある場合を除く）</li>
              <li>個人情報の処理の制限</li>
              <li>データポータビリティ</li>
              <li>オプトアウト権（マーケティングメールなど）</li>
            </ul>
            <p>これらの権利を行使するには、カスタマーサポートにお問い合わせください。</p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">9. プライバシーポリシーの変更</h2>
            <p>
              本サービスは、必要に応じて本プライバシーポリシーを更新することがあります。重要な変更がある場合は、サービス内での通知やメールでお知らせします。最新のプライバシーポリシーは常にこのページでご確認いただけます。
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-sky-800 mb-4 mt-8">10. お問い合わせ</h2>
            <p>プライバシーに関するご質問やご懸念がある場合は、以下の連絡先までお問い合わせください：</p>
            <p>メール：shimayuu3412@gmail.com
            </p>
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

