# 夕反省 — 2026-06-24

正本: `docs/runbooks/evening-reflection-scope.md`  
承認: **承認待ち**（R736-01〜03・R-MCP-01 は明日判断）

---

## 1. 失敗（事実）

| # | 失敗 | 原因 |
|---|------|------|
| F1 | `deploy:736` が preflight guard で NG | Windows で `verify-kintone-live-schema` が OK 表示後に UV assertion crash（exit 非0） |
| F2 | Step2 完了後の commit/push が締めまで未実施 | deploy 成功後の即 commit 習慣の抜け |
| F3 | `checkpoint-latest.md` が 2026-06-22 のまま | 736 本番進捗の日次更新漏れ |
| F4 | 削除行 UI が一時 `<details open>` | 仕様（デフォルト折りたたみ）との乖離（当日修正済） |

---

## 2. 改善案（ミス削減）— 承認待ち

| ID | 内容 | 種別 |
|----|------|------|
| **R736-01** | Windows で schema verify が assertion crash する場合の runbook 1 行（`SKIP_CIO_LIVE_SCHEMA_GUARD=1` は verify 手動 OK 後のみ） | runbook / TSB |
| **R736-02** | kintone customize deploy 成功後 **同一セッション内 commit** を締めチェックに追加 | 締め儀式 |
| **R736-03** | `checkpoint-latest` 先頭に **当日アクティブアプリ（BUILD/rev）** を必ず1ブロック追記 | checkpoint 運用 |
| **R-MCP-01** | MCP 追加は **意見交換→浜田 GO→導入**。現状凍結を AGENTS または runbook に1段落（Memory/Serena/Excalidraw 見送り記録） | 憲法補足 |
