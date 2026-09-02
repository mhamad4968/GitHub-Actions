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

## 月次印刷（正）— 683 ブラウザ `window.print()`

- **印刷下枠（B5）**: 月次要約の直下。**【配線整理】** — 682 対応文に「配線整理」を含む行の暦月件数（月次要約の【土・日・祝日対応】とは別・重複しない）。

- **運用の正（CEO 2026-05-17）**: **683 一覧**から **ブラウザ印刷**（`window.print()`・`@media print` で **2 枚前後**を目標）。**一覧の「提出用PDF」ボタンは撤去済み**（2026-05-16）。**`npm run user683:monthly-pdf:serve` は廃止**（`package.json` から削除。`scripts/user683-monthly-pdf-serve.mjs` は履歴用に残置）。
- **`npm run user683:local-servers`**: **Claude 中継のみ**別ウィンドウ起動（PDF 配信は含まない）。
- **オフライン ReportLab PDF（任意）**: 提出物をファイルで欲しいときのみ CLI — `npm run user683:monthly-pdf -- --year YYYY --month M --out path.pdf`（レイアウト: **`docs/plans/2026-05-15-user683-monthly-pdf-layout-spec.md`**・手順: **`scripts/user683-monthly-pdf/README.md`**）。**kintone UI からは叩かない**。

### 印刷受入（2026-08-02 GO · S-PRINT-01〜03 / A1 / A3）

浜田または依頼者が「余白・見切れ・小さい」と指摘したら、**CSS を触る前**に:

| # | 確認 | 合格目安 |
|---|------|----------|
| 1 | 保存 PDF の **MediaBox** | **縦** ≈ **595×842** pt。**横** ≈ **842×595** pt なら向きが主因（間隔調整だけでは直らない） |
| 2 | 印刷ダイアログの **向き** | **縦**（CSS `@page` よりダイアログが勝つ） |
| 3 | **縮小／用紙に合わせる** | オフ推奨 |
| 4 | 2枚目の **最終行日付** | 見切れなし（例: `2026/07/31(金)`） |

実装上の禁止・必須（`customize/683/desktop.js`）:

- **禁止**: 印刷シートへの `transform: scale`、グラフ子の計測前 `height:100%` 先付け、page1/page2 での `overflow:hidden`＋`break-inside:avoid-page` 共有
- **必須**: 棒は `height:auto` で中身実測してからスケール、page2 は見切れより次頁送りを優先

### ナレッジ（MCP + git · M-RAG-01〜03）

| 格納先 | 識別子 |
|--------|--------|
| Memory MCP | エンティティ **`kintone-683-print-report`** |
| RAG MCP | **`note://2026-08-02/kintone-683-print-failures`** |
| git 正本（本ファイル＋運用） | 本節 / `docs/runbooks/cio-ops-2026-08-02-evening-improvements.md` |

**683 印刷を直す着手時**: RAG `query_documents`（例: `683 印刷 MediaBox`）または Memory `open_nodes` を **1回以上**。重要失敗を MCP に入れたら **同じターンで本 runbook にも要約をミラー**する（MCP 単独は参照漏れしやすい）。

**起動時自動参照（M-RAG-04）**: `data/cio-active-knowledge-needles.json` の針 `683-print-mediabox` が sessionStart／cold-start Phase 5d で注入される（`npm run cio:knowledge:wake-stamp` · digest `chat-sessions/knowledge-wake-latest.md`）。

### 旧運用（廃止・参照用）

2026-05-15〜16 にあった **localhost HTTP 配信＋`window.open` 提出用 PDF** は **使用しない**。接続拒否（`ERR_CONNECTION_REFUSED`）や **17886 `EADDRINUSE`** のトラブルシュート節は **不要**（serve 未起動が原因だったため）。

## デプロイ

```bash
npm run cio:preflight:683 -- --note "…"
npm run deploy:683
```

**Python 中継**（`scripts/user683_claude_relay.py` を起動している環境）では、中継のロジックや `RELAY_BUILD` を変えたリリースのあと **`user683_claude_relay.py` を再起動**する（`deploy:683` だけでは中継プロセスは更新されない）。

**正本**: `customize/683/desktop.js` の **`BUILD`** 行。台帳: `kintone-apps.md` の **683 行**。
