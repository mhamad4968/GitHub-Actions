# 683 ダッシュ — Claude API 中継（段階 C）

## いちばん簡単（HTTPS の kintone 683・在宅）

リポのルートで **1 コマンド**（中継の起動と、ブラウザ用 URL の表示がまとまります）。

```bash
npm run user683:claude-relay:public
```

1. ターミナルに出る **`?user683_claude_relay=…`（または `USER683_KINTONE_683_URL` 設定時は開く用のフル URL）** をコピーする  
2. **683 一覧を表示しているブラウザ**で、アドレス欄の末尾に貼り付けて **Enter**（クエリはカスタマイズ JS が取り込み後にアドレス欄から外します）。**F12 コンソールは不要**です。  
3. **「生成」**を押す  
4. 要約生成が終わったらターミナルで **Ctrl+C**（トンネルを止める）

**任意（フル URL を毎回出したいとき）**: リポの `.env` に **683 一覧の完全 URL（末尾スラッシュなし）**を `USER683_KINTONE_683_URL` として書くと、`npm run user683:claude-relay:public` が **クリック用の 1 行**を表示します。

### 組織一括（各ユーザが `?user683_claude_relay=` を貼らない）

`customize/683/desktop.js` の **`USER683_CLAUDE_RELAY_ORG_DEFAULT`** に、全員共通の **HTTPS** 中継 URL（`…/user683/summarize`）を **1 行だけ**入れて `deploy:683` すると、未設定端末でもその URL が使われます。**優先順**: `window.USER683_CLAUDE_RELAY_URL` → `sessionStorage` → **本定数** → `window.USER683_ORG_CLAUDE_RELAY_URL`（別 JS から注入する場合）。**中継を立てずに要約だけ見る／手で直す**運用は **`user683-summary-job.md`** のバッチ同期で足ります。

**すでに** `npm run user683:claude-relay` を別ターミナルで動かしている場合は、トンネルだけ:

```bash
npm run user683:claude-relay:public -- --no-spawn
```

**注意**: 表示 URL は **インターネットに一時公開**されます（`localtunnel` / loca.lt）。機密を含むコーパスを避け、使い終わりに必ず Ctrl+C で止めてください。初回アクセスで loca.lt の確認ページが出ることがあります（ブラウザで一度開いてから再試行）。**待機で失敗**するときはポート占有・ファイアウォールを確認し、PowerShell で `Test-NetConnection -ComputerName 127.0.0.1 -Port 17884` が `TcpTestSucceeded : True` か確認してください（スクリプトは Windows でこれと同等の判定を併用します）。

## `deploy:683` のあと（Python 中継）

`npm run cio:preflight:683 -- --note "…"` → `npm run deploy:683` は **683 の `desktop.js` のみ**を本番 kintone に反映します。**このリポの `user683_claude_relay.py` を別プロセスで動かしている**場合、中継側の **プロンプト・`RELAY_BUILD`・POST 解釈**を更新したリリースでは、**そのマシンで中継プロセスを再起動**してください（再起動しないとブラウザからの週次／月次生成が旧コードのままです）。

**CIO 報告テンプレ**（`desktop.js` を触っていないターン）: `docs/runbooks/user683-summary-job.md` の「変更の種類と CIO 向け報告の書き方」節の引用ブロックをそのまま使ってよい。

## すぐ直す（「Claude 中継 URL が未設定」／`Failed to fetch`／`loopback`）

**HTTPS の本番 kintone**（`https://....cybozu.com`）から **`http://127.0.0.1:17884`** へは、ブラウザ（Chromium）が **Private Network Access** により **ループバックへの fetch を拒否**します（コンソールに `CORS policy` と `loopback address space` と出る。**中継側の CORS を直しても解消しません**）。**在宅でも** PC 上の **HTTPS トンネル**で公開した URL を `window.USER683_CLAUDE_RELAY_URL` に渡してください（下記「本番 HTTPS」）。

**Windows（まとめて別ウィンドウで起動）**: リポルートで `npm run user683:local-servers` または **`scripts\windows\user683-start-local-servers.bat` をリポ内のまま実行**（**Claude 中継 17884** と **月次 PDF 配信 17886** の 2 窓＋コンソール用 1 行を表示）。**デスクトップに bat をコピーしただけではリポが分からない**ため、先に `cd` でリポへ移動するか、ユーザー環境変数 **`KINTONE_AI_LAB_ROOT`** にリポのフルパスを設定してください。

### 本番 HTTPS（在宅でも可・社内中継は不要）

**推奨**: 冒頭の **`npm run user683:claude-relay:public`**（`localtunnel` で HTTPS URL を表示）。次は **手動**で cloudflared / ngrok を使う場合です。

ブラウザの制約のため、**自宅の PC だけ**で次を満たす必要があります: 中継は `127.0.0.1:17884` のまま動かし、**別プロセス**でそのポートを **インターネット上の HTTPS URL** に公開する（社内 VPN や社内プロキシは不要）。

1. PC で `npm run user683:claude-relay` を起動したままにする  
2. **別ターミナル**でクイックトンネル（いずれか。利用規約・情報の取り扱いに注意）  
   - **Cloudflare Tunnel（cloudflared）**: [cloudflared のインストール](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) のあと、例:  
     `cloudflared tunnel --url http://127.0.0.1:17884`  
     表示された **`https://....trycloudflare.com`（例）** をメモする（セッション中だけ有効なことが多い）。  
   - **ngrok** 等でも同様に `17884` を HTTPS で公開できる  
