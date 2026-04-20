# FAQ ポータル：環境の作り方と使い方

**全体の地図（本ドキュメント）** ↔ **明日からの再開の正本**… **[`faq-portal-resume-tomorrow.md`](faq-portal-resume-tomorrow.md)**（**Node 確認 → 表 1〜10 を順に**。詰まったら [`faq-portal-node-install-troubleshoot.md`](faq-portal-node-install-troubleshoot.md)）。

社内 FAQ ポータル（**HTML** ＋ **kintone 640 社内FAQDB** ＋ **Node プロキシ**）を、**初めて環境を作る人**と**日々使う人**向けにまとめた手順です。  
構成の理由・フィールド定義の詳細は **[`faq-portal-external-web-kintone.md`](faq-portal-external-web-kintone.md)**、640／641 の役割は **[`faq-apps-640-641.md`](faq-apps-640-641.md)** を参照してください。

---

## 全体像（何を用意するか）

```
[ブラウザ] → [HTML の URL（http://…）]        … 質問一覧・検索
     ↓ FAQ_API_BASE が指す先だけ API 呼び出し
[faq-kintone-proxy] → [kintone REST API]   … API トークンはサーバの .env のみ
```

- **HTML** … リポジトリの **`scripts/faq-portal-full.html`**（社内配信用は `proxy-url` 埋め込み後の **`scripts/faq-windows/out/faq-portal-full.html`**）。  
- **プロキシ** … **`scripts/faq-kintone-proxy/`**（`npm start`）。  
- **kintone** … データの正本はアプリ **640（社内FAQDB）**。カテゴリマスタは **641**。

**`file://` で HTML を直接開かないでください。** ブラウザ制限でプロキシに届かないことがあります。**必ず `http://` または `https://` の URL** で開きます。

---

## ファイルサーバ運用（経理 FAQ・共有サーバ）

コピー先の例（`deploy-share-path.example.txt` の既定。IP の UNC で書いてもよい）:

`\\192.168.1.250\インストールソフト\その他\keiri-faq`

**ホスト名**（例: `\\Server01\…`）でも同じ共有を指せます。名前解決やポリシーに合わせてどちらでも構いません。

HTML の置き場所として **この UNC** を使う場合の整理です。

### 運用担当（環境を作る人）がすること

- **`deploy-share-path.txt`** にコピー先を 1 行で書く（`07-copy-to-share.bat` 用）。初回は `deploy-share-path.example.txt` をコピーしてよい。  
- **`04-build-intranet-html.bat`** または **`START-社内FAQポータル.bat`** 内のビルドで **`out\faq-portal-full.html`** を更新したうえで **`07-copy-to-share.bat`** を実行し、共有に **`faq-portal-full.html`** を置く。  
- **`proxy-url.txt`** には、**社員の PC からブラウザで届くプロキシの URL** を書く（例: `http://（プロキシサーバ名）:3847`）。各自の `localhost` ではない。  
- **プロキシ**は社内から届く 1 台などで動かし、**`BIND_HOST=0.0.0.0`** とファイアウォールで **`PORT`** を許可。  
- **`.env` の `CORS_ORIGINS`** に、社員が **アドレスバーに実際に表示されるオリジン**（`http://サーバ名` または `https://...` まで）を入れる。  
  - 共有フォルダを **そのまま UNC で開いて HTML をダブルクリック**する運用だと **`file://`** になりやすく、**プロキシに届かない**ことが多いです。**方式 1（HTTP で配信）**にする具体手順は **[`faq-portal-http-keiri-faq.md`](faq-portal-http-keiri-faq.md)**（IIS または Node 静的サーバ・`CORS_ORIGINS`・ショートカット生成 **`08-create-employee-shortcut.bat`**）。

### 社員がすること

- **原則**: 情報システムや運用担当が案内する **`http://` または `https://` の URL**（ブックマーク・社内ポータル）からポータルを開く。  
- **ショートカット**も、リンク先は **`http(s)://…/faq-portal-full.html`** にすると、運用側の一度の設定のあと **1 クリックで利用可能**（追加のインストール不要）。**UNC（`\\192.168…\…\faq-portal-full.html`）だけ**のショートカットは `file://` になりやすく **動かないことがある**ので避ける。  
- **Node・bat・`.env` は不要**（プロキシと HTML の更新は運用側）。  
- **共有のパスをエクスプローラだけで開いて HTML を直接開く**のは、上記のとおり **非推奨**（動かないことがある）。

---

## 必要なもの（チェックリスト）

| 項目 | 内容 |
|------|------|
| **Node.js** | **LTS**。`node` / `npm` がコマンドで動くこと。 |
| **kintone** | アプリ **640** が運用可能で、**API トークン**（レコードの参照・更新に必要な権限）があること。 |
| **ネットワーク** | プロキシを動かす PC から **kintone ドメイン**へ HTTPS で出られること。 |
| **（任意）641** | カテゴリ連携を使うなら 641 も整備（640 の JS が参照）。 |

---

## 環境を作る（初回のみ）

### Windows（社内 PC・サーバ）— いちばん簡単

