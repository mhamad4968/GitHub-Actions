# collect（631）設定 —「何に」「何を」入れるか

**迷ったら**: まず **A. ローカルの `.env`** だけ埋める → 動いたら **B. GitHub** を同じ中身で真似する。

---

## 用語（このドキュメントでの意味）

| 言い方 | 意味 |
|--------|------|
| **名前** | 環境変数の**左側**（例: `KINTONE_DOMAIN`）。**スペル・大文字小文字を一字一句合わせる**。 |
| **値** | **右側**。パスワード・URL・数字など **実際の秘密や文字列**。 |
| **Secret** | GitHub に登録する **名前＋値**。ログに値は出ない。 |
| **Variable** | GitHub に登録する **名前＋値**。**秘密ではない**設定向け（モデル名・`1` など）。値がログに残る可能性は考慮。 |

ローカルでは **`security-next-automation/.env`** に `名前=値` の 1 行ずつ書きます。

---

## A. ローカル `.env` — 行ごとに「入れる値」

`security-next-automation` フォルダで `cp .env.example .env` したあと、次を埋めます。  
同じフォルダに **`.env.local`** がある場合、**同名のキーは `.env.local` が優先**されます（NVD が効かないときはここを確認）。

### A-1. 必須（この 3 つが無いと kintone に届かない）

| `.env` の行（名前） | 値に入れるもの（例） | どこで手に入れるか |
|---------------------|----------------------|---------------------|
| `KINTONE_DOMAIN=` | `jbis-kintone.cybozu.com` のような **ホスト名だけ**（`https://` なし） | ブラウザの kintone URL。`https://jbis-kintone.cybozu.com/...` なら **`jbis-kintone.cybozu.com`** だけにする |
| `KINTONE_APP_ID=` | `631` のような **半角数字だけ**（ニュースアプリの ID） | kintone でニュースアプリを開く → URL の `k=` やアプリ設定に出る **アプリ ID** |
| `KINTONE_API_TOKEN_COLLECT=` | `abcd1234...` のような **長い英数字**（API トークン） | そのアプリの **設定 → API トークン** で発行。**レコードの追加・参照**ができるトークン |

**そのままコピー用（値だけ自分のに差し替え）:**

```env
KINTONE_DOMAIN=ここにホスト名だけ.cybozu.com
KINTONE_APP_ID=631
KINTONE_API_TOKEN_COLLECT=ここに631用APIトークン
```

`KINTONE_BASE_URL` は **どちらかでよい** 運用なら省略可。`KINTONE_DOMAIN` を優先してください。

### A-2. 任意 — 一行ずつ「入れるもの」

| `.env` の名前 | 値に入れるもの | いつ必要？ |
|---------------|----------------|------------|
| `GEMINI_API_KEY=` | Google AI Studio などで発行した **API キー文字列** | 概要・要約を Gemini で整えたいとき |
| `GEMINI_MODEL=` | 例: `gemini-2.0-flash`（**自分の環境で使える名前**） | 既定モデル以外にしたいとき |
| `SECURITY_NEXT_RSS_URL=` | `https://www.security-next.com/feed` など **RSS の URL** | Security NEXT 以外の 1 本に差し替えたいとき |
| `RSS_FEED_URLS=` | `https://a/feed,https://b/feed` のように **カンマ区切りで複数 URL** | **複数 RSS** を同時に読みたいとき（**こちらを書くと `SECURITY_NEXT_RSS_URL` より優先**） |
| `COLLECT_NVD_ENABLE=` | `1` または `true` または `yes` | **NVD の CVE 一覧も併用**するときだけ |
| `NVD_API_KEY=` | NVD がメールで送る **API キー**（英数字） | NVD を使うなら **強く推奨**（無いとレートで失敗しやすい） |
| `NVD_LOOKBACK_DAYS=` | 例: `7`（半角数字） | 省略時 7。何日さかのぼって CVE を取るか |
| `NVD_MAX_PER_RUN=` | 例: `50`（半角数字） | 省略時 50。1 回で NVD から候補に乗せる上限 |
| `NOTIFY_WEBHOOK_URL=` | Slack 等の **Incoming Webhook URL** | 失敗通知などを飛ばしたいとき |

