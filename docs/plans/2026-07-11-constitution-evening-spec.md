# 憲法改善 — 夜セッション完全実装 spec（v1.0 · 2026-07-11）

> **CEO 指示**: やり残し禁止 · **完全な改善**（議論のみ終了禁止）  
> **GO**: 2026-07-11 浜田「今日は完全な改善を目的としている」  
> **地位**: 論点 1–4 の合意・実装・verify の正本

## AI チーム合議（5 ラウンド記録）

| R | 役割 | 結論 |
|---|------|------|
| R1 | CIO + DeepSeek + Kimi + OpenRouter | 棚卸し · 案B（索引化+機械化）推奨 |
| R2 | CEO | **完全改善 GO** — 4 論点すべて今夜完走 |
| R3 | CIO | 本 spec 確定 · データ正本 2 本新設 |
| R4 | DeepSeek | 盲点: 優先順位表維持 · 休眠ラベル必須 · AGENTS分割否決 |
| R5 | CIO | 実装スコープ確定（下表） |

## 論点 1 — H8 ティア L2 固定 + 軽微 doc L1

**合意**: **L2 デフォルト維持** + **機械的 L1（lite tier）** を doc-lane に限定許可。

| 条件 | 内容 |
|------|------|
| 入口 | `npm run cio:turn-start -- --lane doc-lane --tier lite` を **編集前**に実行 |
| スコープ | **1 path のみ** · 追加 **≤20 行** · `customize/` `AGENTS.md` `.cursor/rules/` **禁止** |
| 宣言 | `[§1-2-3 ティア判定: L1] doc-lane lite · <path>` |
| §50-3-8 | lite 時は turn-start がスキップ理由を自動出力 |

**実装**: `data/cio-turn-start-tier-lane-matrix.json` · `cio-turn-start.mjs` テンプレ · AGENTS §1-2-3-2 表 1 行追記

## 論点 2 — AGENTS 統合（索引化）

**合意**: **§ 条文の移動・削除ゼロ** · 先頭に **読み方 TOC（3 入口）** を追記。

**実装**: `AGENTS.md` 冒頭 AI 向けブロック拡張 · `data/cio-rule-entry-points.json` · `00-rule-hierarchy.md` 更新

## 論点 3 — 新憲法要否

**合意**: **新憲法ファイル不要**（`AGENTS.md` + 3 階層 + 3 入口 + verify で足りる）。

**実装**: 本 spec §3 記録 · `docs/constitution/25-constitution-no-replacement-charter.md`（決定メモ・AGENTS 非置換）

## 论点 4 — §50-3-8 / turn-start 形骸化

**合意**:

| 区分 | 扱い |
|------|------|
| **必須** | customize/** · SPEC 意味変更 · 本番 PUT/deploy · **憲法 § 改定** |
| **スキップ可** | handoff/checkpoint 追記 · ORIENT/Read のみ · doc-lane lite 条件内 |
| **監視** | H0/H1/H7 → `data/cio-formalization-registry.json` で **active** |
| **降格判定** | **2026-07-25** 以降 · metrics 7 日分で evening #S-OPS-STRICT-AUDIT |

**実装**: `data/cio-formalization-registry.json` · `deepseek-pre-edit-gate.md` 更新 · I11 追記

## 多重構造解消（追加改善）

| 旧（7+ 入口） | 新（3 入口） |
|--------------|-------------|
| STARTER/checkpoint/handoff/bridge 各読み | **入口3** WAKE: `cio:session:cold-start` |
| 62 .mdc 直読 | **入口2** タスク: `cio:tool:route` → cursor-index |
| AGENTS 線形読み | **入口1** 毎ターン: `cio:turn-start` → mode-b-canonical |

鏡像ファイルは **同期義務**（I3 維持）— 削除しない。

## 退行防止

- phase1 E1–E9 維持
- I1–I11 維持
- `npm run verify:constitution-evening` 追加
- 締め: constitution-handoff + rules-optimization + smoke:quiet

## 変更ファイル一覧

- `docs/plans/2026-07-11-constitution-evening-spec.md`（本書）
- `data/cio-formalization-registry.json`
- `data/cio-rule-entry-points.json`
- `data/rules-interpretation-lock.json`（I11）
- `AGENTS.md`（TOC + H8 1 行）
- `docs/constitution/00-rule-hierarchy.md`
- `docs/constitution/25-constitution-no-replacement-charter.md`
- `docs/runbooks/deepseek-pre-edit-gate.md`
- `docs/runbooks/cio-rules-discovery-map.md`
- `data/cio-turn-start-tier-lane-matrix.json`
- `scripts/cio-turn-start.mjs`
- `scripts/verify-constitution-evening.mjs`
- `package.json`（verify script）
- `docs/plans/2026-07-11-constitution-evening-agenda.md`（[x] 更新）
