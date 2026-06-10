# 4AI 自律統制インフラ（方式B・タスクA/B/C）

**制定**: 2026-05-21（CEO 浜田指令）  
**階層**: **第3 runbook**（憲法は `AGENTS.md` §50-3-11＝第1 / 本書＝手順）— [`docs/constitution/00-rule-hierarchy.md`](../constitution/00-rule-hierarchy.md)  
**前提**: Phase 1 方式B 正本（`AGENTS.md` §1-2-3-4・`part-A-constitution-kernel.md`）を **破壊せず拡張**する。

## 固定4AI体制

| # | 役割 | モデル |
|---|------|--------|
| ① | CIO | Opus 4.7 ベース / 必要時 **Opus 4.8**（§1-2-3-4-B） |
| ② | コード実務 | Composer 2.5（Subagent・diff のみ） |
| ③ | 長文レビュー | Kimi |
| ④ | 知恵袋 | DeepSeek（§50-3-8） |

## タスクA — Composer silent fallback インターロック

- **検知**: `Switched to Composer` + 正規表現 `Composer\s*2(?:\.5)?`
- **コマンド**: `npm run cio:guard:composer-interlock`
- **hook**: `.cursor/hooks/cio-four-ai-interlock.mjs`（`deploy:*` / `git commit` / `git push` 前）
- **失敗時**: exit 1 + `【警告】方式B違反：…`（`scripts/lib/cio-four-ai-governance.mjs`）

## タスクB — §50-3-8 証跡ゲート

- **対象**: `customize/**`・`*SPEC.md`・`deploy:*`・staged commit
- **コマンド**:
  - 検証: `npm run cio:guard:5038 -- --staged`
  - スタンプ: `npm run cio:guard:5038 -- --stamp --text "盲点…"` または `--skip "README誤字のみ"`
- **証跡**: チャットログ / `logs/cio-four-ai-governance/5038-stamp.json`（45分有効）

## タスクC — ゾンビ文書検査・prune

- **検査**: `npm run verify:mode-b-zombie-docs`
- **安全自動修正**: `npm run cio:prune:mode-b-zombie-docs`（`--apply`）
- **統合**: `verify:desktop-ai-emergency-sync` 末尾で連動

## タスク1 — MCP 台帳と4AI同期

- **正本**: `docs/mcp-status.md` §見送り・§方式B / `data/cio-mcp-four-ai-matrix.json` / `.cursor/rules/mcp-server-use-triggers.mdc` §4AI
- **検証**: `npm run verify:mcp-four-ai-alignment`
- **registry**: `npm run verify:cio-mcp-registry`（必須10名）

## タスク2 — 3階層索引外の prune

- **検出**: `npm run verify:rule-hierarchy-prune`
- **退避**: `npm run cio:archive:rule-orphans`（superseded プラン → `docs/plans/_archive/`）

## タスク3 — 先頭4行テンプレ重複禁止

- **単一窓**: `.cursor/rules/mode-b-canonical.mdc`
- **Linter 規律**: `.cursor/rules/mode-b-mdc-canonical-linter.mdc`
- **検証**: `npm run verify:mode-b-turn-head-canonical`（`.mdc` が4行フェンスをコピーしていないか）

## タスク4 — Composer MCP 監査（§50-3-11 第4ステップ）

- **正本**: `.cursor/rules/composer-mcp-audit-gate.mdc`
- **コマンド**: `npm run cio:guard:composer-mcp-audit -- --stamp --text "eslint=0 …"`
- **MCP**: `eslint-mcp` + `repo-tree`（registry 必須）

## タスク5 — 週末自律監査

- **Runbook**: `docs/runbooks/cio-weekend-autonomous-audit.md`
- **コマンド**: `npm run cio:weekend:autonomous-audit`

## タスク6 — 金曜 MCP usage 定例

- **Runbook**: `docs/runbooks/cio-friday-mcp-status-refresh-4ai.md`
- **コマンド**: `npm run mcp-status:refresh-usage`

## Phase 2-B — ルール論理分類（完了）

- **索引**: `.cursor/rules/README.md` + `data/cursor-rules-topic-index.json`
- **逆引き**: `npm run rules:sync-mdc-index`
- **RAG**: `npm run rag:mirror:canonical-docs`（`.rag/extra-docs/constitution/`）
- **検証**: `npm run verify:cursor-rules-index`

## Phase 2-C — §↔mdc 双方向 + constitution ゲート（完了）

- **双方向**: `npm run rules:sync-section-mdc` → `RULES-INDEX` + `data/rules-index-section-mdc-map.json`
- **一括**: `npm run rules:sync-index-all`
- **constitution.mdc**: `npm run rules:regenerate-constitution` のみ（`verify:constitution-mdc-freshness` / pre-commit）

## Phase 2-D — §↔ジャンル機械リンク（完了 2026-06-10）

- **カタログ**: `data/constitution-genre-catalog.json`
- **同期**: `npm run rules:sync-section-genre` / `npm run rules:sync-index-all`
- **検証**: `npm run verify:rules-index-section-genre`（`verify:cio-four-ai-governance` 内）
- **Desktop 28 番**: `npm run constitution:sync-genre-desktop-map`

### R7 — 憲法・索引変更後の Desktop 同期（浜田 GO 2026-06-10）

`docs/constitution/`・`RULES-INDEX.md`・`data/constitution-*`・`28-CONSTITUTION-GENRE-MAP.txt` を **同一セッションで commit する前**に:

```powershell
npm run desktop:sync-and-verify
```

（PowerShell では `;` で連結。`&&` は bash/WSL 専用 — **R8**）

push 前に `verify:desktop-ai-emergency-sync` が **OK** であること。`16-amendment-process.md` §57-6 周知 sync と同列。

## 一括検証

```bash
npm run verify:cio-four-ai-governance
npm run verify:cio-mcp-registry
npm run cio:mcp:env
```

## 緊急脱出

`SKIP_CIO_MODE_B_INTERLOCK=1`（浜田 GO + チャット理由 1 行必須）
