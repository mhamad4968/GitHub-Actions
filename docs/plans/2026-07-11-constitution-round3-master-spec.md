# 憲法 Round-3 — 配線完走マスター spec

> **方針**: lifecycle-v2 の **配線完走** · 1項目ずつ GO · 報告後に次へ  
> **DoD「最高」**: 下表 **6条件**（`data/cio-constitution-spec-index.json` · `verify:constitution-spec-integration`）  
> **spec 統合索引**: `data/cio-constitution-spec-index.json`（R3-8 正本）

## Spec 階層（読む順）

| 順 | ファイル | 役割 |
|----|----------|------|
| 1 | `2026-07-11-constitution-evening-agenda.md` | 夜 DoD チェックリスト（完了） |
| 2 | `2026-07-11-constitution-evening-spec.md` | 論点 1–4 合意の歴史正本 |
| 3 | `2026-07-11-constitution-lifecycle-v2-spec.md` | lifecycle · 入口 · verify 仕様 |
| 4 | **本書（round3-master）** | **R3 配線トラッカー（現役）** |

## DoD「最高」— 6 条件（R3-1〜7 で解消）

| ID | ギャップ | Round-3 | verify |
|----|----------|---------|--------|
| D1 | G5 CEO GO 未明文化 | R3-1 | `verify:rules-interpretation-lock` |
| D2 | G2 evening 孤立 | R3-2 | `verify:rules-optimization` |
| D3 | G3 probe metadata のみ | R3-3 | `verify:formalization-registry-probes` |
| D4 | G1 section-genre ずれ | R3-4 | `verify:rules-index-section-genre` |
| D5 | G4 mandatory_reads 未配線 | R3-5 | `verify:mandatory-reads-stamp` |
| D6 | G6 Desktop + G7 lite | R3-6, R3-7 | `verify:constitution-meta-charters-desktop` · `verify:doc-lane-lite-scope` |

> **浜田 ACK「最高でOK」** は D1–D6 + R3-1〜10 配線完了後（H9 **最終判定**は 2026-07-25 CEO）。

## AIチーム合議（Round-3 完走レビュー · 2026-07-11）

| 役割 | 判定 | 所見 |
|------|:----:|------|
| CIO（Opus） | **GO** | R3-1〜10 成果物・verify 連鎖を突合。全専用 verify exit 0 |
| DeepSeek | **GO** | H9 は **scheduled** のみ正しい。07-25 前の registry 削除なし |
| Kimi | **GO** | Desktop 31–33 と 26–28 番号衝突なし · META 全文 sync OK |
| OpenRouter | **GO** | spec 索引・E1–E9 needles の二重正本なし |
| **合議** | **全員 GO** | **G3 commit/push 承認** |

### レビュー時是正

| 項目 | 対応 |
|------|------|
| `templates/yojitsu-budget-lite/SPEC.md` 破損行 | **コミット対象外**（`git checkout` で復元） |
| Desktop META 26 stale | `constitution:sync-meta-charters-desktop` + `session-starter:sync-desktop` 実施済 |
| `cio-constitution-spec-index.json` 閉じ括弧 | R3-8 時に修正済 |

## 進捗

| ID | 内容 | G1 spec | G2 実装 | verify | 報告 |
|----|------|:-------:|:-------:|:------:|:----:|
| R3-1 | CEO GO 3段階 + I12 | [x] | [x] | [x] | 2026-07-11 |
| R3-2 | evening → rules-optimization 連鎖 | [x] | [x] | [x] | 2026-07-11 |
| R3-3 | registry 全 probe 実実行 | [x] | [x] | [x] | 2026-07-11 |
| R3-4 | section-genre 同期 | [x] | [x] | [x] | 2026-07-11 |
| R3-5 | mandatory_reads stamp | [x] | [x] | [x] | 2026-07-11 |
| R3-6 | Desktop 26/27/28 同期 | [x] | [x] | [x] | 2026-07-11 |
| R3-7 | doc-lane lite スコープ | [x] | [x] | [x] | 2026-07-11 |
| R3-8 | spec 統合 | [x] | [x] | [x] | 2026-07-11 |
| R3-9 | E1–E9 .mdc needles | [x] | [x] | [x] | 2026-07-11 |
| R3-10 | H9 review 2026-07-25 | [x] | [x] | [x] | 2026-07-11 配線 · 判定 07-25 |

## R3-1 記録

- **成果物**: `28-ceo-go-phases-charter.md` · I12 · verify I1–I12
- **解消**: G5（CEO GO 未明文化）
- **G0–G3**: 合議 / spec / 実装 / commit-push を表で固定

## R3-3 記録

- **成果物**: `cio-formalization-probe-spawn.mjs` · `verify:formalization-registry-probes`
- **解消**: G3（registry verifyProbe が metadata のみ）
- **spawn**: antihollow · team-ops-v2 · cursor-rules-index · desktop-ai-emergency-sync（H8 自己参照は skip）

## R3-4 記録

- **成果物**: `rules:sync-section-genre` · RULES-INDEX 25–28 + entry-points · map catalogVersion 同期
- **解消**: G1（section-genre NG · RULES-INDEX 欠落）
- **verify**: `verify:rules-index-section-genre` を `verify:rules-optimization` 連鎖に追加

## R3-5 記録

- **成果物**: `cio-mandatory-reads-stamp.mjs` · `verify:mandatory-reads-stamp` · cold-start Phase 5c · sessionStart 注入
- **解消**: G4（mandatory_reads JSON のみで hooks/cold-start 未配線）
- **正本**: `data/cio-rule-entry-points.json` E1（wake 7 + session 2）

## R3-6 記録

- **成果物**: read-pack **31–33**（憲法チャーター **26/27/28** の Desktop 控え）
- **解消**: G6（Desktop に META チャーター全文なし）
- **注意**: Desktop **番号 26–28** は夕反省・683・ジャンル早見で使用中 → チャーターは **31–33** に配置

## R3-7 記録

- **成果物**: `data/cio-doc-lane-lite-scope.json` · `verify:doc-lane-lite-scope`
- **解消**: G7（lite スコープ分散 · E4 境界不明）
- **正本**: JSON → `cio-team-ops-git-scope.mjs` 読込 · E4 2者検証は lite でも維持

## R3-2 記録

- **成果物**: `verify:constitution-evening` を `verify:rules-optimization` + close-chain に配線
- **解消**: G2（evening verify 孤立）

## R3-8 記録

- **成果物**: `data/cio-constitution-spec-index.json` · `verify:constitution-spec-integration`
- **解消**: spec 分散（evening / lifecycle-v2 / round3 の役割曖昧）
- **統合**: 索引 JSON + 各 spec 相互ポインタ + DoD 6 条件の機械化

## R3-9 記録

- **成果物**: `data/cio-e1-e9-needles.json` · `verify:constitution-e1-e9-needles`
- **解消**: E1–E9 が AGENTS のみで .mdc アンカー未機械化
- **配線**: `cio-constitution.mdc` 表 · `27-navigation-charter` · `entry-points.phase1Essence` · evening verify 連鎖

## R3-10 記録

- **成果物**: `data/cio-formalization-h9-review.json` · `verify:formalization-h9-review` · `cio:formalization-h9-review`
- **解消**: H9 `reviewDate` の判定インフラ未配線
- **metrics**: `cio-team-ops-metrics` → `metrics-daily.jsonl` 日次追記
- **CEO 判定日**: 2026-07-25（`--evaluate` · `--record-decision` · registry 変更は G3）
