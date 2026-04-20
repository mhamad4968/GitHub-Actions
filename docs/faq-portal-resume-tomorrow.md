# FAQ ポータル — 明日再開メモ（Node 未完了・リポジトリ配置／コピー中断も）

**このファイルは FAQ ポータル「明日から再開する」ときの正本**（開くのはまずここ）。

---

## 明日（FAQ ポータル）— 手順どおりに進める

1. **開くファイル**: この **`docs/faq-portal-resume-tomorrow.md`**（正本）。  
2. **最初**: **Node.js を入れる** → **新しい**ターミナルで **`node -v`** と **`npm -v`** が**両方**バージョン表示されるまで。  
3. **そのあと**: 下の **「本番までの手順（要約・番号順）」の表 1〜10** を**上から順に**。  
4. **詰まったら（主に Node）**: [`faq-portal-node-install-troubleshoot.md`](faq-portal-node-install-troubleshoot.md)。  
5. **全体の地図**（環境の意味・役割）: [`faq-portal-environment-setup-and-usage.md`](faq-portal-environment-setup-and-usage.md) の**冒頭**にも、この再開メモへのリンクあり。

---

## 作業中断メモ（直近・書き足し用）

### 再発防止：成果物の置き場所をログに残す

FAQポータルは「HTML・プロキシ・Windows起動（bat）」が揃わないと進めないため、**更新・コピーのたびに置き場所をログ**に残す。正本は原則リポ内だが、社内PC都合で `Documents` 等に置いた場合も**必ず記録**して迷子を防ぐ。

- 台帳（正本）: [`faq-portal-artifacts-log.md`](faq-portal-artifacts-log.md)

**更新例（コピーで日を区切るとき）**:

- **保守 PC の配置**: **`C:\dev\kintone-ai-lab`**（`C:\dev` を C 直下に作成し、その中にリポジトリルートを置く）。コピーに時間がかかる場合は、**コピー完了**を待ってから次へ。  
- **明日再開の目安**: エクスプローラで **`C:\dev\kintone-ai-lab\scripts\faq-windows`** が開けることを確認する → **この PC で Node をまだ確認していなければ** `node -v` / `npm -v` → 問題なければ **表の 3 番**（`faq-kintone-proxy\.env`）から続行。

### 重要：`faq-windows` が無いとき（配布物不足の判定）

`C:\dev\kintone-ai-lab\scripts\faq-windows` が **存在しない**場合、以下のどれかが起きている可能性が高い（**そのまま表 3 へ進めない**）。

- **フォルダの階層が違う**（別フォルダを開いている）
- **コピー元の配布物が不足**（`scripts/faq-windows`・`scripts/faq-kintone-proxy`・`scripts/faq-portal-full.html` が入っていない版）
- **コピー途中**（未完了）

この場合はまず、存在確認（3つ揃っているか）をする。

```bat
dir C:\dev\kintone-ai-lab\scripts\faq-windows
dir C:\dev\kintone-ai-lab\scripts\faq-kintone-proxy
dir C:\dev\kintone-ai-lab\scripts\faq-portal-full.html
```

3つのどれかが「見つからない」なら、**正しい一式を追加でコピー**するか、**Git clone / ZIP 展開**で揃える（担当者・配布元に確認）。揃ってから表 3 へ進む。

---

**記録日**: 作業を中断した日にメモしておく。  
**今日の状態（テンプレ）**: 上記「作業中断メモ」を参照。従来どおり **Node 未完了**だけのときは、下の **「明日 最初にやること」** から再開する。

---

## 明日 最初にやること（これだけ）

1. **Node.js LTS** を入れる（どれかで成功するまで）。  
   - 公式 `.msi` を **管理者として実行**  
   - または **PowerShell（管理者）**: `winget install OpenJS.NodeJS.LTS`  
   - 企業 PC なら **情シス配布**やポータル経由の Node を使う  
2. **新しい** cmd / PowerShell で確認:  
   `node -v` と `npm -v` が **両方バージョン表示**されれば次へ。  
3. このファイルの **「本番までの手順（要約・番号順）」** に進む。

インストールが止まるときのヒント: [`faq-portal-node-install-troubleshoot.md`](faq-portal-node-install-troubleshoot.md)（同梱の短いトラブルシュート）。

---

## 本番までの手順（要約・番号順）

