# `.cursor/rules/` — トピック索引（Phase 2-B）

**機械正本**: `data/cursor-rules-topic-index.json`  
**逆引き（自動）**: `RULES-INDEX.md` の「Cursor ルール逆引き」節 — `npm run rules:sync-mdc-index`  
**検証**: `npm run verify:cursor-rules-index` / `npm run verify:rules-index-section-mdc`  
**§↔mdc**: `npm run rules:sync-section-mdc`（`RULES-INDEX` 双方向節）  
**網羅版**: `constitution.mdc` は `npm run rules:regenerate-constitution` のみ（`verify:constitution-mdc-freshness`）

> **重要**: Cursor は **このディレクトリ直下の `*.mdc` のみ**をルールとして読み込む。**サブフォルダへ移動しない**（無効化リスク）。

---

## 読む順（新規 AI）

1. `mode-b-canonical.mdc` — 4AI・先頭4行（コピー禁止の単一窓）
2. `cio-constitution.mdc` — 唯一 `alwaysApply: true` 核
3. タスクに応じて下表のトピックから **1〜2 本**

---

## トピック一覧

| トピック | 代表 `.mdc` |
|----------|-------------|
| **CIO核・方式B** | `cio-constitution` / `mode-b-canonical` / `every-turn-rules-confirm` |
| **セッション** | `session-handoff` / `constitution-handoff-gate` / `cio-operating-loop` |
| **4AI・DeepSeek** | `deepseek-cursor-spec-division` / `deepseek-pre-edit-gate` |
| **MCP** | `mcp-server-use-triggers` / `mcp-tool-discipline` / `cursor-generate-image-assets` |
| **kintone** | `kintone*` / `constitutional-focus-kintone-customize` / `creation-timing-ask` |
| **ドメイン glob** | `constitutional-focus-yojitsu` / `constitutional-focus-github-workflows` 等 |

全ファイルの表は **`RULES-INDEX.md`**（自動生成節）を参照。

---

## 憲法読本との関係

| 層 | パス |
|----|------|
| § 正本 | `AGENTS.md` |
| 分割読本 | `docs/constitution/*.md` |
| 役割別ナビ | `docs/constitution/18-ai-team-read-map.md` |
| 階層地図 | `docs/constitution/00-rule-hierarchy.md` |