3. 683 一覧を開いた **DevTools コンソール**で（ホスト部分を手順 2 の URL に合わせる）:

   `window.USER683_CLAUDE_RELAY_URL = 'https://（トンネルが表示したホスト）/user683/summarize'; location.reload();`

**注意**: トンネル URL は第三者が推測しにくくても **インターネットに晒される**ため、生成するコーパスに機密を含めない・作業後にトンネルを止める、など運用で抑えること。

### HTTP の kintone／ローカルだけ（従来）

1. **中継プロセス**を PC で起動: `npm run user683:claude-relay`（既定 **17884**。別ターミナルで動かしたままにする）
2. **ブラウザに URL を渡す**（どちらか）  
   - **推奨**: リポで `npm run user683:claude-browser-url:print` → 表示された **`sessionStorage.setItem(...)` 1 行**を、kintone **683 一覧を開いた状態**の DevTools コンソールに貼り付け → 再読込  
   - **手入力**: コンソールで  
     `sessionStorage.setItem('user_support_683_claude_relay_url', 'http://127.0.0.1:17884/user683/summarize'); location.reload();`

## 目的

kintone 683 一覧の **月次・週次 AI 要約を生成** ボタンから、**ローカルまたはトンネル先の HTTP(S) 中継**経由で **Anthropic Claude API** に本文を渡し、要約を textarea に反映する（**kintone 保存は「コメントを保存」**で別途 PUT）。

## 前提

- kintone **本番は HTTPS**。公開オリジンから `http://127.0.0.1` / `localhost` への fetch は、**混在コンテンツ**に加え、Chromium の **Private Network Access（ループバック禁止）**で失敗します。**在宅でも** PC 上の **cloudflared / ngrok 等の HTTPS トンネル**で `17884` を公開し、その **`https://.../user683/summarize` を `window.USER683_CLAUDE_RELAY_URL` に設定**する（社内専用中継は必須ではない）。
- **`.env`** に `ANTHROPIC_API_KEY`（必須）。任意で `ANTHROPIC_MODEL`（既定 `claude-sonnet-4-20250514`）。
- **CORS**: 683 の `fetch` は **`Content-Type: text/plain`**（本文は JSON）で送り、loca.lt 等で **OPTIONS が失敗しにくい**ようにしている。中継は **`Access-Control-Allow-Origin`** にブラウザの `Origin` を返す（`USER683_CORS_ORIGIN` で固定上書き可）。

## 中継の起動（リポ）

**Windows（Claude ＋ PDF 配信をまとめて）**: `npm run user683:local-servers`（`scripts/windows/user683-start-local-servers.bat` と同等）。

```bash
npm run user683:claude-relay:preflight
npm run user683:claude-relay
```

別ターミナルで疎通:

```bash
npm run user683:claude-relay:probe
```

ブラウザ用 sessionStorage 1 行（683 一覧の DevTools コンソールへ）:

```bash
npm run user683:claude-browser-url:print
```

既定: `http://0.0.0.0:17884`、POST **`/user683/summarize`**。

| 変数 | 既定 | 説明 |
|------|------|------|
| `USER683_RELAY_PORT` | `17884` | 待受ポート |
| `USER683_CORS_ORIGIN` | （未設定時はリクエストの `Origin` をそのまま返す。固定するなら `https://....cybozu.com`） | CORS |
| `USER683_CLAUDE_TIMEOUT_MS` | `120000` | API タイムアウト |

## ブラウザ側 URL 設定

`customize/683/desktop.js` は `sessionStorage` キー **`user_support_683_claude_relay_url`** または `window.USER683_CLAUDE_RELAY_URL` を参照する。**683 一覧 URL のクエリ** `?user683_claude_relay=`（短縮 `u683cr`）でも同じ URL を渡せる（HTTPS トンネル想定・コンソール不要）。

開発 PC の例（HTTP 直・混在コンテンツに注意）:

```javascript
sessionStorage.setItem(
  'user_support_683_claude_relay_url',
  'http://127.0.0.1:17884/user683/summarize',
);
location.reload();
```

## POST 形式（抜粋）

- 月次: `{ "action": "month", "month": { "corpus": "…", "prevYmKey": "2026-04", "prevMonthSummary": "…", "currentYmKey": "2026-05" } }` → `monthSummary`（`prevYmKey` / `prevMonthSummary` / `currentYmKey` は任意。無い場合は前月要約なし扱いで合成する。683 ブラウザ生成は自動付与）
- 週次: `{ "action": "week", "week": { "corpus": "…" } }` → `weekSummary`

レスポンスヘッダ **`X-Relay-Build`** で中継ビルドを確認できる。

## 関連

- **HTTPS kintone 向け 1 コマンド**: `scripts/user683-claude-relay-with-public-url.mjs`（`npm run user683:claude-relay:public`）
- 実装: `scripts/user683_claude_relay.py`
- 要約キャッシュ PUT: `docs/runbooks/user683-summary-job.md`
- レガシー Ollama: `docs/runbooks/user683-ollama-relay.md`
