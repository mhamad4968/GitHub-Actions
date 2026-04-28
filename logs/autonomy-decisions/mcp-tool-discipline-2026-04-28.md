# MCP ツール運用ルール追加（リポ内 alwaysApply）

**日時**: 2026-04-28 JST（浜田依頼: ツール・MCP・ルールの自律向けメンテ）
**Tier**: A（`.cursor/rules` / `docs` / `RULES-INDEX` の追記のみ・kintone 書込なし）
**並列**: なし

## 実施

- 新規 **`.cursor/rules/mcp-tool-discipline.mdc`**（`alwaysApply: true`）: `call_mcp_tool` 前の **descriptor 必読**、`mcp_auth` 単独先行、同一目的では **MCP 優先**、browser MCP は **INSTRUCTIONS** 順守、MCP 追加時は **`docs/mcp-status.md` に 1 行追記**。
- **`RULES-INDEX.md`**（正本 + `.rag/extra-docs` ミラー）に索引行を追加。
- **`docs/mcp-status.md`**: 最終更新日と **2026-04-28 運用メモ** 節を追加（16 サーバ表の再カウントは未実施＝月次診断に委ねる）。

## 根拠

- Cursor システム側にも同趣旨の指示があるが、**リポをクローンした別環境・別モデル**でも読める **再宣言**として効く。
