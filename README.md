# pamfree.com

## ver 1.1

公開編集機能を追加。みんなで作業ができるように。

## ver 1.2

バックエンドをGoに移し、サーバーはAWSを使用して高速化。
アーキテクチャを大幅改善、CDNを導入して高速化。

![Architecture](./public/arch1.png)

## ver1.3

印刷機能を追加、toBに対応できるようにしました。

## ver1.3.1

faviconを変更しました。
Pamfreeのiconは、ピンを意識して描かれています。
ひつじくん[Twitter](https://x.com/oldsheeep)が制作してくれました。

## どんなアプリ？

既存の地図やフロアプランを活用して、地図上にピンを指し、詳細一覧をたくさんの人で書き込めるインタラクティブな共有型パンフレットに変換できるサービスを開発しました。

このサービスは、学校のパンフレットやハッカソンのブース展示などでの活用を想定しており、視覚的にわかりやすく、情報を効果的に伝えられるのが特徴です。

## 何ができるの？

編集モードは用途に応じて切り替え可能で、自分だけが編集できるプライベートモード、複数人でリアルタイムに編集できる共同編集モード、内容を固定して閲覧のみ可能なモードを用意しています。

また、しおり機能も実装しており、参加者が自由にしおりを作成・共有できるため、重要なポイントをわかりやすく示すことが可能です。既存の地図やフロアプランをそのまま活用できるため、新規作成の手間を省きつつ、視覚的に訴求力のあるデザインを実現しています。

## tree

```
llStack/NewNext/timer $ cd src/app/
shimamurayuudai@shimamurayuudainoMacBook-Air ~/Documents/FullStack/NewNext/timer/src/app $ tree
.
├── account
│   └── page.tsx
├── admin
│   └── users
│       └── page.tsx
├── api
│   ├── account
│   │   ├── change-password
│   │   │   └── route.ts
│   │   └── update-profile
│   │       └── route.ts
│   ├── admin
│   │   └── users
│   │       ├── [userId]
│   │       │   └── route.ts
│   │       └── route.ts
│   ├── auth
│   │   ├── [...nextauth]
│   │   │   └── route.ts
│   │   └── register
│   │       └── route.ts
│   ├── floors
│   │   └── [floorId]
│   │       ├── image
│   │       │   └── route.ts
│   │       ├── pins
│   │       │   └── route.ts
│   │       └── route.ts
│   ├── maps
│   │   ├── [mapId]
│   │   │   ├── floors
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── by-map-id
│   │   │   └── [mapId]
│   │   │       └── route.ts
│   │   └── route.ts
│   ├── pins
│   │   └── [pinId]
│   │       └── route.ts
│   ├── public-edit
│   │   ├── pins
│   │   │   ├── [pinId]
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── register
│   │   │   └── route.ts
│   │   └── verify
│   │       └── route.ts
│   └── viewer
│       └── [mapId]
│           └── route.ts
├── apple-icon.png
├── assets
│   └── NotoSansJP-Bold.ttf
├── dashboard
│   └── page.tsx
├── favicon.ico
├── globals.css
├── icon0.svg
├── icon1.png
├── layout.tsx
├── login
│   └── page.tsx
├── logo.svg
├── manifest.json
├── maps
│   └── [mapId]
│       └── edit
│           └── page.tsx
├── page.tsx
├── pamphlet
│   └── page.tsx
├── privacy
│   └── page.tsx
├── proposal
│   ├── page.tsx
│   ├── price
│   │   └── page.tsx
│   ├── pro
│   │   └── page.tsx
│   └── pro222
│       └── page.tsx
├── public-edit
│   └── page.tsx
├── register
│   └── page.tsx
├── terms
│   └── page.tsx
└── viewer
    ├── logo.svg
    ├── p.png
    └── page.tsx

48 directories, 46 files
```