1. このリポジトリを **ローカルに置く**（Git クローンまたは ZIP 展開）。  
2. エクスプローラで **`scripts\faq-windows\`** を開く。  
3. **`START-社内FAQポータル.bat`** をダブルクリックする。  
4. **初回**、メモ帳で開く **`scripts\faq-kintone-proxy\.env`** に、下表のとおり最低限を記入して保存する。  
5. もう一度 **`START-社内FAQポータル.bat`** を実行する（または、開いたままのプロキシ窓がエラーなら閉じてから再実行）。

`.env` の主な項目（**値は自社のものに差し替え**）:

| 変数 | 例・説明 |
|------|----------|
| `KINTONE_DOMAIN` | `（サブドメイン）.cybozu.com`（`.env.example` 参照） |
| `KINTONE_FAQ_APP_ID` | **`640`**（社内FAQDB） |
| `KINTONE_API_TOKEN` | 640 用 API トークン |
| `CORS_ORIGINS` | ブラウザのアドレスバーに出る **オリジン**（`http://localhost:3080` など）をカンマ区切り。**手元だけなら** `http://localhost:3080` を明示。 |
| `PORT` | 既定 **3847** のままでよいことが多い |
| `BIND_HOST` | **この PC だけ**がプロキシを使うなら `127.0.0.1`。**別 PC のブラウザ**から同じプロキシに届けるなら **`0.0.0.0`** とし、Windows ファイアウォールで **`PORT`** を許可 |

**`proxy-url.txt`**（`faq-windows` 内）には、**ブラウザが実際にアクセスするプロキシのベース URL** を **1 行**で書きます（末尾スラッシュなし）。

- 同じ PC で試すだけ: `http://127.0.0.1:3847`  
- 別サーバでプロキシを動かす: `http://（そのサーバのホスト名）:3847`  

`START` は **`proxy-url.txt` が無いとき** example をコピーするので、手元試用はそのままで動かせます。

**成功の目安**: ブラウザで **`http://localhost:3080/faq-portal-full.html`** が開き、FAQ が表示される（または空でもエラーで止まらない）。プロキシの疎通は **`GET http://127.0.0.1:3847/health`**（環境に合わせてホストを変える）。

詳細・bat の一覧: **[`faq-portal-internal-windows-setup.md`](faq-portal-internal-windows-setup.md)**。

### Linux / Mac / WSL（開発・検証）

1. **`scripts/faq-kintone-proxy/`** で `cp .env.example .env` し、上表と同様に `.env` を編集。  
2. そのディレクトリで `npm install` → `npm start`（プロキシ起動）。  
3. リポジトリ **ルート**で **`npm run faq-portal:preview`**（`scripts` をポート **3080** で配信）。  
4. ブラウザで **`http://localhost:3080/faq-portal-full.html`** を開く。  
   - リポジトリの HTML に **`FAQ_API_BASE` が無い**場合、ポータルがプロキシを呼べません。**[`faq-portal-external-web-kintone.md`](faq-portal-external-web-kintone.md)** の「手順」に沿い、先頭に  
     `window.FAQ_API_BASE = "http://127.0.0.1:3847"`  
     を入れるか、Windows 用の **`inject-faq-api-base.ps1`** で生成した **`out/faq-portal-full.html`** を配信してください。

---

## 日常的な使い方

| やりたいこと | 操作 |
|--------------|------|
| **ポータルを開く（Windows）** | **`START-社内FAQポータル.bat`** を実行。プロキシ窓と HTML 窓の **2 つは閉じない**。 |
| **ポータルを開く（分割起動）** | `03-start-proxy.bat` → `05-start-html-server.bat` → `06-open-portal.bat`（順番は [`faq-portal-internal-windows-setup.md`](faq-portal-internal-windows-setup.md) 参照）。 |
| **kintone で FAQ を直したあと** | ポータル画面の **「kintone から再読込」**（またはページ再読み込みでキャッシュに注意）。 |
| **止める** | プロキシ窓・HTML 配信窓で **Ctrl+C**、または窓を閉じる。 |
| **社内ファイルサーバに置く** | `04-build-intranet-html.bat`（または `START` 内のビルド）で **`out\faq-portal-full.html`** を更新 → **`deploy-share-path.txt`** を用意して **`07-copy-to-share.bat`**。手順の詳細は **[`faq-portal-internal-windows-setup.md`](faq-portal-internal-windows-setup.md)** の「社内ファイルサーバに置く場合」。 |

---

## うまくいかないとき

| 症状 | 確認すること |
|------|----------------|
| **CORS エラー** | `.env` の **`CORS_ORIGINS`** に、ブラウザのアドレスバーの **オリジン**（`http://〜:ポート` まで）が含まれているか。 |
| **プロキシに繋がらない** | **`proxy-url.txt` の URL** と、実際に起動しているプロキシの **`BIND_HOST` / `PORT`** が一致しているか。 |
| **真っ白・JSON が出る** | `record_type` や meta 行の不整合。 **[`faq-portal-external-web-kintone.md`](faq-portal-external-web-kintone.md)** のフィールド説明とプロキシ README を参照。 |
| **`file://` で開いている** | **やめて** `http://localhost:3080/...` など **HTTP(S) の URL** で開く。 |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [`faq-portal-internal-windows-setup.md`](faq-portal-internal-windows-setup.md) | Windows bat 詳細・共有コピー・トラブル |
| [`faq-portal-http-keiri-faq.md`](faq-portal-http-keiri-faq.md) | **HTTP 配信・ショートカット（方式 1）**・IIS／静的サーバ |
| [`faq-portal-external-web-kintone.md`](faq-portal-external-web-kintone.md) | プロキシの理由・フィールド・開発時の HTML |
| [`faq-apps-640-641.md`](faq-apps-640-641.md) | 640／641 の役割とカスタマイズ |
| `scripts/faq-windows/README.txt` | bat の短い一覧 |
