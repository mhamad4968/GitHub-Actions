# 7月振り返り運用改善 — 浜田 GO（2026-08-02）

**GO**: 浜田 2026-08-02 — 短文提案 1〜10 を AIチーム確認のうえ安全に進めてよい。  
**Skysea 準備材料**: 明日着手（本 runbook 対象外）。  
**憲法本文**: 変更しない（薄化はカード／ゲート／スクリプトで）。

## AIチーム合意（安全順）

| 優先 | 提案 | 今日の扱い |
|------|------|------------|
| P0 | 6 SKYSEA朝チェック日付ゲート | `scan-plans` で `after=` 対応 |
| P0 | 2 checkpoint鮮度 | LIVE BUILD/rev を凍結ゾーンへ同期 |
| P0 | 4 完了再掲禁止 | 必読カード＋既存 O-5 を入口に固定 |
| P0 | 1 必読薄化 | `MANDATORY-READ-CARD.md` 追加（削除なし） |
| P1 | 7 MCP無効化 | `accessibility-scanner` のみ `disabled`。**ppt は neverDisable のため見送り** |
| P1 | 8 kintone使い分け1行 | `mcp-server-use-triggers.mdc` |
| P1 | 9 デザインMCP留置 | 四半期再判定をカード／台帳に明記 |
| P2 | 3 R63硬化 | 既存 guard で十分 → 追加変更は次回 |
| P2 | 5 暫定フラグ可視化 | 次セッション（UI／BUILD帯） |
| P2 | 10 4h直前自動退避 | 次セッション（clock-watch 拡張） |

## 受け入れ

- `node scripts/scan-plans.mjs` で SKYSEA L120 が **8/3 未満は出ない**
- checkpoint 凍結ゾーンの 756 BUILD/rev が `cio-live-builds` と一致
- `accessibility-scanner.disabled === true`（ユーザー `~/.cursor/mcp.json`）
- 憲法・RULES 本文の大規模削除なし

## 追補（2026-08-02 セッション締め）

- `npm run audit:kintone-app-inventory:write` — 基準更新（756/757/758/769/770 取り込み）
- `verify:kintone-apps-live-build-sync --all` → **OK 59/59**（detail fileKey 挿入・削除済スキップ・garble検知修正）
