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

### R17 — セッション締め Desktop 同期必須（浜田 GO 2026-06-11）

日終わり・セッション切替前は **commit / push の前または直後**に必ず:

```powershell
$env:SESSION_STARTER_DESKTOP_DIR="C:\Users\mhamada202408224\Desktop\AI緊急用"
npm run desktop:sync-and-verify
```

- `verify:session-close-git-warn` が **未コミット / ahead** で NG のときは先に git を整える
- R7（憲法・索引変更時）と併用 — **締めでは常に実行**

### R19 — プロジェクト完了・認識同期（浜田 GO 2026-06-13）

**趣旨**: 浜田↔AI の「完了 vs 未完了」認識ズレ防止（TSB-038）。

| タイミング | コマンド |
|------------|----------|
| ブリーフィング / 次手を述べる前 | `npm run cio:briefing:recognition-gate` |
| プロジェクト v1 締め | `npm run cio:session:close-recognition-gate` |
| 朝 ready / bootstrap / desktop sync | `npm run verify:checkpoint-project-closure`（内包） |

**正本**: `docs/runbooks/cio-project-closure-governance.md` / `docs/constitution/23-project-closure-recognition-kernel.md` / `.cursor/rules/cio-project-closure-gate.mdc`

**禁止**: closures 済みなのに checkpoint だけで未完了レーンを報告 / 締めで checkpoint・handoff・closures を同ターンで揃えない

### R20 — 締め commit+push + 先祖返り回避（2026-06-13 追補）

| タイミング | コマンド |
|------------|----------|
| セッション締め | `npm run cio:session:close-git -- --execute --auto-stage --message "…"`（desktop sync 内包） |
| 検査のみ | `npm run cio:session:close-git` |

**順序**: R-17-1 guard → commit → `pull --rebase` → push → `desktop:sync-and-verify`  
**禁止**: 締めで「commit GO 待ち」／push 先送り

**正本**: `18-重要確認.txt` B1/B4 / `.cursor/rules/cio-session-close-git-gate.mdc`

### R23 — 実行→返答（2026-06-13 浜田 GO）

締め・チェック依頼で **チャット返答より先に tool 実行**。  
正本: `.cursor/rules/session-close-execute-first.mdc` / `docs/runbooks/cio-health-check-turn.md`

### R24 — SPEC 確定日 commit 必須（2026-06-13 浜田 GO）

`docs/plans/*-spec.md` の新規・試験フラグ（`.cio/session-clock-mode.json` 等）変更は **同一日 commit 必須**（push は B4）。  
検証: `npm run verify:cio-spec-close-git`

### R31 — bridge gitHead 意味（2026-06-13 浜田 GO）

| フィールド | 意味 |
|------------|------|
| `bridge.gitHead` | **export-handoff 成功時点**の `git rev-parse --short HEAD` |
| clean tree で verify | `gitHead === HEAD` **または** R31 許容ドリフト（下記） |

**許容ドリフト（amend fold 後）**: 直近 commit が bridge のみ かつ `bridge.gitHead === HEAD~1` → `--validate-export` OK。  
手動 amend の迷子防止 — `close-git` は export → verify → amend fold → **再 export → bridge commit（amend 禁止）**。

### R26 / R32 / R33 — 説明・切り分け・チェックターン（2026-06-13 浜田 GO）

| ID | 正本 |
|----|------|
| R26 | `evening-reflection-scope.md` §R26 + `session-close-execute-first.mdc` |
| R32 | `docs/runbooks/windows-spawn-flash-triage.md` |
| R33 | `docs/runbooks/cio-health-check-turn.md` |

### R19 — 台帳 SPEC Q&A（2026-06-13 浜田 GO）

`docs/runbooks/kintone-ledger-spec-qa-checklist.md` — SPEC GO 前必須。検証: `verify:kintone-ledger-spec-qa`

## 第12/13層 — 許容ギャップの機械監視（2026-06-14）

| ギャップ | 許容条件 | 忘れ防止 |
|----------|----------|----------|
| **640** FAQ DB | deploy 未接続 | `data/kintone-accepted-gaps.json` + `npm run verify:kintone-accepted-gaps` — **`deploy:640` 追加時 NG**（registry `relatedAppFieldsFrom: ["641"]` 必須） |
| **generations manifest** | 監査は git マージで安全 | pre-commit dry-run + post-commit `sync --apply` → `--amend` / close-git 二重化 |

正本: `kintone-apps.md` フィールド台帳 SOP / `docs/runbooks/cio-periodic-ops-schedule.md`

## R34–R40 — 作業領域・CLOSED 前ゲート（2026-06-14 浜田 GO）

| ID | 内容 | 検証 |
|----|------|------|
| R34 | Windows 正本パス | `verify:windows-canonical-paths`（ローカル） |
| R35 | パス整理 GO → 同日 commit | `repo-workspace-lifecycle.md` |
| R36 | CLOSED 前 ESLint | `verify:kintone-project-close-gate` |
| R37 | customize → appId | `data/kintone-customize-path-registry.json` |
| R38 | Desktop 死ショートカット | `verify:desktop-dead-shortcuts` |
| R39 | runbook/registry CI | `verify:runbook-registry-integrity` |
| R40 | 四半期 C:\ スキャン | `repo-workspace-lifecycle.md` §四半期 |

承認: `docs/approved-changes/2026-06-14-rules-r34-r40-hamada-go.md`

## 一括検証

```bash
npm run verify:cio-four-ai-governance
npm run verify:cio-mcp-registry
npm run cio:mcp:env
```

## 緊急脱出

`SKIP_CIO_MODE_B_INTERLOCK=1`（浜田 GO + チャット理由 1 行必須）
