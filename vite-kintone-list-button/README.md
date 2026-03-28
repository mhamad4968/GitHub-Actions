# kintone 一覧画面用ボタン（Vite 6 + React 19 + TS + Tailwind 3）

## 今後の管理ポリシー（人・AI 共通・これに寄せる）

| やること | 理由 |
|----------|------|
| **アプリ ID・フィールドの正本は `kintone-ai-lab/kintone-apps.md`** | どのチャット・どの月でも同じ場所を見ればよい。 |
| **画面用バンドルでは ID は原則ソースに書かない** | `kintone.app.getId()` と `src/env.ts`（`.env` は空でOK）で足りることが多い。 |
| **新規アプリを作った直後** | `kintone-apps.md` に 1 行追加 → `npm run app:fields <ID>` でフィールドを貼る（`kintone-ai-lab` で実行）。 |
| **`.env` を使うのは例外だけ** | 「この JS だけ別アプリの API を触る」「別ドメインに向ける」など。**トークンは書かない。** |
| **デプロイ成果物** | いつも **`dist/desktop.bundle.js`** → kintone の **JS カスタマイズ**に載せ替え。 |

→ **日常は `.env` 無し + `kintone-apps.md` 更新 + `npm run build`** で回せる。

## 環境変数（アプリ ID・ドメインをソースに書かない）

Vite では **クライアントに渡す名前は `VITE_` で始める**必要がある。`.env.example` をコピーして `.env` を作り、値を書く。

```bash
cp .env.example .env
```

- **`VITE_KINTONE_APP_ID`**: 空なら **`kintone.app.getId()`**（今開いているアプリ）を使う。別アプリ向け REST だけ固定したいときに指定。
- **`VITE_KINTONE_BASE_URL`**: 空なら **今の kintone と同一ホスト**（`KintoneRestAPIClient` の既定）。別サブドメインだけ API に飛ばすときに指定。

**注意**: `.env` の値は **ビルド時にバンドルへ埋め込まれる**。ブラウザで展開されるので **API トークンやパスワードは入れない**（画面 JS からは使わないのが原則）。

変更後は **`npm run build` し直す**。

## 開発

```bash
cd kintone-ai-lab/vite-kintone-list-button
npm install
npm run dev
```

ブラウザで見た目確認（kintone API は呼べないので appId はダミー）。

## ビルド（kintone アップロード用）

次のどれでも同じ（**アップロード用は `dist/desktop.bundle.js` だけ**でよい）。

```bash
npm run build
# または
npm run build:kintone
# または（ローカルに vite が無い場合）
npx vite build
```

`dist/desktop.bundle.js` と `dist/desktop.bundle.js.map` ができる。  
（Tailwind は **JS にインライン注入**するので、原則 **JS ファイルだけ** kintone に載せればよい。）

## kintone への設定

1. 対象アプリの **JavaScript でカスタマイズ** に、`desktop.bundle.js` をアップロード。
2. **PC のレコード一覧画面**で読み込む設定にする（本サニーは `app.record.index.show` のみ登録）。

## REST API について

`@kintone/rest-api-client` は **実行ユーザーのログインセッション**を利用する。外部サイトから単体で開くとは動作が異なる点に注意。

## 型定義

本番では `dts-gen` でアプリのフィールド型を生成し、`kintone-globals.d.ts` の簡易型を置き換えると安全。
