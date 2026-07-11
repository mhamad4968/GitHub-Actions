# 憲法改善 — 夜セッション議題・**全件やり切り**（v3.3 C-3）

> **CEO 指示（2026-07-11 浜田）**: 夜は **憲法を重点的に** · **やり残し禁止** · **憲法の改善をすべてやり切る**  
> **地位**: 夜レーンは **議論 → 合意 → 実装 → verify → commit/push まで完走**  
> **正本**: checkpoint `nextTask` · `HANDOFF-HUMAN.txt` · 本ファイル

## やり残し禁止チェックリスト（夜の DoD）

夜セッション **CLOSE 前**に、次を **すべて [x]** にすること。1 項でも未完了なら **憲法レーン未完了**（依頼効率化ツールへ進まない）。

| # | 論点 | 合意 | 実装 | verify |
|---|------|:----:|:----:|:----:|
| 1 | **H8 ティア L2 固定**（軽微 doc L1 許容か · v3.3 Lite 整合） | [x] | [x] | [x] |
| 2 | **AGENTS 統合**（索引化優先 · rules-opt §2 R5） | [x] | [x] | [x] |
| 3 | **新憲法要否**（現行 § + runbook/npm で足りるか CEO 判断） | [x] | [x] | [x] |
| 4 | **§50-3-8 / turn-start 形骸化**（2 週後 △2→低 降格可否） | [x] | [x] | [x] |
| — | **締め** commit/push · handoff · Desktop sync | — | — | [x] |

**verify 最低セット（夜の締め）**:

```powershell
npm run verify:constitution-handoff
npm run verify:rules-optimization
npm run smoke:quiet
npm run verify:desktop-ai-emergency-sync
```

## 完走定義（必須）

| 段階 | 内容 | 完了条件 |
|------|------|----------|
| 1 | 論点合意 | 浜田 GO（論点ごと Yes/No） |
| 2 | spec / 改定案 | `docs/plans/` に追記または evening spec 確定 |
| 3 | 実装 | `AGENTS.md` / `constitution.mdc` / 関連 runbook・verify（合意範囲のみ） |
| 4 | 検証 | 上記 verify 最低セット **exit 0** |
| 5 | 締め | commit/push · handoff 1 行 · Desktop sync（Lifecycle v2） |

**議論だけで終わらせない** — 上表 5 段階 × 論点 4 件すべてが夜レーンの DoD。

## 論点（優先順）

1. **H8 ティア L2 固定** — 軽微 doc を L1 許容するか（v3.3 Lite と整合）
2. **AGENTS 統合** — 索引化優先（rules-opt §2 R5 · 条文大量改変は否決）
3. **新憲法要否** — 現行 § + runbook/npm 層で足りるか CEO 判断
4. **§50-3-8 / turn-start 形骸化** — v3.3 運用 2 週後に △2 残留を **低** へ降格可否

## 白天でやらないこと（夜レーンへ繰越）

- `AGENTS.md` § 条文改変
- `constitution.mdc` 本文改変
- kintone deploy / MCP Tier B

## 関連正本

- `docs/plans/2026-07-11-rules-optimization-spec.md`
- `docs/plans/2026-07-11-ai-team-ops-optimization-spec-v33.md` §4 C-3
