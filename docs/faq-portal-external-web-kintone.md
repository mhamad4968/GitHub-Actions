# FAQ ポータル（社内別 URL）＋ kintone を DB にする

`faq-portal-full.html` を社内の任意 URL で配信し、**データのマスタ**を kintone アプリに置く構成です。

**ファイルサーバに順番どおり置く手順だけ読む**: [`faq-portal-file-server-setup.md`](faq-portal-file-server-setup.md)

## なぜプロキシが必要か

ブラウザから `https://（ドメイン）/k/v1/...` を **API トークン付きで直接呼ぶ**と、**(1) CORS で止まることが多い (2) トークンが HTML に埋め込まれ全員に流出する**ため、**別途 Node 製の薄い API（`faq-kintone-proxy`）**を同じ社内ネットに置き、HTML は **`/api/*` だけ**叩きます。

## 構成

```
[社員ブラウザ] → [社内 WEB（HTML 静的配信）]  … faq-portal-full.html
       ↓ window.FAQ_API_BASE 指定時のみ
[faq-kintone-proxy :3847 など] → [kintone REST API] … トークンはサーバの .env のみ
```

## kintone アプリ（1 アプリで運用・推奨アプリ名 `社内FAQDB`）

**本番の FAQ データはアプリ 640（社内FAQDB）。カテゴリ階層マスタは 641。混同しないこと。** 役割・ルックアップ・カスタム JS の説明は **[`docs/faq-apps-640-641.md`](faq-apps-640-641.md)**。

次のフィールドを **フィールドコードどおり** に用意してください（`.env.example` と一致させ、`server.mjs` の既定値でも動きます）。640 に `category_lookup` や `attachment` 等を追加した場合も、**プロキシが送る項目**（`record_type` / `question` / `answer` / `category` / `important` / `published`）さえあれば同期は動作します。

| フィールド名（例） | フィールドコード | 型 | 説明 |
|--------------------|------------------|-----|------|
| レコード種別 | `record_type` | ドロップダウン | 選択肢: **`faq` / `meta`**（API ではキーと表示ラベルが同じ文字列である必要あり） |
| 質問 | `question` | 1行テキスト | FAQ の質問（meta 行は固定文字でもよい） |
| 回答 | `answer` | 複数行テキスト | FAQ 本文 **または** meta 行では JSON 文字列全体 |
| カテゴリ | `category` | 1行テキスト | ポータル右のカテゴリと一致する **子カテゴリ名**（`faq` のみ） |
| 重要 | `important` | チェックボックス | 選択肢の値を **`yes`**（.env の `CHECKBOX_YES`） |
| 公開 | `published` | チェックボックス | 同上。チェック＝公開 |

- **`record_type = meta` のレコードは 1 件**（無い場合は初回同期で自動作成）。`answer` に `{"settings":{...},"hierarchy":{...}}` を保存します。
- **`record_type = faq`** が FAQ 1 件につき 1 レコードです。

**API トークン**には、少なくとも当該アプリの **閲覧・追加・編集・削除**（運用に合わせて最小権限）を付与してください。

## 手順

1. **kintone アプリ作成（推奨）**: リポジトリルートで管理者 `.env` を読み込み  
   `npm run setup:faq-portal-app`  
   ログに出る **appId** を控える。スペースは **`KINTONE_FAQ_SPACE_ID`**。アプリ名を変えたいときのみ **`KINTONE_FAQ_APP_NAME`**（既定は **`社内FAQDB`**）。手作業で作る場合は [`kintone-apps.md` の「社内FAQDB」節](../kintone-apps.md) とフィールドコードを一致させる。  
2. 当該アプリで **API トークン**を発行（レコードの閲覧・追加・編集・削除）。  
3. `scripts/faq-kintone-proxy` で `cp .env.example .env` をし、`KINTONE_DOMAIN` / `KINTONE_FAQ_APP_ID` / `KINTONE_API_TOKEN` 等を埋める。  
4. `npm install && npm start` でプロキシを起動（本番は systemd / 社内リバプロの裏の `127.0.0.1` 推奨）。  
5. 静的ホスト用の HTML で、**`faq-portal-full.html` より前**に次を 1 行入れる（URL は環境に合わせる）:

```html
<script>window.FAQ_API_BASE = "https://faq-api.example.local";</script>
```

6. ブラウザでポータルを開き、保存・一覧が kintone と一致するか確認する。

### kintone で入力した内容を HTML に反映するには

- HTML の **先頭**で **`window.FAQ_API_BASE`** をセットし（上記）、**`faq-kintone-proxy` を起動**したうえで `faq-portal-full.html` を開く。初回表示で kintone（640）から **GET `/api/bootstrap`** が走り、一覧に取り込まれる。
- kintone でレコードを追加・編集した **あと**は、ポータル左の **「🔄 kintone から再読込」** を押すか、**ページを再読み込み（F5）**する（自動ポーリングはしていない）。
- **レコード種別**は **`faq`**（FAQ 本文）か **`meta`**（ポータル設定の 1 件）を推奨。未選択の行も **プロキシ更新後**は一覧に含められるが、運用では **`faq` にそろえる**と安全（640 の `desktop.js` が新規作成時に `faq` を既定代入）。

## セキュリティメモ

- プロキシに **認証をかけない**と、社内 URL を知る人は **`/api/portal-sync` で全件書き換え**しうるため、**VPN 内限定・Basic 認証・IP 制限・リバプロ側の制限**のいずれかを推奨します。  
- **CORS** は `CORS_ORIGINS` にフロントのオリジンだけを列挙してください（本番では `*` 避け）。  
- 既存の **PIN** は JSON に含まれ kintone に保存されます。**厳密な秘密情報には使わない**でください。

## file:// で開いたとき（SyntaxError・frame の警告）

エクスプローラで HTML をダブルクリックすると `file:///C:/Users/.../faq-portal-full.html` になり、次のような症状が出やすいです。

- **`Uncaught SyntaxError: Invalid or unexpected token`（行 1 付近）**  
  - `<script>window.FAQ_API_BASE = ...</script>` を **HTML より前に足した行**で、**Word やメールからコピーした「スマート引用符」`"` `"`** や **全角記号**が混ざっていることが多いです。**URL を囲むのは半角の `"` だけ**にしてください。  
  - 保存形式が **UTF-16** になっていると先頭が壊れて同様に見えることがあります。**UTF-8（BOM なし推奨）**で保存し直してください。
- **`Unsafe attempt to load URL file://... from frame...`**  
  - `file:` はブラウザが **特別なオリジン**として扱い、`fetch` や一部 API が期待どおり動きません。**必ず `http://localhost` などで配信**して開いてください。

### 手元で http で開く例

リポジトリルートで:

```bash
npm run faq-portal:preview
```

ブラウザで **`http://localhost:3080/faq-portal-full.html`** を開く（先頭の `FAQ_API_BASE` 行はこの HTML ファイルの **一番上・`<!DOCTYPE html>` の直前**に置く運用ならそのまま）。

プロキシ側の **`CORS_ORIGINS`** に **`http://localhost:3080`** を含めてから再起動してください（ワイルドカード `*` のままなら開発時はそのままでも可）。

## ローカルストレージモード

`window.FAQ_API_BASE` を**設定しない**場合、従来どおり **localStorage のみ**です（他 PC と共有されません）。

## 参照

- **環境構築と使い方（入口）**: [`docs/faq-portal-environment-setup-and-usage.md`](faq-portal-environment-setup-and-usage.md)  
- HTML 本体: `scripts/faq-portal-full.html`  
- プロキシ: `scripts/faq-kintone-proxy/`  
- **社内 Windows・bat 手順**: [`docs/faq-portal-internal-windows-setup.md`](faq-portal-internal-windows-setup.md) … **`START-社内FAQポータル.bat`**（最短）または `scripts/faq-windows\*.bat`  
- 経理向け操作メモ（従来）: `docs/faq-portal-usage-keiri.md`  
