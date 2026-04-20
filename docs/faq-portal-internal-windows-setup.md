# 社内FAQポータル（Windows・bat セットアップ）

**環境の作り方と日常の使い方（Windows／Linux いずれも）の全体ガイド**は **[`faq-portal-environment-setup-and-usage.md`](faq-portal-environment-setup-and-usage.md)** を先に読むと流れが掴みやすいです。

kintone **640（社内FAQDB）** と **`faq-portal-full.html`** を、**社内 PC / 社内サーバ**で動かすときの最短手順です。  
処理の自動化は **`scripts/faq-windows/*.bat`** にまとめています（**Node.js LTS** が必要）。

## フォルダと役割

| 場所 | 内容 |
|------|------|
| **`scripts/faq-kintone-proxy/`** | Node 製プロキシ（API トークンは `.env` のみ） |
| **`scripts/faq-windows/`** | **bat・PowerShell・生成物 `out/`** |
| **`scripts/faq-portal-full.html`** | ポータル本体（**`out/` 生成時は先頭に `FAQ_API_BASE` が付く**） |

640／641 の役割: [`faq-apps-640-641.md`](faq-apps-640-641.md)

## 最短（1 本の bat）

**`scripts\faq-windows\START-社内FAQポータル.bat`** をダブルクリックすると、次をまとめて行います。

- **初回のみ**: `faq-kintone-proxy\.env` が無ければ `.env.example` から作成し、メモ帳で **kintone ドメイン・640 アプリ ID・API トークン・`CORS_ORIGINS`（例: `http://localhost:3080`）** を設定。  
- **初回のみ**: プロキシ側の **`npm install`**（`node_modules` が無いとき）。  
- **`proxy-url.txt`** が無ければ **`proxy-url.txt.example` をコピー**（手元試用は既定の `http://127.0.0.1:3847` のままで可）。  
- **`04` と同等のビルド**で **`out\faq-portal-full.html`** を更新。  
- **プロキシ用窓**と **HTML 配信窓（3080）**を別ウィンドウで起動し、**ブラウザ**で `http://localhost:3080/faq-portal-full.html` を開く。

**共有フォルダ（UNC）へコピー**する場合だけ、従来どおり **`deploy-share-path.txt`** を用意して **`07-copy-to-share.bat`** を実行してください。

個別の bat（01〜06）で手順を分けたい場合は、下記「初回セットアップ」「日常の起動」を参照。

## 初回セットアップ（順番どおり）

1. **Node.js LTS** をインストールし、`node` / `npm` が PATH に入っていることを確認する。  
2. エクスプローラで **`scripts\faq-windows\`** を開く。  
3. **`01-copy-proxy-env.bat`** をダブルクリック  
   - `scripts\faq-kintone-proxy\.env` が無ければ `.env.example` から作成され、メモ帳が開きます。  
   - 最低限、次を埋める: **`KINTONE_DOMAIN`**・**`KINTONE_FAQ_APP_ID=640`**・**`KINTONE_API_TOKEN`**  
   - **`CORS_ORIGINS`** … ポータルを開く **ブラウザのオリジン**をカンマ区切りで。  
     - 例: 静的配信が `http://intranet-fs01:3080` ならその URL を列挙。  
     - 手元だけなら `http://localhost:3080`。開発の暫定で `*` も可（本番は絞る）。  
   - **他 PC からプロキシに届ける**サーバでは **`BIND_HOST=0.0.0.0`** とし、Windows ファイアウォールで **`PORT`（既定 3847）** を許可する。  
4. **`02-npm-install-proxy.bat`** … プロキシの `npm install`。  
5. **`proxy-url.txt`** … `proxy-url.txt.example` をコピーしてリネームし、**ブラウザがアクセスするプロキシのベース URL を1行**で書く（末尾スラッシュなし）。  
   - 例: `http://127.0.0.1:3847`  
   - 例: `http://社内プロキシサーバ:3847`  
6. **`04-build-intranet-html.bat`** … `scripts\faq-windows\out\faq-portal-full.html` を生成（`proxy-url.txt` の URL を HTML 先頭に挿入）。  

## 日常の起動（2つの窓）

| 手順 | bat | 説明 |
|------|-----|------|
| A | **`03-start-proxy.bat`** | プロキシ起動。**閉じない**（停止は Ctrl+C）。 |
| B | **`05-start-html-server.bat`** | **`out\`** を `http://localhost:3080` で配信。**別窓・閉じない**。 |
| C | **`06-open-portal.bat`** | ブラウザで `http://localhost:3080/faq-portal-full.html` を開く。 |

