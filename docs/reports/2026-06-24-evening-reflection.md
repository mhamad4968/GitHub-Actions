# 夕反省 — 2026-06-24

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: **浜田 GO 2026-06-24** — R736-01〜03 実装。R-MCP-01 は **削除**（意見交換のみ・憲法化しない）

---

## 1. 失敗（事実）

| # | 失敗 | 原因 |
|---|------|------|
| F1 | `deploy:736` が preflight guard で NG | Windows で `verify-kintone-live-schema` が OK 表示後に UV assertion crash（exit 非0） |
| F2 | Step2 完了後の commit/push が締めまで未実施 | deploy 成功後の即 commit 習慣の抜け |
| F3 | `checkpoint-latest.md` が 2026-06-22 のまま | 736 本番進捗の日次更新漏れ |
| F4 | 削除行 UI が一時 `<details open>` | 仕様（デフォルト折りたたみ）との乖離（当日修正済） |

---

## 2. 改善案（ミス削減）— 承認済み

| ID | 内容 | 種別 | 状態 |
|----|------|------|------|
| **R736-01** | Windows で schema verify が assertion crash する場合の手順（`SKIP_CIO_LIVE_SCHEMA_GUARD=1` は verify 手動 OK 後のみ） | TSB-039 / `windows-governance-ops.md` R53 | **GO・反映済** |
| **R736-02** | kintone customize deploy 成功後 **同一セッション内 commit** を締めチェックに追加 | `20-SESSION-REPORT-CHECKLIST.txt` R54 再確認 | **GO・既存 R54 で充足** |
| **R736-03** | `checkpoint-latest` 先頭に **当日アクティブアプリ（BUILD/rev）** を必ず1ブロック追記 | `checkpoint-handoff-template-v2.md` §4 | **GO・反映済** |

~~**R-MCP-01**~~ — **削除**（MCP 追加凍結の憲文化は不要。意見交換で終了）
