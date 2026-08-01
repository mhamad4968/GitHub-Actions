# 夕反省改善案 GO — 2026-08-01

- **承認日**: 2026-08-01（夜）JST  
- **承認者**: 浜田（CEO）  
- **有効**: 即時〜次回夕反省で見直し（期限切れなし。次回レビュー目安: 2026-08-15）  
- **対象**: A1–A3 / S-DEDUP-01 / S-CAT-01 / S-ORDER-01 / R-EXCEL-PLACE-01 / O-756-01 / O-756-02 / O-GHA-01 / C-EXCEL-01 / C-EXCEL-02 / M-1 / M-2 / M-3  
- **判定**: **すべて承認** → 安全かつ確実に反映  
- **憲法本文**: **変更しない**（運用・runbook・薄い `.mdc`・脚本・SPEC 注記）

## 承認 ID → 状態

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | 並び替え前に工事がらみ名称枠とコード付き枠を分ける | 本GOで規則化 |
| **A2** | 新規枠後に同一コード二重を目視 | 本GO |
| **A3** | 保安系は区分も確認してから ENSURE | 本GO |
| **S-DEDUP-01** | 同一コード重複は表示 omit＋assert | **済**（実装）＋本GOで針テスト |
| **S-CAT-01** | ENSURE 区分はコード表 resolve＋assert | **済**（実装）＋本GOで針テスト |
| **S-ORDER-01** | 配置順を SPEC／コメントに固定 | 本GO |
| **R-EXCEL-PLACE-01** | コード番号順だけで名称枠を押し下げない | 本GO |
| **O-756-01** | 枠追加受入ミニチェック（費目／種別／区分／二重／並び） | 本GO |
| **O-756-02** | 連続枠は 1枠=1 deploy（まとめは明示時のみ） | 本GO |
| **O-GHA-01** | 日終わり GitHub で当日 tip 失敗 run なしを1行 | 本GO |
| **C-EXCEL-01** | #R-EXCEL-UI-09 に区分 resolve 注記 | 本GO |
| **C-EXCEL-02** | 756 UI 夕反省は §体制を空にしない | 本GO |
| **M-1** | 連続枠追加は repo Grep 優先 | 本GO |
| **M-2** | GitHub 確認は `gh` 正 | 本GO |
| **M-3** | sequential-thinking は仮説1＋根拠行まで | 本GO |

## 反映物

| 成果物 | パス |
|--------|------|
| GO 記録 | `docs/approved-changes/2026-08-01-evening-reflection-hamada-go.md` |
| 正本 runbook | `docs/runbooks/cio-ops-2026-08-01-evening-improvements.md` |
| 薄い運用規則 | `.cursor/rules/cio-ops-2026-08-01-evening-improvements.mdc` |
| 夕反省 | `docs/reports/2026-08-01-evening-reflection.md` |
| SPEC | `docs/plans/2026-07-31-756-cost-mgmt-excel-table-structure-spec.md` |
| 受け入れ | `docs/runbooks/jikkou-yosan-v2-chrome-accept-checklist.md`（#12） |
| 針テスト | `scripts/test-evening-improvements-2026-08-01.mjs` |

## 検証

```bash
npm run test:evening-improvements-2026-08-01
npm run jikkou-yosan:v2-phase4d:test
npm run verify:evening-reflection-scope -- --file docs/reports/2026-08-01-evening-reflection.md
npm run desktop:sync-and-verify
```