**ゴール**: 社員が **`http://192.168.1.250:8080/faq-portal-full.html`**（ポートは環境に合わせて変更可）の **ショートカット 1 クリック**で開ける。詳細は各リンク先。

| # | やること |
|---|----------|
| 1 | **Node 導入** → `node -v` / `npm -v` OK（上記「明日最初に」） |
| 2 | リポジトリを運用担当 PC に置く。`scripts\faq-windows\` を開ける。**保守 PC の例**: `C:\dev\kintone-ai-lab`（`C:\dev` を作成し、その中にリポジトリルートを置く）→ 作業は `C:\dev\kintone-ai-lab\scripts\faq-windows\` から。 |
| 3 | **`scripts\faq-kintone-proxy\.env`** … `KINTONE_DOMAIN`・`KINTONE_FAQ_APP_ID=640`・`KINTONE_API_TOKEN`・**`BIND_HOST=0.0.0.0`**・**`CORS_ORIGINS=http://192.168.1.250:8080`**（実際の HTML のオリジンに合わせる） |
| 4 | `faq-kintone-proxy` で `npm install` → **プロキシ起動** `npm start`。FW で **TCP 3847** 受信許可。別 PC から `http://192.168.1.250:3847/health` を確認。 |
| 5 | **`scripts\faq-windows\proxy-url.txt`** に **1 行** `http://192.168.1.250:3847`（プロキシの届く URL）。 |
| 6 | **`04-build-intranet-html.bat`** で `out\faq-portal-full.html` を生成。 |
| 7 | **`deploy-share-path.txt`** … `\\192.168.1.250\インストールソフト\その他\keiri-faq`（`deploy-share-path.example.txt` 参照）。**`07-copy-to-share.bat`** で共有へコピー。 |
| 8 | **HTTP 配信** … IIS またはサーバ上で `npx http-server "（keiri-faq のローカルパス）" -p 8080 -a 0.0.0.0 -c-1`。FW **8080**。詳細: [`faq-portal-http-keiri-faq.md`](faq-portal-http-keiri-faq.md) |
| 9 | ブラウザで **`http://192.168.1.250:8080/faq-portal-full.html`** を開き、FAQ・保存・再読込が動くか確認。 |
|10 | **`08-create-employee-shortcut.bat`**（`public-portal-url.txt` を設定）→ **`配布用\経理FAQポータル.url`** を社員に配布。 |

手元だけで試すときは **`START-社内FAQポータル.bat`**（`localhost:3080`）でも可。本番の社員配布は上表の **HTTP＋共有** ルート。

---

## ドキュメントインデックス（FAQ ポータル関連）

| ドキュメント | 用途 |
|--------------|------|
| **このファイル** `faq-portal-resume-tomorrow.md` | 中断からの再開・番号付き要約 |
| [`faq-portal-node-install-troubleshoot.md`](faq-portal-node-install-troubleshoot.md) | Node / npm インストールが進まないとき |
| [`faq-portal-environment-setup-and-usage.md`](faq-portal-environment-setup-and-usage.md) | 環境の意味・社員の役割・全体像 |
| [`faq-portal-http-keiri-faq.md`](faq-portal-http-keiri-faq.md) | **方式1** HTTP 配信・IIS／http-server・CORS と URL の対応 |
| [`faq-portal-internal-windows-setup.md`](faq-portal-internal-windows-setup.md) | **bat 一覧**（01〜08）・共有コピー |
| [`faq-portal-file-server-setup.md`](faq-portal-file-server-setup.md) | ファイルサーバ・プロキシの順序・FW・常時起動 |
| [`faq-portal-external-web-kintone.md`](faq-portal-external-web-kintone.md) | なぜプロキシか・フィールド・技術概要 |
| [`faq-apps-640-641.md`](faq-apps-640-641.md) | アプリ **640／641** の役割 |
| [`kintone-apps.md`](../kintone-apps.md) | アプリ ID 正本・640 フィールド |

**フォルダ**（リポジトリ内）

| パス | 内容 |
|------|------|
| `scripts/faq-windows/` | bat・`proxy-url.txt`・`deploy-share-path.txt`・`public-portal-url.txt`・`README.txt` |
| `scripts/faq-kintone-proxy/` | プロキシ・`.env` |
| `scripts/faq-portal-full.html` | ポータル本体ソース |

**正本インデックス（リポジトリ全体のルール追記）**: ルートの **`RULES-INDEX.md`**（日付行で FAQ ポータル関連を検索）。
