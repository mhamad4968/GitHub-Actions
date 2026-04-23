# 🔧 cron 環境 PATH 統一 (TSB-013 系列再発予防の構造化)

**制定日**: 2026-04-23 (Thu)  
**実施予定日**: 2026-05 中 (5/22 前後 / M2-M5 と並行検討)  
**契機**: 浜田 2026-04-23 23:00 改善案 #8 承認 / TSB-013 v2 教訓の構造化

---

## 🎯 目的

cron 環境で `~/.local/bin` (uv / uvx 等) が PATH に含まれない問題 (TSB-013 v2) を、各スクリプト側の対症療法ではなく **crontab 自体の PATH 明示**で構造的に解決する。

## 📋 現状 (4/23 時点)

- crontab 各行に PATH=NVM_v24_bin が個別指定 (8 ジョブ全部)
- `~/.local/bin` (uv / uvx) は **含まれていない**
- TSB-013 v2 修復 = `health-check.mjs` 内で `env.PATH` 拡張 (対症療法)
- 別の uv 系 MCP / スクリプト追加時に同じ問題が再発するリスク

## 🆕 構造的修復案

### crontab 先頭に PATH 一括宣言

現状:
```cron
0 0 * * * /home/mhamada202408224/kintone-ai-lab/scripts/backup-mcp.sh ...
0 6 * * * cd ... && PATH=/NVM_v24_bin:/usr/bin:/bin /NVM_v24_bin/node ...
*/15 * * * * cd ... && PATH=/NVM_v24_bin:/usr/bin:/bin /NVM_v24_bin/node ...
... (各行で PATH 指定)
```

変更後:
```cron
PATH=/home/mhamada202408224/.local/bin:/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:/usr/bin:/bin
SHELL=/bin/bash

0 0 * * * /home/mhamada202408224/kintone-ai-lab/scripts/backup-mcp.sh ...
0 6 * * * cd ... && /NVM_v24_bin/node ...
... (各行 PATH 指定削除可能)
```

### 効果

- TSB-013 v2 の `health-check.mjs` 内 PATH 拡張コード = **不要に**
- 新規 cron / MCP 追加時に PATH 問題を考慮不要
- crontab 行数削減 + 可読性向上

## 🚦 段階導入

| 段階 | 内容 | 実施日 |
|---|---|---|
| 段階 1 (本文書) | crontab 先頭 PATH 宣言 + 各行 PATH 指定削除 | 5/22 (M2-M5 と並行検討) |
| 段階 2 | `health-check.mjs` 内 PATH 拡張コード削除 (対症療法削除) | 段階 1 + 1 ヶ月安定後 (6/22) |
| 段階 3 | 全 MCP の `command` を絶対 path 化 (§17-3 完全遵守) | 6/22+ |

## 🚨 リスク + 対策

| リスク | 対策 |
|---|---|
| crontab 編集ミスで全 cron 停止 | 編集前 `crontab -l > crontab-backup-<日付>.txt` で backup / 失敗時即 restore |
| PATH 順序が原因で別問題発生 | 編集後 24h 全 cron log 確認 (8 cron × 4h = 32 ログ + 96 wipe-guard ログ) |
| 浜田立ち会い必要性 | crontab 編集自体は sudo 不要 = autonomous 実施可 / 浜田報告のみ |

## ✅ 完了判定

- [ ] crontab backup 取得
- [ ] crontab 先頭 PATH 宣言追加
- [ ] 各行 PATH 指定削除
- [ ] 24h 全 cron log 確認 (8 cron 全部 ✅)
- [ ] `health-check.mjs` 内 PATH 拡張コード削除 (段階 2 / 6/22+)

## 🔗 関連
- 改善案 #8 (浜田 23:00 承認)
- TSB-013 v2 (`docs/troubleshooting.md`)
- §17-3 mcp.json command の絶対 path 標準化
