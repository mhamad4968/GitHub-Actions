# 空き日 ops — 安全フォローボード（2026-07-15）

> AIチーム合議（DeepSeek / Kimi / OpenRouter）· **安全性・確実性最優先**  
> 浜田「その他改善があれば合議しながら慎重に」

## 本日実施（安全Tier · コード破壊なし / 予防1本のみ）

| # | 内容 | リスク |
|---|------|--------|
| 1 | `docs/mcp-status.md` 先頭に **現行ステータスバナー**（歴史スナップは改竄しない） | 極低 |
| 2 | 本ボード + backlog 更新（NO-GO 明示） | 極低 |
| 3 | debug-tips: report PENDING → SUPERSEDED 手順 | 極低 |
| 4 | `verify-cursor-mcp-windows`: mintlify / cyber-news **再注入 fail** | 低（防御） |

## NO-GO（本日・明示再GOまで）

| 項目 | 理由 |
|------|------|
| **P5 Cold profile 適用** | mcp.json 大量 `disabled` · Reload 必須 · **736 前に危険**（合議 NO） |
| **H9 / △2 早期判定** | reviewDate=**2026-07-25** · early GREEN **禁止**（R2 で Kimi/OpenRouter 初推しを CIO 却下） |
| **AGENTS.md / constitution 昼間改定** | 憲法 daytime 原則禁止 |
| **hooks 改変** | 報告パイプライン退行リスク |

## 次回（736 後など）

1. **P5 Cold** — `cio:mcp:profile -- --dry-run` 先行 · 適用は別セッション
2. **H9 / △2** — **2026-07-25** のみ

## 検証コマンド

```powershell
npm run verify:cursor-mcp-windows
npm run verify:mcp-deleted-refs
npm run smoke:quiet
```
