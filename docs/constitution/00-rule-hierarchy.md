# ルール階層インデックス（3階層・方式B）

**制定**: 2026-05-21（憲法・ルール構造整理 Phase 1）  
**目的**: AI・CEO が「どこを正とするか」を **一目**で判別する。下位は上位に矛盾してはならない。

---

## 第1階層 — 憲法・最優先（意味の正本）

| 優先 | ファイル | 内容 |
|:---:|----------|------|
| 1 | **`AGENTS.md`** | 全 § の最終解釈。**§1-2-3-4**・**§1-2-3-4-A**（4AIマトリクス）・**§1-2-3-4-B**（Opus 4.8 ハイブリッド・Fast防衛）・**§1-2-3-4-C**（AI読み込み最適化）・**§50-3-8**・**§50-3-11** |
| 2 | **`chat-sessions/session-starter-parts/part-A-constitution-kernel.md`** | 🎖️ 役割表・実行/確認分離・ティア（スターター正本） |
| 3 | **`RULES-INDEX.md`** | § 逆引き・タスク開始時の索引 |
| 4 | **`.cursor/rules/mode-b-canonical.mdc`** | **用語・四行テンプレ・4AI担当明文化マトリクスの単一窓**（`AGENTS.md` §1-2-3-4-A と同一・重複コピー禁止） |
| 4b | **`.cursor/rules/mcp-server-use-triggers.mdc`** | MCP 選択・**§4AI**（`data/cio-mcp-four-ai-matrix.json` と同期） |
| 4c | **`.cursor/rules/cursor-generate-image-assets.mdc`** | 画像 MCP 計画削除・内蔵 GenerateImage のみ |
| 4d | **`.cursor/rules/mode-b-mdc-canonical-linter.mdc`** | `.mdc` → `mode-b-canonical` 参照 Linter 規律 |
| 5 | **`.cursor/rules/cio-constitution.mdc`** | 唯一 `alwaysApply: true` 核（四行・Multi-Agent 要約） |
| 6 | **`.cursor/rules/every-turn-rules-confirm.mdc`** | 毎ターン・報告チェックシート・§1e |
| 7 | **`.cursor/rules/constitution-enforcement-core.mdc`** | 違反＝失敗・2者チェック |

**継承**: §35-1（開発=AI・確認=浜田）・§56-1a・§50-3-8・§1-2-2・§41・§51・報告 V2 — **削除・弱体化禁止**。

---

## 第2階層 — 機械ルール・自動検証

| 優先 | ファイル / コマンド | 内容 |
|:---:|---------------------|------|
| 1 | **`scripts/lib/cio-four-ai-governance.mjs`** | 方式B 検知正規表現・証跡・ゾンビパターン |
| 2 | **`npm run cio:guard:composer-interlock`** | タスクA: `Switched to Composer` 遮断 |
| 3 | **`npm run cio:guard:5038`** | タスクB: §50-3-8 証跡ゲート |
| 4 | **`npm run verify:mode-b-zombie-docs`** | タスクC: 文書ドリフト検査 |
| 5 | **`npm run verify:mode-b-turn-head-canonical`** | タスク3: `.mdc` → `mode-b-canonical` 参照・4行重複禁止 |
| 6 | **`npm run verify:mcp-four-ai-alignment`** | タスク1: MCP 台帳 ↔ ルール ↔ matrix 同期 |
| 7 | **`npm run verify:rule-hierarchy-prune`** | タスク2: 索引外ゾンビ文書検出 |
| 8 | **`npm run rules:sync-mdc-index`** | Phase 2-B: RULES-INDEX ← .mdc 逆引き |
| 9 | **`npm run verify:cursor-rules-index`** | Phase 2-B: topic-index ↔ 実ファイル |
| 10 | **`npm run rules:sync-index-all`** | Phase 2-C: mdc 逆引き + §↔mdc 双方向 |
| 11 | **`npm run verify:constitution-mdc-freshness`** | Phase 2-C: `constitution.mdc` 手編集検知 |
| 12 | **`npm run verify:cio-four-ai-governance`** | 一括（上記 + turn-head + MCP + section-mdc） |
| 13 | **`.cursor/hooks/cio-four-ai-interlock.mjs`** | deploy / commit 前の deny |
| 14 | **`git-hooks/pre-commit`** | staged: 5038 + Composer + constitution 鮮度 |

条文対応: **`AGENTS.md` §50-3-11**。

---

## 第3階層 — ランブック・運用手順

| ファイル | 内容 |
|----------|------|
| **`docs/runbooks/cio-weekend-autonomous-audit.md`** | 週末自律監査（実装凍結時・2026-05-29） |
| **`docs/runbooks/cio-opus48-intelligence-activation.md`** | Opus 4.8 L3 思考プロトコル |
| **`docs/runbooks/cio-friday-mcp-status-refresh-4ai.md`** | 金曜 `mcp-status:refresh-usage` 4AI 安全手順（2026-05-29） |
| **`docs/runbooks/cio-four-ai-governance.md`** | 4AI統制コマンド一覧 |
| **`docs/runbooks/cio-architect-mode.md`** | 6役② Architect 1-shot（§1-2-3-6） |
| **`docs/runbooks/cio-visual-diagram-openrouter.md`** | 6役⑥ Visual OpenRouter 図解 |
| **`docs/runbooks/cio-fable5-escalation.md`** | L4 Fable 5 切り札 |
| **`docs/runbooks/c-tmp-workspace-lifecycle.md`** | C:\tmp 作業領域棚卸し |
| **`docs/runbooks/deepseek-pre-edit-gate.md`** | §50-3-8 着手前チェックリスト |
| **`docs/plans/2026-05-21-cio-session-model-override.md`** | 方式B 決定メモ |
| **`docs/session-report-checklist.md`** | 報告 §M-2 V2 |
| **`docs/constitution/*.md`** | AGENTS 分割読本（§ 特定後に Read） |
| **`docs/troubleshooting.md`** | TSB 系 |
| **`docs/mcp-status.md`** | MCP 台帳・§見送り（画像生成 MCP）・§4AI マトリクス |
| **`data/cio-mcp-four-ai-matrix.json`** | 4AI×MCP 機械正本 |
| **`docs/plans/INDEX.md`** | 現役プラン（完了は `docs/plans/_archive/`） |
| **`docs/constitution/18-ai-team-read-map.md`** | 4AI 役割別「何を読むか」（Phase 2） |
| **`docs/plans/2026-05-21-constitution-phase2-safe-subdivision.md`** | Phase 2 安全細分化手順（1人作業禁止） |

**索引外の扱い**: `docs/plans/` で `_archive` 未移動の superseded プランは **`npm run verify:rule-hierarchy-prune`** が検出。退避は **`npm run cio:archive:rule-orphans`**。

---

## 読む順（新セッション）

```text
第1: part-A 🎖️ + mode-b-canonical.mdc
第2: タスクが customize/deploy → §50-3-11 3ステップ + cio:guard:5038
第3: コマンド不明 → docs/runbooks/
```

検証: `npm run verify:cio-mcp-registry` / `npm run verify:mcp-four-ai-alignment` / `npm run verify:mode-b-turn-head-canonical` / `npm run verify:cio-four-ai-governance`