**NVD のキーの取り方**: [NVD API Key Request](https://nvd.nist.gov/developers/request-an-api-key) で申請 → メールのワンタイムリンクで表示された **キーをコピー**（公開しない）。

---

## B. GitHub —「画面の Name に何を」「Secret / Variable どちら」

GitHub のリポジトリ → **Settings** → **Secrets and variables** → **Actions**。

- **機密**（トークン・API キー）→ **Secrets** タブ  
- **機密でない設定**（`1` やモデル名・カンマ区切り URL）→ **Variables** タブ  

`daily-collect` は **Environment `kintone-collect`** を使います。

### B-1. Environment secrets（推奨：環境ごとに分けたい場合）

**Settings** → **Environments** → **`kintone-collect`** → **Environment secrets** → **Add secret**

| Name（画面左・名前。これを正確に） | Secret の値（画面右に貼る中身） |
|-----------------------------------|--------------------------------|
| `KINTONE_DOMAIN` | ローカルと**同じ**ホスト名（例: `jbis-kintone.cybozu.com`） |
| `KINTONE_APP` | ローカルの **`KINTONE_APP_ID` と同じ数字**（例: `631`）。**名前は `KINTONE_APP_ID` ではなく GitHub では `KINTONE_APP`** が使われます |
| `KINTONE_API_TOKEN_COLLECT` | ローカルと**同じ** API トークン |
| `GEMINI_API_KEY` | （任意）ローカルと同じ Gemini キー |
| `SECURITY_NEXT_RSS_URL` | （任意）例: `https://www.security-next.com/feed` |
| `NVD_API_KEY` | （任意・NVD 使うなら推奨）NVD から発行されたキー |

**よくあるミス**: `KINTONE_APP` という **Secret 名が無い**と、Actions ログで `KINTONE_APP_defined=false` になります。**名前は `KINTONE_APP`、値は `631` のような ID だけ**。

### B-2. Repository variables（名前はそのまま Variable 名）

**Actions** → **Variables** → **New repository variable**

| Variable 名 | 値の例 | 意味 |
|-------------|--------|------|
| `GEMINI_MODEL` | `gemini-2.0-flash` | モデル ID |
| `COLLECT_MAX_NEW_PER_RUN` | `100` など | 候補の上限（使うときだけ） |
| `COLLECT_NVD_ENABLE` | `1` | NVD をオンにする |
| `RSS_FEED_URLS` | `https://a/feed,https://b/rss` | 複数 RSS（**改行よりカンマ区切りが簡単**） |
| `NVD_LOOKBACK_DAYS` | `7` | NVD 遡り日数 |
| `NVD_MAX_PER_RUN` | `50` | NVD 候補の上限 |

**注意**: `RSS_FEED_URLS` を Variables に書いた場合、コードは **こちらを優先**します。空のままなら Secret の `SECURITY_NEXT_RSS_URL` が使われます。

### B-3. Repository secrets だけで運用する場合

Environment を使わず **Repository secrets** に `KINTONE_DOMAIN` などを置いた場合でも、ワークフローが **`environment: kintone-collect`** のときは **Environment 側に同じ名前の Secret が無いと空**になることがあります。**エラーになる場合は Environment `kintone-collect` に同じ Secret 名で追加**してください。

---

## C. 動作確認（ローカル）

リポジトリの **ルート**で:

```bash
npm run security-next:collect
```

ログに `[ニュース収集] 接続先ドメイン:` とアプリ ID が出れば、**少なくとも kintone 接続設定は読めています**。

---

## D. もっと細かい画面操作

README の **[ハイブリッド収集（複数 RSS ＋ NVD CVE）— 設定手順【詳細】](../README.md)** に、GitHub のクリックの流れを載けています。

---

## 以前の「表だけ版」を置き換えました

必須・任意・GitHub 対応は **上記 A〜B が正**です。不明な **1 箇所**（例: 「Company の URL がこれで合ってる？」）があれば、その画面の説明だけ返信してください。
