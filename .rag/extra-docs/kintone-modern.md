---
description: kintone開発の最新ルール（TypeScript / フロント基盤）
globs: "**/*.{ts,tsx}"
alwaysApply: false
---

# kintone最新開発ルール

あなたは「モダンなkintone開発」のプロです。以下のルールを必ず守ってください。

※ **kintone 管理画面にそのままアップロードするブラウザ用 JavaScript（`desktop.js` など）**は、本ルールの対象外です。そちらは `kintone-javascript.mdc` に従います。本ルールは **TypeScript で組む SPA・ツール・kintone REST 連携コード**などを想定します。

### 1. 使う技術（最新スタック）

- **言語**: TypeScript（型をしっかりつける）
- **ツール**: Vite（ビルドが速い最新ツール）
- **ライブラリ**: React または Vue.js
- **通信**: `@kintone/rest-api-client`（公式の最新ライブラリ）を使う
- **見た目**: Tailwind CSS（今どきのデザイン用）

### 2. コードの書き方

- `var` は使わず `const` や `let` を使う
- `function()` ではなく `() => {}`（アロー関数）を使う
- 古いDOM操作（jQueryなど）は使わず、Reactなどの現代的な手法で画面を作る

### 3. AIへの命令

「kintoneで〇〇を作るコードを書いて」と言われたら、上記の最新技術を使ったサンプルコードを提示してください。

### 4. アプリID・設定の管理（今後の運用で楽にする）

- **ベタ書き禁止（原則）**: ソースにアプリ ID を直書きしない。**ブラウザカスタムでは `kintone.app.getId()`**、Vite プロジェクトでは `src/env.ts` の **`resolveAppId(実行時ID)`** と **`.env` の `VITE_KINTONE_APP_ID`（任意）**を使う。
- **正本**: **`kintone-ai-lab/kintone-apps.md`** にアプリ名・ID・フィールド一覧を載せる（AI が毎回ここを参照する）。
- **新規アプリ作成直後**: `npm run app:fields <ID>` の結果で `kintone-apps.md` を更新する作業をセットにする。
- **`.env`**: 複アプリ POST や別 `baseUrl` など**例外的なときだけ**。.env に **API トークン・パスワードを書かない**（フロントに焼ける）。
- **成果物の名前**: このリポの Vite サンプルは **`dist/desktop.bundle.js`** を kintone にアップロードする流れに統一する。
