# 浜田 GO — 2026-06-30 夕反省改善案（595 同期・一括反映 — A + R/S/D 一括承認）

**承認日**: 2026-06-30  
**承認者**: 浜田（CEO）  
**契機**: 595→674 同期・751 更新・一括反映ボタン セッション夕締め反省（F1–F6）

## 承認一覧 — 行動（§2）

| ID | 内容 | 状態 |
|----|------|------|
| A-0630-01 | kintone 同期不具合は監査スクリプト or dry-run を先に実行してから原因を述べる | **GO** |
| A-0630-02 | ログ・メタは社員マスタに置かない（697 + localStorage のみ） | **GO** |
| A-0630-03 | UI は進捗＝短い状態、詳細ログ＝1 行（役割分離） | **GO** |
| A-0630-04 | skip deploy 時は TSB-039 1 行 + schema OK 出力貼付必須 | **GO** |
| A-0630-05 | deploy 成功ターン or 機能区切りでこまめ commit（締め前一括禁止） | **GO** |

## 承認一覧 — ルール・脚本（§3）

| ID | 内容 | 状態 |
|----|------|------|
| R-0630-01 | 595 一括反映ログは 697 `bulk_downstream_595_log` のみ（社員行禁止 runbook） | **GO — 実装** |
| R-0630-02 | Desktop `＃重要確認事項.txt` 廃止 — sync/bootstrap/hooks から除去 | **GO — 実装** |
| S-0630-01 | 不具合時は `pc-ledger:audit-595-674-gaps` を先に実行 | **GO — 実装** |
| S-0630-02 | TSB-039 に 595 deploy UV crash 事例追記 | **GO — 実装** |
| D-0630-01 | mailing-list Excel 正本を `メーリングリスト一覧更新2.xlsx` に env 既定化 | **GO — 実装** |

## 正本

| ID | パス |
|----|------|
| R-0630-01 | `docs/runbooks/pc-ledger-595-674-sync.md` |
| R-0630-02 | `scripts/sync-session-starter-to-desktop.mjs`, `.cursor/hooks/cio-desktop-path-guard.mjs`, `.cursor/rules/cio-constitution.mdc`, `.cursor/rules/every-turn-rules-confirm.mdc` |
| S-0630-01 / S-0630-02 | `docs/troubleshooting.md` |
| D-0630-01 | `scripts/lib/mailing-list-kintone.mjs` |
| A-0630-* | 本ファイル + `docs/reports/2026-06-30-evening-reflection.md` §5 |
