# 復元チェックポイント（最新）
<!-- AI 失敗 + 憲法・ルール更新案のみ -->

## AI 失敗（2026-06-09）
- 月列: ループ順表示 → 時系列崩れ（v3 修正）
- 年列 v4: 未実装 deploy（v5 修正）
- kintone-apps BUILD 不一致残存
- calc-test 未追随
- deploy 前 UI/正本ゲートがルール化されていなかった

## 憲法・ルール更新案（承認待ち）
| ID | 案 | 根拠失敗 |
|----|-----|----------|
| R1 | deploy 前 UI 文字列 grep ゲート | #2 |
| R2 | 月列ソート明文化 + test assert | #1 |
| R3 | kintone-apps BUILD 自動/sync ゲート | #3 |
| R4 | calc-core 変更は calc-test 同梱必須 | #4 |
| R5 | 締め文書は失敗+ルール案のみ（案件・明日 TODO 禁止） | 締め誤り |
| R6 | workdays deploy checklist runbook | #1〜4 |

詳細: `docs/reports/2026-06-09-evening-reflection.md`

**更新**: 2026-06-09 JST
