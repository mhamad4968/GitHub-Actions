# 社内 FAQ ポータル — ファイルサーバ設置手順（順序どおり）

**ゴール**: ファイルサーバ上で `faq-kintone-proxy` を常時起動し、同じサーバ（または共有）の `faq-portal-full.html` から kintone **640（社内FAQDB）** に保存できるようにする。

**正本（フィールド・URL）**: [`kintone-apps.md` の「社内FAQDB」節](../kintone-apps.md) ・ [`faq-portal-external-web-kintone.md`](faq-portal-external-web-kintone.md)

---

## Windows Server での補足（ファイルサーバが Windows のとき）

- **Node.js**: [nodejs.org](https://nodejs.org/) の **LTS（22 系推奨）** を **.msi** で入れる（リポ `package.json` の **`engines.node`** 以上）。インストール後、**新しく開いた** PowerShell / cmd で `node -v` が通ることを確認。
- **フォルダ例**: `C:\kintone-app\faq-kintone-proxy` のように **パスを短く・英数字**にするとトラブルが減る（日本語パスは避け推奨）。
- **`.env` 作成**: `faq-kintone-proxy` 内で `copy .env.example .env` のあと、メモ帳などで `.env` を編集（**UTF-8** で保存。BOM なし推奨）。
- **npm**: プロキシフォルダで `npm install` → `npm start`。初回だけ `npm install` に時間がかかる。
- **ファイアウォール（GUI）**: 「Windows Defender ファイアウォール」→ **詳細設定** → **受信の規則** → **新しい規則** → **ポート** → **TCP / 特定のローカルポート `3847`** → **接続を許可** → プロファイルは **ドメイン / プライベート** を社内 LAN に合わせて選択。
- **ファイアウォール（PowerShell・管理者）** の例:

```powershell
New-NetFirewallRule -DisplayName "FAQ kintone proxy 3847" -Direction Inbound -Protocol TCP -LocalPort 3847 -Action Allow -Profile Domain,Private
```

- **疎通確認**: Windows 10/11/Server 2019 以降は **`curl.exe`** が使える。例: `curl.exe -sS http://127.0.0.1:3847/health`。PowerShell だけなら `Invoke-RestMethod http://127.0.0.1:3847/health` でも可。
- **常時起動（手順 10）**:
  - **タスク スケジューラ**: トリガー「**コンピューターの起動時**」、操作「**プログラムの開始**」で **`node`** のフルパス（`where.exe node` で確認）を指定し、引数に **`server.mjs` のフルパス**、**開始場所**に **`faq-kintone-proxy` フォルダのフルパス**。環境変数は `.env` から読むので **同一フォルダに `.env` があること**が重要。
  - または **NSSM** / **PM2 for Windows** で `node server.mjs` をサービス化（失敗時再起動がしやすい）。

---

## 手順一覧（この番号順に実施）

### 1. ファイルサーバに用意するもの

- **Windows または Linux** のいずれかのサーバ（常時起動できるマシン）
- **Node.js 22 LTS 以上**（[nodejs.org](https://nodejs.org/) 等・リポ `engines` 準拠）
- **インターネット外向き**（kintone `*.cybozu.com` へ HTTPS が出ること）
- 管理者権限で **ファイアウォール** を開けられること

### 2. フォルダを置く

リポジトリからコピーするか、既に配布済みの **`kintone-app\新規`** 一式をサーバの決めた場所に置く。

- `faq-portal-full.html` … ブラウザで開く本体  
- `faq-kintone-proxy\` … 中継プログラム（`package.json` / `server.mjs` / `.env.example`）

### 3. kintone で API トークンを発行する

- アプリ **640（社内FAQDB）**  
- 権限の目安: **レコードの追加・閲覧・編集・削除**（プロキシが書き込むため）

トークン文字列は **メモ帳に一時保存**し、**チャットやメールにそのまま貼らない**。

### 4. プロキシの `.env` を作る

`faq-kintone-proxy` フォルダで:

```text
copy .env.example .env
```

（Linux なら `cp .env.example .env`）

`.env` を編集し、**最低限**次を埋める:

| 変数名 | 値の例 | メモ |
|--------|--------|------|
| `KINTONE_DOMAIN` | `jbis-kintone.cybozu.com` | **`https://` を付けない** |
| `KINTONE_FAQ_APP_ID` | `640` | |
| `KINTONE_API_TOKEN` | （発行したトークン） | |

**他の PC からブラウザでプロキシに届ける**ため、待受をすべてのインターフェースに広げる:

| 変数名 | 値 |
|--------|-----|
| `BIND_HOST` | `0.0.0.0` |

（**このサーバだけ**で試すなら `127.0.0.1` のままでよいが、社員の PC から使うなら **`0.0.0.0` 必須**。）

ポート（既定でよければそのまま）:

| 変数名 | 値 |
|--------|-----|
| `PORT` | `3847` |

**CORS**（HTML を `http://ファイルサーバ/...` で開く場合）:

- 例: `CORS_ORIGINS=http://192.168.1.10,http://faq-internal`  
- とりあえず広くてよいときは `*`（本番では絞り推奨）

### 5. プロキシをインストールして起動する

`faq-kintone-proxy` フォルダで:

```bash
npm install
npm start
```

動いたら **このサーバの IP アドレス**をメモする（例: `192.168.1.10`）。

### 6. ファイアウォールでポートを開ける

サーバの OS で **TCP `3847` の着信**を、**社内 LAN から**許可する。

（ウィンドウズなら「受信の規則」、Linux なら `firewalld` / `ufw` 等。）

### 7. 起動確認（サーバ上または別 PC から）

サーバの IP を `FILESERVER_IP` とすると:

```bash
curl -sS "http://FILESERVER_IP:3847/health"
```

`"hasToken":true` などが返ればよい。

続けて:

```bash
curl -sS "http://FILESERVER_IP:3847/api/bootstrap"
```

`"ok":true` と `faqs`（配列）が返れば kintone まで届いている。

### 8. HTML に kintone 連携用の 1 行を入れる

`faq-portal-full.html` を編集し、**`<body>` より前**（例: `<head>` の直後）に次を **1 行だけ**追加する:

```html
<script>window.FAQ_API_BASE = "http://FILESERVER_IP:3847";</script>
```

`FILESERVER_IP` は **手順 5 でメモした IP**（または社内 DNS 名）。**ポートは `.env` の `PORT` と一致**させる。

保存する。

### 9. 社員に配布する開き方

- **推奨（方式 1）**: 社内の **Web サーバ（IIS 等）**または **Node `http-server`** で `faq-portal-full.html` を **`http://...` で配信**し、**ショートカットはその URL** にする。手順の具体例（経理 FAQ・`192.168.1.250`・`CORS_ORIGINS`・`.url` 生成）は **[`faq-portal-http-keiri-faq.md`](faq-portal-http-keiri-faq.md)**。  
- **共有フォルダだけ**の場合: 各自が **HTML をダブルクリック**（`file://`）で開く。環境によっては `FAQ_API_BASE` への通信が制限されることがある → **HTTP 配信に切り替える**。

画面のサブタイトルに **「保存先: kintone（API 経由）」** が出ていれば連携モード。

### 10. 常時起動にする（本番）

- **Windows**: タスク スケジューラでログオン時・起動時に `npm start` するバッチ、または **NSSM** / **PM2** 等  
- **Linux**: **systemd** ユニットで `node server.mjs` を実行

サーバ再起動後も **手順 5〜6** が崩れていないか確認する。

---

## 困ったとき

| 症状 | 確認 |
|------|------|
| 別 PC から `http://IP:3847/health` が繋がらない | **`BIND_HOST=0.0.0.0`** ・ファイアウォール **3847** ・IP の誤り |
| HTML から保存できない | **`FAQ_API_BASE`** が **手順 8 と同じ URL** か。HTML を **別ドメインの https** で開いているなら **CORS** |
| kintone にレコードが増えない | **640** のトークン権限・**`KINTONE_DOMAIN`** のスペル |

---

## 参照ファイル（リポジトリ内）

| パス | 内容 |
|------|------|
| `scripts/faq-portal-full.html` | ポータル本体 |
| `scripts/faq-kintone-proxy/` | プロキシ |
| `docs/faq-portal-external-web-kintone.md` | 技術概要 |
| `docs/faq-portal-usage-keiri.md` | 画面操作（PIN・バックアップ） |
