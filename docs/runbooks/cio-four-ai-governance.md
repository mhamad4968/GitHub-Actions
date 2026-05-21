# 4AI 自律統制インフラ（方式B・タスクA/B/C）

**制定**: 2026-05-21（CEO 浜田指令）  
**階層**: **第3 runbook**（憲法は `AGENTS.md` §50-3-11＝第1 / 本書＝手順）— [`docs/constitution/00-rule-hierarchy.md`](../constitution/00-rule-hierarchy.md)  
**前提**: Phase 1 方式B 正本（`AGENTS.md` §1-2-3-4・`part-A-constitution-kernel.md`）を **破壊せず拡張**する。

## 固定4AI体制

| # | 役割 | モデル |
|---|------|--------|
| ① | CIO | Claude Opus 4.7（本体・ピッカー固定） |
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
- **検証**: `npm run verify:mode-b-turn-head-canonical`（`.mdc` が4行フェンスをコピーしていないか）

## 一括検証

```bash
npm run verify:cio-four-ai-governance
npm run verify:cio-mcp-registry
npm run cio:mcp:env
```

## 緊急脱出

`SKIP_CIO_MODE_B_INTERLOCK=1`（浜田 GO + チャット理由 1 行必須）
