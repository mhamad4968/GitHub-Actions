# 夕反省改善案 GO — 2026-07-30

- **承認日**: 2026-07-30（夕）JST  
- **承認者**: 浜田（CEO）  
- **有効**: 即時〜次回夕反省で見直し（期限切れなし。次回レビュー目安: 2026-08-13）  
- **対象**: 体制・運用5点／ルール・憲法5点／優先 O-1・O-2・C-1・C-2／改善案 A1–A3・§3 全件  
- **判定**: **すべて承認** → 安全かつ確実に反映  
- **憲法本文**: **変更しない**（運用・runbook・薄い `.mdc`・脚本・CI paths）

## 承認 ID → 状態

| ID | 内容 | 状態 |
|----|------|------|
| **S-CP-01** | checkpoint minChars 自動補修 | **済** `d5c9287f` |
| **S-CI-01** | alwaysApply 許可は憲法2本のみ | **済** `d5c9287f` |
| **S-RPT-01** | ambient strict は報告ゲートのみ＋テスト hermetic | **済** `c8bbbfa1` |
| **A1** | 計算・集計は式／入力セル Read 後に答える | 本GOで規則化 |
| **A2** | GitHub確認はローカル CI 同系も回す | 本GO（O-1） |
| **A3** / **R-ASK-01** / **O-2** | 依頼者確認は核3〜4問 | 本GO |
| **O-1** | push 前ローカル parity（smoke全量ではない） | 本GO |
| **O-3** | WAKE/bootstrap 失敗＝当日最初の障害 | 本GO |
| **O-4** | 仕様議論は正本1＋未決3 | 本GO |
| **O-5** | 完了済を GO待ちに戻さない | 本GO（既存案内の再固定） |
| **C-1** | alwaysApply 新設＝説明必須＋同PR integrity | 本GO |
| **C-2** / **#CON-01** | Excel・計算式も Read 根拠必須 | 本GO |
| **C-3** | ambient 状態に検査を掛けすぎない | 本GO（S-RPT-01 と同旨） |
| **C-4** | 検査脚本変更時は workflow paths を踏む | 本GO |
| **C-5** | 夕反省に「体制・憲法」節（§3と分離） | 本GO |

## 反映物

| 成果物 | パス |
|--------|------|
| 正本 runbook | `docs/runbooks/cio-ops-2026-07-30-evening-improvements.md` |
| 依頼者核質問 | `docs/runbooks/requester-core-questions-template.md` |
| 夕反省スコープ | `docs/runbooks/evening-reflection-scope.md` |
| 薄い運用規則 | `.cursor/rules/cio-ops-2026-07-30-evening-improvements.mdc` |
| push ローカル parity | `data/cio-app-quality-gates.json` + `npm run cio:pre-push-local-parity` |
| CI paths | `.github/workflows/constitution-gates.yml` |
| 針テスト | `scripts/test-evening-improvements-2026-07-30.mjs` |

## 検証

```bash
npm run test:evening-improvements-2026-07-30
npm run cio:pre-push-local-parity
npm run verify:ci-rule-integrity
npm run cio:selfcheck:test
```