**`out\` をまだ作っていない**場合、`05` はリポジトリの `npm run faq-portal:preview` にフォールバックします（**`FAQ_API_BASE` 未挿入**の可能性あり → **`04` を先に**推奨）。

## 社内ファイルサーバに置く場合

### 共有フォルダ（UNC）へコピーする例（経理 FAQ）

配置先の例: **`\\192.168.1.250\インストールソフト\その他\keiri-faq`**（`\\Server01\…` などホスト名でも可。`deploy-share-path.example.txt` 参照）

1. **`04-build-intranet-html.bat`** で **`scripts\faq-windows\out\faq-portal-full.html`** を生成する。  
2. **`deploy-share-path.example.txt`** を **`deploy-share-path.txt`** にコピーし、**1 行目**にコピー先フォルダのパスだけ書く（`#` で始まる行はコメントとして無視）。  
3. **`07-copy-to-share.bat`** を実行すると、`out\faq-portal-full.html` が **`deploy-share-path.txt` のフォルダ**に **`faq-portal-full.html`** として上書きコピーされる。  
   - フォルダが無い場合は作成を試みる（権限が必要）。  
   - VPN・共有の書き込み権限が無いと失敗する。

### ブラウザで開く URL と CORS

- **推奨**: 利用者が **`http://（社内Web）/…/faq-portal-full.html`** のように **http(s) の URL** で開けるようにする（IIS・社内ポータルへの掲載など）。**`file://` や共有の「ネットワークドライブからダブルクリック」は非推奨**（ブラウザ制限でプロキシに届かないことがある）。  
- プロキシの **`.env` の `CORS_ORIGINS`** に、実際にアドレスバーに表示される **オリジン**（`http://サーバ:ポート` まで）を必ず含める。  
- プロキシ URL は **`proxy-url.txt` と一致**していること（**HTTPS ページから HTTP プロキシ**はブロックされやすい → 必要ならプロキシ側も HTTPS 終端を検討）。

### 手動コピー

bat を使わない場合も、`out\faq-portal-full.html` をエクスプローラで **`\\192.168.1.250\インストールソフト\その他\keiri-faq`**（または **`\\Server01\…`**）にコピーすれば同じです。

## トラブル

- **`file://` で HTML を開かない** … [`faq-portal-external-web-kintone.md`](faq-portal-external-web-kintone.md) の「file:// で開いたとき」を参照。  
- **CORS エラー** … `CORS_ORIGINS` と、実際にアドレスバーに出ている **オリジン**（ポートまで）が一致しているか確認。  
- **bat の文字化け** … コンソールは UTF-8（`chcp 65001`）想定。古い cmd で問題があれば **`README.txt`** の番号どおりに実行すれば足ります。

## bat 一覧（`scripts/faq-windows/`）

| ファイル | 役割 |
|----------|------|
| **`START-社内FAQポータル.bat`** | **最短起動**（上記「最短」）。ビルド＋プロキシ＋3080 配信＋ブラウザ |
| `_run-proxy.cmd` | プロキシのみ（`START` から起動される補助） |
| `_run-html-server.cmd` | `out\` を 3080 で配信のみ（補助） |
| `01-copy-proxy-env.bat` | プロキシ `.env` 作成・編集 |
| `02-npm-install-proxy.bat` | `faq-kintone-proxy` の `npm install` |
| `03-start-proxy.bat` | プロキシ起動 |
| `04-build-intranet-html.bat` | `proxy-url.txt` ＋ `inject-faq-api-base.ps1` → `out\faq-portal-full.html` |
| `05-start-html-server.bat` | `out\` をポート 3080 で配信 |
| `06-open-portal.bat` | ブラウザ起動 |
| `07-copy-to-share.bat` | **`deploy-share-path.txt` の UNC 等へ** `out\faq-portal-full.html` をコピー |
| `08-create-employee-shortcut.bat` | **`public-portal-url.txt`** の URL で **社員用 `.url` ショートカット**を `配布用\` に出力（HTTP 配信が前提） |

**HTTP でショートカット運用（方式 1）の手順書**: [`faq-portal-http-keiri-faq.md`](faq-portal-http-keiri-faq.md)

短いメモは同フォルダの **`README.txt`** も参照。
