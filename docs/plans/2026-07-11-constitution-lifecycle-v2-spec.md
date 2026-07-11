# 憲法ライフサイクル v2 — 完全仕様（2026-07-11 夜 · CEO GO）

> **CEO 指示**: AIチーム全員合意後 → 仕様 → commit → push → 実装 → verify  
> **地位**: formalization 整理 · 3入口再設計 · ジャンル4層 · 新チャーター 26/27 の正本  
> **統合**: `data/cio-constitution-spec-index.json` · 配線トラッカー `2026-07-11-constitution-round3-master-spec.md`

## AI チーム最終合議（Round-FINAL → Round-2 解消）

| 役割 | 判定 | 解消 |
|------|:----:|------|
| DeepSeek | 条件付きGO | mandatory_reads + registry 参照パッチ → **GO** |
| Kimi | lite NO-GO | package.json 禁止を外し憲法系パスのみ追加禁止 → **GO** |
| CIO | GO | E1–E9 needles · verify probe 連鎖 |
| **合議** | **全員 GO** | 2026-07-11 18:42 JST |

## §1 Formalization Lifecycle（L1–L5）

| # | 原則 |
|---|------|
| L1 | registry は **verify が probe する現役ゲートのみ** |
| L2 | 代替 gate が verify PASS → **registry から削除可** |
| L3 | 履歴は **本 spec §2 retired 表 + git**（dormant ラベル廃止） |
| L4 | `reviewDate` 必須項目は期限後 GREEN→削除 / RED→昇格 |
| L5 | 残す＝`gate` + `verifyProbe` 必須 |

## §2 Retired ラベル（registry から削除済み）

| 旧 ID | 旧リスク | 代替 gate（憲法本体） |
|-------|----------|----------------------|
| H4 | verify needle のみ | `verify:team-ops-antihollow` |
| H6 | pre-implement 表示のみ | `cio-pre-implement-gate --strict` × last-tier |
| H3 | 5038 stamp 形だけ | H1 に統合 |
| H0 | ターン契約3行 | turn-start strict + report-verify |
| C3 | §1 四行手書き | `cio:report-verify-response` |
| H7 | report-verify 形だけ | `cio-team-ops-metrics` 指標#4 |

## §3 現役 registry（6 件）

H1 · H5 · H8 · H9（review 2026-07-25）· C1 · C2

## §4 新憲法チャーター

| ファイル | 役割 |
|----------|------|
| `26-formalization-lifecycle-charter.md` | L1–L5 運用 |
| `27-constitution-navigation-charter.md` | 4層ナビ · 3入口 |
| `28-ceo-go-phases-charter.md` | CEO GO G0–G3（Round-3 R3-1） |

## §5 entry-points 再設計

- `replaces` 廃止 → `supplements` + `mandatory_reads`
- WAKE: constitution-first-read-pack 00–06 **免除しない**

## §6 doc-lane lite スコープ（R3-7 正本）

**機械正本**: `data/cio-doc-lane-lite-scope.json` · **検証**: `npm run verify:doc-lane-lite-scope`

| 区分 | 内容 |
|------|------|
| 入口 | `doc-lane` + `tier lite` のみ（report/customize は lite 不可） |
| 制限 | **1 path** · 追加 **≤20 行** |
| 禁止 prefix | `customize/` · `.cursor/rules/` · `AGENTS.md` |
| 憲法禁止 | `data/cio-*` · `data/rules-*` · `scripts/verify-constitution*` · `docs/constitution/25–28-*` · `docs/plans/2026-07-11-constitution*` |
| 禁止 exact | `scripts/cio-turn-start.mjs` |
| **E4 境界** | lite は **軽微 doc 追記**用。仕様の言い切り・完了宣言の **2 者検証（E4）は維持**。憲法・registry・verify 配線変更は **lite 対象外** |

> 一般 L1 の `package.json` 別名追加は **doc-lane lite とは別枠**（evening 論点 1 表参照）。

## §7 verify 強化

`verify:constitution-evening`: registry≤8 · no replaces · charters · E1–E9 · **全 registry probe spawn**（`verify:formalization-registry-probes`）

## §8 実装バッチ

B0 spec+charters · B1 registry · B2 entry+AGENTS+lite · B3 catalog/nav · B4 verify · B5 commit

## §9 spec 統合（R3-8）

- **索引正本**: `data/cio-constitution-spec-index.json`
- **検証**: `npm run verify:constitution-spec-integration`
- **歴史正本**: `2026-07-11-constitution-evening-spec.md`（論点 1–4 · 削除しない）
- **現役トラッカー**: `2026-07-11-constitution-round3-master-spec.md`

## §10 Phase 1 E1–E9 needles（R3-9）

- **正本**: `data/cio-e1-e9-needles.json`（9 ID → 薄型 `.mdc`）
- **検証**: `npm run verify:constitution-e1-e9-needles`
- **人間表**: `docs/constitution/phase1-essence-preservation-checklist.md`

## §11 H9 review（R3-10 · 2026-07-25）

- **正本**: `data/cio-formalization-h9-review.json`
- **検証**: `npm run verify:formalization-h9-review`
- **判定 CLI**: `npm run cio:formalization-h9-review -- --evaluate`
- **注意**: 2026-07-25 までは **scheduled** — registry 削除は CEO G3 のみ
