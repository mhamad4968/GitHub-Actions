# 浜田 GO — 2026-06-17 夕反省改善案（R41–R48 一括承認）

**承認日**: 2026-06-17  
**承認者**: 浜田（CEO）  
**契機**: VPN アカウント管理台帳 733/734 v1 クローズ後の夕反省（A–H 提案）

## 承認一覧

| ID | 元案 | 内容 | 状態 |
|----|------|------|------|
| R41 | A | 台帳 v1 クローズ標準チェックリスト runbook 化 | **GO — 実装** |
| R42 | B | `git-hooks/pre-push` を `git rev-parse --show-toplevel` 型に修正 | **GO — 実装** |
| R43 | C | DB+台帳ペアの bundle 前 ID 同期テンプレ（VPN 型） | **GO — 実装** |
| R44 | D | checkpoint `**Git**` 行を `cio:session:close-git` push 後に同期 | **GO — 実装** |
| R45 | E | kintone 設定レコード投入の共有ライブラリ | **GO — 実装** |
| R46 | F | SPEC テンプレ + UI 受入基準セクション | **GO — 実装** |
| R47 | G | クローズ済みレーン再開ゲート（pre-implement + bootstrap） | **GO — 実装** |
| R48 | H | Windows 向け governance ops runbook（PowerShell 標準形） | **GO — 実装** |

## 実装前レビュー

- **契機**: VPN v1 クローズで pre-push パス不具合・APP_DB 同期・checkpoint amend ループ・UI 後出しが顕在化
- **方針**: 次レーン横断の再発防止。既存 R19/R20/R36 と整合

## 正本

| 項目 | パス |
|------|------|
| クローズ checklist | `docs/runbooks/kintone-ledger-v1-closure-checklist.md` |
| SPEC テンプレ | `docs/plans/_TEMPLATE-kintone-ledger-spec.md` |
| Windows ops | `docs/runbooks/windows-governance-ops.md` |
| ID 同期 lib | `scripts/lib/kintone-sync-dash-db-id.mjs` |
| 設定レコード lib | `scripts/lib/kintone-post-settings-record.mjs` |
| checkpoint Git | `scripts/lib/cio-checkpoint-git-sync.mjs` |
