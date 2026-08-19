# Dash → 他アプリ REST 保存 — 着手チェック（2026-08-19）

> 夕反省 **A1 / A2 / #R1**。GO: `docs/approved-changes/2026-08-19-evening-reflection-hamada-go.md`  
> 買替 clone の必須確認は `pc-ledger-674-replace-clone-post.md` と併用。

customize や保存スクリプトに入る前に、次をこの順でやる。

| # | いつ | 何をする | 防ぐ失敗 |
|---|------|----------|----------|
| 1 | 照合・0件ヒット | 呼び元の検索条件を広げる**前に**、関連台帳の当該 1 件を GET し、空欄と `import_source` を見る | 715 照合widen だけで 674 `emp_id` 空を見逃す |
| 2 | POST/PUT 前、または保存必須エラー | **保存先アプリ**の form `required` を GET する（JS 必須とフォーム必須は別） | 714 `emp_id`/`user_name` required を見落として共有保存が落ちる |

A3（§50-3-8）は `docs/runbooks/deepseek-pre-edit-gate.md`。本ファイルは REST 保存の切り分けだけ。
