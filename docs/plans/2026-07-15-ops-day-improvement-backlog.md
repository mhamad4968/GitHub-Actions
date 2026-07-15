# 空き日 ops 改善バックログ — 2026-07-15

> 根拠: 浜田「運用・ルール・MCP 最適化を確認し改善案を出して進めたい」  
> 制約: 736 live 禁止 · 憲法 daytime 改定なし · MCP 削除は Tier B

## 棚卸し結果（事実）

| 検査 | 結果 |
|------|------|
| cio:mcp:env | SUMMARY OK 6/6 |
| health-check | ~97% · Memory 82% WARN級 · S12 死蔵3 |
| quick-health | OK（kintone 疎通 + wipe + rag mirror） |
| GHA 直近 | success |
| handoff integrity | GIT_HEAD_DRIFT → **export-handoff で解消済** |
| mcp-status refresh | **3行更新・commit 対象** |
| MCP 統廃合 spec | P0–P2/C1–C2 済 · **P3+ Tier B 未** |

## 改善案（優先度順）

### A — 本日自律で進める（着手中／済）

| ID | 内容 | 状態 |
|----|------|------|
| A1 | `cio:session:export-handoff` で bridge drift 解消 | ✅ |
| A2 | `mcp-status:refresh-usage`（S12 / 金曜定例前倒し） | ✅ |
| A3 | 死蔵3件に実戦1呼出（context7 / kintone-schema / git-history） | ✅ 呼出済（transcript反映は次 refresh） |
| A4 | `cio:env:enhance`（週次軽量・非 --full） | 提案・実行可 |
| A5 | `verify:mcp-deleted-refs` + `cio:mcp:gate` 健全性確認 | 提案・実行可 |
| A6 | R44 checkpoint Git off-by-one 正規化 | 低 · 任意 |

### B — 浜田 GO 後（mcp.json 変更あり）

| ID | 内容 | 備考 |
|----|------|------|
| B1 | MCP 統廃合 **P2.5 SCR**（DEL 前ゲート全緑） | Tier A寄り |
| B2 | **P3 DEL-1 mintlify** | Reload Window 必須 · △9–11 |
| B3 | **P4 cyber-news disabled→DEL-2** | 月次 security dry-run 先行 |
| B4 | **P5 Cold profile** 6グループ | intent 時 ON |

### C — ルール／記録（憲法本文は触らない）

| ID | 内容 |
|----|------|
| C1 | PowerShell `Set-Content` による handoff 文字化け再発防止 — 編集は node スクリプト固定（debug-tips 追記） |
| C2 | `report:pipeline-status` PENDING 残留の掃除 runbook 1行 |
| C3 | H9 metrics 継続蓄積（`cio:team-ops-metrics` を空き日に1回）— 7/25 判定準備 |

### 触らない

- 736 customize / deploy（明日 implement）
- 688 / 677–679 / SKYSEA
- AGENTS.md 昼間改定
