# 運用改善 — 2026-08-02 夕反省 GO

> GO: `docs/approved-changes/2026-08-02-evening-reflection-hamada-go.md`  
> 憲法本文は変更しない。

## 印刷切り分け（O-PRINT-01 / A1）

印刷の「余白・見切れ・小さい」指摘では、CSS の前に次を書く:

1. **MediaBox** — 縦 ≈595×842 / 横 ≈842×595（ポイント）
2. **向き** — ダイアログが縦か横か
3. **縮小** — 「用紙に合わせる」等がオンか

横なのに縦レイアウトだけ直すのは禁止（本日の主失敗）。

## MCP ナレッジ運用（M-RAG-01〜03）

| 層 | 役割 | 限界 |
|----|------|------|
| **Memory** `kintone-683-print-report` | 短文の失敗パターン | 着手時に `open_nodes` / `search_nodes` しないと効かない |
| **RAG** `note://2026-08-02/kintone-683-print-failures` | 検索で想起 | クエリしないと効かない |
| **git runbook** | 正本・再起動後も残る | **必須ミラー**（MCP 単独禁止） |

**規則**: 重要失敗は RAG/Memory に入れたら **同じターンで runbook にも要約を書く**。  
**683 印刷着手時**: RAG または Memory を **1回以上**読む（M-RAG-02）。

### 起動時自動参照（M-RAG-04）

MCP はクエリしないと効かない弱点を、**必読WAKEと同型のスタンプ注入**で埋める。

| 部品 | パス |
|------|------|
| 針 registry | `data/cio-active-knowledge-needles.json` |
| スタンプ | `npm run cio:knowledge:wake-stamp` |
| sessionStart | `.cursor/hooks/session-start-autopilot.mjs` → 【ナレッジWAKE】＋ wakeHint |
| cold-start | Phase **5d** |
| digest | `chat-sessions/knowledge-wake-latest.md` |
| 検証 | `npm run verify:knowledge-wake-stamp` |

新失敗をアクティブに残すとき: registry に `wakeHint` + **必須** `gitPaths` を追加（MCP 単独の針は verify NG）。

## コード針（S-PRINT-02 / S-PRINT-03）

- 印刷グラフ: 実測は `height:auto` → 棒スケール。スロット合わせ前の `height:100%` 先付け禁止。
- page1 と page2 で `overflow:hidden` / `break-inside:avoid-page` を共有しない。

正本詳細: `docs/runbooks/user683-weekly-summary-and-print.md` の「印刷受入」。
