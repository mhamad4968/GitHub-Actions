# 683 ダッシュ — 週次要約まわりと提出用月次 PDF

> **目的（U2）**: **632** や **自動投入ジョブ**と **683 一覧の週次／月次 UI** を混同しない。**保存経路**と **印刷**を 1 箇所に集約する。

## データの正本（混線禁止）

| レーン | アプリ | 役割 |
|--------|--------|------|
| **ユーザサポート日次** | **682** | `record_date`・対応文・`day_total` など **入力の正本**。683 は **読取のみ**（REST）。 |
| **ユーザサポート682ダッシュ** | **683** | 集計 UI・**週次 4 ブロック＋月次**の textarea・**要約キャッシュ**（`user683_dash_ym` / `user683_week_1`〜`4` / `user683_month`）。**保存**は 683 の **「コメントを保存」**（PUT/POST）。 |
| **ニュース週次要約（LLM）** | **632** | `security-next-automation` の **別用途**（`docs/troubleshooting.md` の API トークン記述参照）。**683 の週次要約 UI とは無関係**。 |

## 保存経路（683）

1. **手動（ブラウザ）**: 683 一覧 → グラフ直下のテキスト → **コメントを保存** → 683 レコードへ反映。`sessionStorage`（`WEEK_NOTE_KEY` 等）と **GET で読み戻した kintone 値**の優先順は `customize/683/desktop.js` 内コメントどおり。
2. **自動（Node）**: `npm run user683:sync-summaries:*`（**先月締め**: `user683:sync-summaries:apply-prev-month`）→ **`docs/runbooks/user683-summary-job.md`**（定時の目安は **翌暦月 1 日・JST**）。Claude 用に **`ANTHROPIC_API_KEY`**（および任意で **`ANTHROPIC_MODEL`**）を `.env` に設定。

## 提出用月次 PDF（正）と 683 の「提出用PDF」ボタン

- **納品物の体裁**は **ReportLab 生成の 2 ページ PDF（両面1枚 A4 想定）**（レイアウト正本: **`docs/plans/2026-05-15-user683-monthly-pdf-layout-spec.md`**）。CLI: `npm run user683:monthly-pdf -- --year YYYY --month M --out path.pdf` または **`scripts/user683-monthly-pdf/README.md`**。
- **683 一覧**では **別ターミナルで `npm run user683:monthly-pdf:serve` を起動**（Windows では **`npm run user683:local-servers`** で PDF 配信と Claude 中継をまとめて別ウィンドウ起動可）したうえで **「提出用PDF」**を押す。**serve** が Python に渡す一時 PDF は **Windows 既定で `C:\tmp\_user683-monthly-serve-temp.pdf`**（`C:\tmp` は自動作成を試みる。別パスは `USER683_MONTHLY_PDF_SERVE_TEMP`）。**ブラウザは https の kintone から http の localhost へ `fetch` できない**ため、683 は **`window.open('http://127.0.0.1:17886/user683/monthly.pdf?year=…&month=…')`** で取得する（既定 URL は `window.USER683_MONTHLY_PDF_SERVE_URL` で上書き可）。ポートは環境変数 **`USER683_MONTHLY_PDF_PORT`**（serve スクリプト側）で変更する。

### 別タブで「このサイトにアクセスできません」「127.0.0.1 で接続が拒否されました」（`ERR_CONNECTION_REFUSED`）

1. **原因**: その PC 上で **`npm run user683:monthly-pdf:serve` が動いていない**（またはポートが違う／ファイアウォールでブロック）ため、`127.0.0.1:17886` に **待ち受けプロセスがいない**状態です。
2. **対処**: **リポジトリのルート**（`package.json` があるディレクトリ）で PowerShell を開き、次のいずれかを実行した **まま** ウィンドウを閉じずに 683 で「提出用PDF」を押す。
   ```powershell
   cd C:\Users\mhamada202408224\kintone-ai-lab
   npm run user683:local-servers
   ```
   （`user683:local-servers` は Claude 中継と PDF を別ウィンドウで同時起動。PDF のみなら `npm run user683:monthly-pdf:serve` のみでよい。）
   PDF 用のウィンドウに `[user683-monthly-pdf-serve] listening http://127.0.0.1:17886/...` と出れば配信 OK。
3. **動作確認**: ブラウザのアドレスバーに直接  
   `http://127.0.0.1:17886/user683/monthly.pdf?year=2026&month=5`  
   を開き、**PDF が返るか**（または Python／kintone 認証エラーがテキストで返るか）を見る。ここでも接続拒否なら **serve が起動していない**か **ポート番号の不一致**です（`.env` の有無は PDF 生成失敗時のメッセージ用で、**接続拒否そのもの**はサーバー未起動が主因）。
4. **ポートを変えた場合**: 起動前に `USER683_MONTHLY_PDF_PORT` を設定するか、kintone のコンソール等で **`window.USER683_MONTHLY_PDF_SERVE_URL`** を実際の URL に合わせる（683 の `desktop.js` 既定は **17886**）。

### ターミナルで `EADDRINUSE: address already in use 127.0.0.1:17886`

- **原因**: **17886 は既に別プロセスが使用中**（多くは **以前開いたままの `user683:monthly-pdf:serve` のターミナル**）。
- **対処 A**: そのターミナルに切り替え **Ctrl+C** で止めてから、もう一度 `npm run user683:monthly-pdf:serve`。
- **対処 B**: 止めずにそのまま使う（**二重起動は不要**。既に listening なら 683 の「提出用PDF」はそちらに届く）。
- **対処 C（別ポート）**: PowerShell で  
  `$env:USER683_MONTHLY_PDF_PORT=17887; npm run user683:monthly-pdf:serve`  
  とし、kintone 側で **`window.USER683_MONTHLY_PDF_SERVE_URL = 'http://127.0.0.1:17887/user683/monthly.pdf'`** を合わせる。
- **占有 PID の調査（任意）**: `netstat -ano | findstr :17886` の末尾列が PID。`taskkill /PID <pid> /F` は **自分が止めてよいプロセスか確認のうえ**で。

## デプロイ

```bash
npm run cio:preflight:683 -- --note "…"
npm run deploy:683
```

**Python 中継**（`scripts/user683_claude_relay.py` を起動している環境）では、中継のロジックや `RELAY_BUILD` を変えたリリースのあと **`user683_claude_relay.py` を再起動**する（`deploy:683` だけでは中継プロセスは更新されない）。

**正本**: `customize/683/desktop.js` の **`BUILD`** 行。台帳: `kintone-apps.md` の **683 行**。
