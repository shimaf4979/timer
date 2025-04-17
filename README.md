# pamfree.com

![pamfree](https://github.com/user-attachments/assets/0a17057b-71f3-4f42-9a96-2dc72ed290eb)

「パンフレットは作るから共有する時代に」というモットーに基づいて、既存の地図やフロアプランを活用して、地図上にピンを指し、詳細一覧をたくさんの人で書き込めるインタラクティブな共有型パンフレットに変換できるサービスを開発しました。

Pamfreeのiconは、ピンを意識して描かれています。

ひつじくん[@oldsheep](https://x.com/oldsheeep)が制作してくれました。

## 何ができるの？

このサービスは、学校のパンフレットやハッカソンのブース展示などでの活用を想定しており、視覚的にわかりやすく、情報を効果的に伝えられるようになっています。

やり方は、画像を挿入し、ピンを刺すだけ。ピンを押すと情報が表示され、ピン一覧から情報を押すことで、ピンの位置を示してくれることもできます。


<img width="1148" alt="スクリーンショット 2025-04-17 12 49 26" src="https://github.com/user-attachments/assets/ad756885-9199-4538-af00-4aeb7cada6af" />



編集モードは用途に応じて切り替え可能で、自分だけが編集できるプライベートモード、複数人でリアルタイムに編集できる共同編集モード、内容を固定して閲覧のみ可能なモードを用意しています。


![用途に分けて編集可能](./public/edit1.png)


また、置いたピンをもとに、しおりを作ることができます。
作ったしおりは、そのまま印刷できるようになっています。


![印刷可能](./public/siori.png)

# アップデート情報

## ver 1.1

公開編集機能を追加。みんなで作業ができるように。

## ver 1.2

バックエンドをGoに移し、サーバーはAWSを使用して高速化。
アーキテクチャを大幅改善、CDNを導入して高速化。

![Architecture](./public/arch1.png)

## ver1.3

印刷機能を追加、toBに対応できるようにしました。

## ver1.3.1

faviconを変更しました。PamfreeのPがiconになっています。

## tree

構成は以下の通りです。

```
48 directories, 46 files

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
```
