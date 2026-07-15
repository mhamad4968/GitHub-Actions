# 2026-07-15 — ops-day F1 dormancy 誤検知修正（AIチーム合議）

> **地位**: approved-changes（空き日 ops）· 浜田「不具合対応→改善をAIチーム合議で慎重に」  
> **憲法本文変更**: なし · **mcp.json DEL**: なし（Tier B 未着手）

## 問題（F1）

Cursor `agent-transcripts` は `user` / `assistant` / `turn_ended` のみで **tool call を保存しない**。  
そのため `scripts/check-mcp-dormancy.mjs` の transcript grep は、実戦呼出しても  
`context7` / `kintone-schema-mcp` / `git-history-mcp` を恒常 **dormant WARN** にしていた（計測欠陥）。

## AIチーム合議

| 役割 | 裁定 |
|------|------|
| DeepSeek | 案A（policy Map 追加）最短・AI自律可 · F2/F3 追加作業不要 |
| Kimi | 案A 賛成 · ledger(B)は本日不可 · Cは不可 |
| OpenRouter | 案A · Tier B DEL は F1 後 |
| **CIO** | **案A 採用** · DeepSeek Round2「mintlify DEL本日」は **浜田明示GOなしのため却下** |

## 実施（安全・最小）

1. 3 MCP を `DORMANCY_POLICY_EXEMPT_REASON` に追記（理由文付き）
2. `REPO_OVERLAY_SERVER_NAMES` 未登録分を **自動 exempt**（overlay 追加時の Map 漏れ再発防止）
3. C1: `docs/knowledge/debug-tips.md` に Set-Content 禁止
4. B1: §8.3 ゲート **dry（DELなし）** のみ

## 検証

```text
node scripts/check-mcp-dormancy.mjs   # dormant 0 期待
npm run mcp-status:refresh-usage
（B1）verify:mcp-deleted-refs / cio-mcp-registry / cursor-mcp-windows / …
```

## 触らない（本日）

- mintlify / cyber-news DEL · Cold profile · 736 live · 憲法 daytime · R44 checkpoint 強制 normalize
