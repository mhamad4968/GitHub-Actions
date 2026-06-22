# 夕反省 — 2026-06-22

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: `docs/approved-changes/2026-06-22-rules-r741-hamada-go.md`（A〜D **GO — 実装**）

---

## 1. 失敗（事実）

| # | 失敗 | 原因 |
|---|------|------|
| F1 | 680 マスタ POST `CB_VA01` | `record` 単体（正は `records` 配列） |
| F2 | ACL API 失敗のまま v1 完了 | 手動 ACL runbook 未整備 |
| F3 | sync-db-id unchanged で exit 1 | 成功/未変更の区別なし |
| F4 | bundle lint NG | SheetJS `desktop.js` の eslint ignore 漏れ |
| F5 | deploy npm / preflight 未追加 | create 時の package.json 追記漏れ |
| F6 | app-ids.json 一時 null |  accidental revert・検証なし |
| F7 | R15 WARN（.rag 未同期） | deploy 後 rag mirror 未実行 |
| F8 | closures 未登録 | R19 クローズ手順の抜け |
| F9 | DeepSeek が PW 印刷を Critical | 仕様確定項表なし |

---

## 2. 改善案（ミス削減）— 承認済み・実装

| ID | 内容 | 状態 |
|----|------|------|
| R-741-01 | DB+Dash 10 項カーネル | **実装** |
| R-741-02 | closures 必須化 | **実装** |
| R-741-03 | AI レビュー仕様確定項表 | **実装** |
| R-741-04 | 締め dirty 分類 | **実装** |
| RB-741-01〜03 | runbook 3 本 | **実装** |
| S-741-01〜05 | verify / close 脚本 | **実装** |
| D-741-01〜02 | debug-tips / tmp gitignore | **実装** |
