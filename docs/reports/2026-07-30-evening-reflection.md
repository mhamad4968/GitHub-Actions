# 夕反省 — 2026-07-30

> スコープ正本: `docs/runbooks/evening-reflection-scope.md`  
> GO: `docs/approved-changes/2026-07-30-evening-reflection-hamada-go.md`（浜田全承認・反映済 `bb51067b`）

## 1. 失敗（事実）

| # | 事実 |
|---|------|
| 1 | checkpoint minChars 不足で cold-start bootstrap が止まった（修復が見出し欠けのみだった） |
| 2 | `alwaysApply: true` 超過で constitution-gates が赤だった |
| 3 | 756/Excel の金額話で、式を十分読まずに議論を広げた |
| 4 | ambient `last-tier=strict` でローカル selfcheck／evening が落ち、CI 緑だけ見て見逃した |
| 5 | 依頼者確認を長く出し、浜田側で4問に削る流れになった |

## 2. 改善案（ミス削減）— 承認済

### §2 行動
- A1 / A2 / A3（式 Read・ローカル parity・核3〜4問）

### §3 ルール・脚本
- S-CP-01 / S-CI-01 / S-RPT-01（済）／R-ASK-01（テンプレ化済）

### §体制・運用・憲法
- O-1〜O-5／C-1〜C-5／優先 O-1・O-2・C-1・C-2 — すべて GO 反映済（憲法本文は未変更）

## 3. 承認・反映

全 ID 承認 → runbook／薄い `.mdc`／push parity／CI paths／SPEC 先頭スタンプまで反映。次回レビュー目安 2026-08-13。
