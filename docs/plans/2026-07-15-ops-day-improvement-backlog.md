# 空き日 ops 改善バックログ — 2026-07-15

> 根拠: 浜田「運用・ルール・MCP 最適化を確認し改善案を出して進めたい」  
> 制約: 736 live 禁止 · 憲法 daytime 改定なし · MCP 削除は Tier B

## 棚卸し結果（事実）

| 検査 | 結果 |
|------|------|
| cio:mcp:env | SUMMARY OK 6/6 |
| smoke:quiet | **17/17 OK**（2026-07-15 再確認） |
| health-check | ~97%（Memory WARN級は許容） |
| GHA 直近 | success |
| handoff / R44 | OK（off-by-one 許容） |
| MCP 統廃合 | P3 mintlify **CLOSED** · P4/P5 は再GO待ち |

## 改善案（優先度順）

### A — 本日自律で進める（着手中／済）

| ID | 内容 | 状態 |
|----|------|------|
| A1 | `cio:session:export-handoff` で bridge drift 解消 | ✅ |
| A2 | `mcp-status:refresh-usage`（S12 / 金曜定例前倒し） | ✅ |
| A3 | 死蔵3件に実戦1呼出（context7 / kintone-schema / git-history） | ✅ · F1 修正で恒常誤検知解消 |
| A4 | `cio:env:enhance`（週次軽量・非 --full） | ✅ |
| A5 | `verify:mcp-deleted-refs` + `cio:mcp:gate` 健全性確認 | ✅ |
| A6 | R44 checkpoint Git 同期（#D-R44-RECOVERY） | ✅ 2026-07-15 |

### B — 浜田 GO 後（mcp.json 変更あり）

| ID | 内容 | 備考 |
|----|------|------|
| B1 | MCP 統廃合 **P2.5 SCR**（DEL 前ゲート全緑） | ✅ dry 2026-07-15（DELなし） |
| B2 | **P3 DEL-1 mintlify** | ✅ 実削除済（7/11）· 浜田追認 GO 2026-07-15 · 台帳/triggers/再注入防止 |
| B3 | **P4 cyber-news DEL-2** | ✅ 実削除済（7/11）· 浜田正式クローズ GO 2026-07-15 |
| B4 | **P5 Cold profile** 6グループ | **NO-GO 本日**（736前 · 合議） |

### C — ルール／記録（憲法本文は触らない）

| ID | 内容 |
|----|------|
| C1 | PowerShell `Set-Content` による handoff 文字化け再発防止 — 編集は node スクリプト固定（debug-tips 追記） | ✅ |
| C2 | `report:pipeline-status` PENDING 残留の掃除 | ✅ SUPERSEDED + debug-tips 手順追記 |
| C3 | H9 metrics 継続蓄積（`cio:team-ops-metrics`）— 7/25 判定準備 | ✅ skip5038=0% · liteUsage=0% |
| C4 | mcp-status 現行バナー + 安全フォローボード + Win mcp 再注入ガード | ✅ 2026-07-15 合議 |

## 発見（本日）

| ID | 内容 | 推奨 |
|----|------|------|
| F1 | Cursor `agent-transcripts` は **tool call を保存しない** → dormancy 誤検知 | ✅ policy exempt + overlay 自動免 · 記録 `docs/approved-changes/2026-07-15-ops-f1-dormancy-false-positive-fix.md` |
| F2 | `report-pipeline-current` が `in_progress` 残留 | ✅ SUPERSEDED 掃除済 |
| F3 | checkpoint R44 Git 多数遅れ | ✅ A6 RECOVERY stamp · off-by-one 正常化 |

### 触らない

- 736 customize / deploy（明日 implement）
- 688 / 677–679 / SKYSEA
- AGENTS.md 昼間改定
