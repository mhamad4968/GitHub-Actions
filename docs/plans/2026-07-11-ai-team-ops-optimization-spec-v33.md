# AI チーム運用最適化 — 仕様 v3.3（残タスク A–D 最善案 · 合議正本）

> **地位**: `2026-07-11-ai-team-ops-optimization-spec-v32.md`（v3.2 · **実装完了 `db059346`**) の追補。  
> **スコープ**: 残タスク **A–D** の最善改善案 + **△全件 CLOSED 策**。憲法 § / `AGENTS.md` 条文改定は **夜レーン**（本書は runbook / script / data 層）。  
> **実装**: **GO 済 `2026-07-11`** — Batch 1–4 完了（憲法改定は夜レーン agenda のみ）

---

## §0 CEO 1ページ

| 質問 | 答え |
|------|------|
| v3.2 は終わった？ | **はい**（A–J+K コア · push 済） |
| 考えられる改善は全部？ | **いいえ** — 本書 A–D が残り |
| 今日やる？ | **白天=本書 Batch 1–4** · **夜=憲法（C-夜）** |

**浜田**: GO-B で Batch 実装指示 · Tier B は MCP（C）のみ · 画面目視は Desktop 30番 §9 更新後。

---

## §1 AI チーム合議（Round 5 · 2026-07-11）

### 1.1 各役 1 行

| 役割 | 合意 | 所見（最善案） |
|------|:----:|----------------|
| ① CIO | **GO** | v3.3 は **配線と観測の仕上げ**。新ゲート追加は最小。Batch 1 先行 |
| ⑤ DeepSeek | **GO** | △B2/K2 は v3.2 で大半 CLOSED。**△H1 第3 probe** と **WARN→strict 自動昇格** が盲点残 |
| ③ Composer | **GO** | △D2 は **tier を env/last-tier.json で伝播**し pre-implement と接続。Subagent 境界は維持 |
| ④ Kimi | **GO** | 外部 AI 出力は引き続き CIO 検収。**K3 は WARN のみ**（ブロックは report-verify 過負荷） |
| Grok L2b | **GO** | △C1 は **inScope 外 diff で contractHash 不一致 → exit 2**。deploy 禁止は既存 scan 維持 |
| ② Architect | N/A | 本書は 2 レーン・200 行未満 — discovery map で完結（F は v3.2 runbook 参照） |
| **CEO 浜田** | **GO 済** | v3.3 実装 GO · Batch 1–4 完了 |

**合議ラウンド**: 5（2026-07-11 JST · A–D 最善案 · △CLOSED 策確定 · **全員自信をもって GO**）

### 1.2 合議で否決した案

| 案 | 否決理由 |
|----|----------|
| every-turn 4→1 統合 | rules-opt §5 正式否決 · hooks 破壊 |
| Lite + quick + skip 三重回避 | v3.2 形骸化原則4 · 設計 NG |
| H0 を pre-commit で強制ブロック | チャット内容は git 外 — **report-verify 拡張**に限定 |
| MCP DEL を白天無 GO で実施 | Tier B 必須 · §8.4 3 項 |
| 憲法 H8（L2 固定）を白天改定 | 夜レーン専用 |

---

## §2 A — v3.2 薄い実装の最善案（△クリア）

### A-1 △C1 · contractHash ≠ diff 拒否

| 項目 | 内容 |
|------|------|
| **最善案** | `cio-grok-execution-guard.mjs` に `--validate-contract` を追加 |
| **ロジック** | `inScope` プレフィックス外の `listChangedPaths` があれば exit 2 · stamp の `contractHash` と再計算 hash 不一致も exit 2 |
| **例外** | `--contract-override "20字以上理由"`（K2 品質 lib 再利用）— セッション 1 回まで |
| **verify** | `verify:cio-grok-execution-infra` needle + runtime: preset dry-run → stamp → validate-contract |
| **△状態** | **CLOSED**（実装後） |

### A-2 △D2 · tier×lane マトリクス固定

| 項目 | 内容 |
|------|------|
| **最善案** | 正本 `data/cio-turn-start-tier-lane-matrix.json` + lib `cio-turn-start-tier.mjs` 拡張 |
| **伝播** | `cio-turn-start.mjs` 成功時に `logs/cio-turn-start/last-tier.json` 書込（tier, lane, at） |
| **配線** | `cio-pre-implement-gate.mjs` が last-tier 読取 → `tierAllowsEdit/Shell` 違反で exit 2 |
| **マトリクス（確定）** | |

```
| lane \ tier | quick | standard | strict | lite |
|-------------|:-----:|:--------:|:------:|:----:|
| default     | Read のみ | Edit OK | Edit OK | L1 のみ |
| doc-lane    | Read のみ | doc のみ | full | L1 のみ |
| report      | verify のみ | 報告準備 | strict | **禁止** |
| customize*  | **禁止** | **禁止** | **のみ** | **禁止** |
```
\* `sessionTouchesCustomize` 時は lane 無視で strict 強制（既存）

| **△状態** | **CLOSED** |

### A-3 △H1 · runtime probe 3 本完走

| # | probe | 最善実装 |
|---|-------|----------|
| 1 | `turn-start --strict` 証跡なし → exit 2 | `verify-team-ops-antihollow.mjs` が **一時 stamp 退避** → probe → 復元 |
| 2 | `5038 --skip "形式のみ"` → exit 1 | **実装済**（v3.2） |
| 3 | `turn-start --tier quick` + diff 非空 → exit 2 | **実装済**（lib + 実運用）· subprocess で再確認 |

| **△状態** | **CLOSED** |

### A-4 △G1 · 夕反省 #S 週1連携

| 項目 | 内容 |
|------|------|
| **最善案** | `evening-reflect.mjs` 冒頭で `cio-team-ops-metrics --propose-evening` を spawn · 出力を **§3 候補 1 行**として追記（手動採用） |
| **週1上限** | `logs/cio-team-ops/evening-proposals.json` — ISO 週 1 件超は **出力スキップ**（exit 0） |
| **重複禁止** | `bridge.lastFailures[].id` と同一テーマは提案しない |
| **スコープ** | `evening-reflection-scope.md` 厳守 — **明日やることは書かない** |
| **△状態** | **CLOSED** |

### A-5 △E1 / X6 · KPI 5 指標フル + RED 提案

| # | 指標 | 収集源 | RED 閾値 |
|---|------|--------|----------|
| 1 | 5038 skip 率（customize） | `lite-usage` + stamp mode + session audit log | **>30%**（7 日ロール） |
| 2 | Grok C 緑化率 | grok state history `event=success` / `c-start` | **<50%**（週） |
| 3 | Lite 使用率 | `lite-usage.json` / 全 turn-start イベント | **>20%**（△A1） |
| 4 | report-verify 失敗 | `logs/cio-report-verify/` 新規ディレクトリ | **≥3/週** |
| 5 | bridge.lastFailures 件数 | bridge JSON | **≥5 件**（飽和 WARN） |

**RED 時**: `cio-team-ops-metrics` が `docs/runbooks/cio-team-ops-kpi-red.md` へ 1 行追記提案（**自動 commit 禁止** · handoff 1 行）。

正本閾値: `data/cio-team-ops-kpi-thresholds.json`

| **△状態** | **CLOSED** |

### A-6 形骸化原則 2 · WARN 2 セッション → strict

| 項目 | 内容 |
|------|------|
| **最善案** | `logs/cio-turn-start/warn-streak.json` — 5038 WARN / turn-start WARN をセッション ID 単位でカウント |
| **昇格** | 連続 2 セッション → `logs/cio-turn-start/force-strict-until.json` 書込 · `readTeamOpsFlags` が **forceStrictTier 相当**を返す |
| **解除** | `cio:session:cold-start` / WAKE でクリア |
| **runbook** | `docs/runbooks/cio-team-ops-warn-escalation.md` 新設（5 行） |
| **△状態** | **CLOSED** |

### A-7 verify 連鎖 · governance へ組込

| 項目 | 内容 |
|------|------|
| **最善案** | `verify:cio-four-ai-governance` の末尾付近に `verify:team-ops-v2` を **1 本追加**（miss-reduction の直前） |
| **△状態** | **CLOSED** |

### A-8 K3（任意）· 🎖️ diff 突合 WARN

| 項目 | 内容 |
|------|------|
| **最善案** | `cio-chat-report-selfcheck.mjs` に `--check-medal-line`（opt-in）: 下書き md の 🎖️ 行が `TEMPLATES[lane]` と不一致なら **WARN**（exit 0 · stderr） |
| **理由** | ブロックすると報告ターンが止まりすぎる — **観測優先** |
| **△状態** | **CLOSED（WARN 級）** |

### A-9 △I1 · feature flag 期限

| 変数 | 既定 | レビュー期限 |
|------|------|-------------|
| `CIO_LITE_LANE` | `1` | **2026-08-11** — 期限後は verify が WARN |
| `CIO_TURN_TIER_STRICT` | `0` | 常時（緊急ロールバック用） |

`verify-team-ops-v2` が `data/cio-team-ops-kpi-thresholds.json` 内 `flagReviewDate` を検査。

| **△状態** | **CLOSED** |

### A-10 Phase 7 仕上げ（ドキュメント同期）

- v3.2 / Desktop 30番 §9: **「実装完了 `db059346`」** に更新
- `npm run session-starter:sync-desktop` + `verify:desktop-ai-emergency-sync`
- handoff 1 行: `v3.3 Batch N 完了`

---

## §3 B — 親仕様 v3 残りの最善案

### B-1 P3 · 運用 1 週間後 strict 遵守の夕反省化

| 項目 | 内容 |
|------|------|
| **最善案** | **metrics 7 日分蓄積後**（2026-07-18 以降）に `evening-reflect` が §3 へ **#S-OPS-STRICT-AUDIT** を自動候補（週1上限内） |
| **内容** | strict 違反件数 · skip 率 · Lite 超過を表 1 つ |
| **今日** | 閾値 JSON + metrics 拡張のみ（提案は空で OK） |
| **△2 残留** | 運用 **2 週後**に spec §11 で **低**へ降格（データ-driven） |

### B-2 spec 状態行の更新

| ファイル | 更新 |
|----------|------|
| `ai-team-ops-optimization-spec.md` §10 | v3.2 **実装完了** · v3.3 追補リンク |
| `ai-team-ops-optimization-spec-v32.md` §1 CEO | **GO 済 `db059346`** |
| Desktop `30-AI-TEAM-ORG-CHART.txt` §9 | v3.3 Batch 表 + 実装完了日 |

### B-3 H6 · pre-implement × strict 連携

A-2 の tier 配線で **実質 CLOSED**。pre-implement `--strict` 時は last-tier が strict でないと exit 2。

---

## §4 C — 隣接レーンの最善案（白天 / 夜 / Tier B 分離）

### C-1 rules-optimization（GO-B）— 白天推奨

| Batch | 内容 | 依存 |
|-------|------|------|
| **R-P1** | cio-index 14 欠落追加 + boundary-close 追記 | なし |
| **R-P2** | cursor-index 15 ジャンル + discovery map | P1 verify OK |
| **R-P3** | 6 verify 新設 + `verify:rules-optimization` 一括 | P2 |

**最善順序**: v3.3 Batch 1–2 **完了後**に着手（governance verify が増えるため）。

**△T1–T17**: rules-opt spec §6 どおり — **別 commit 3 本**（P1/P2/P3）。

### C-2 MCP consolidation §10 — Tier B 後

| 段階 | 内容 | 浜田 |
|------|------|------|
| SCR-1–7 | cyber-news / mintlify 除去準備 | — |
| §8.3 DEL 前ゲート | 全 npm exit 0 をチャット貼付 | Tier B 3 項 |
| P3/P4 | mcp.json 変更 | **Reload Window** |

**白天**: SCR + dry-run のみ（**mcp.json 変更なし**）。

### C-3 憲法改善（夜レーン）

| 論点 | 最善方針 |
|------|----------|
| H8 ティア L2 固定 | **議論可** — 軽微 doc を L1 許容するか |
| AGENTS 統合 | **索引化優先**（条文大量改変は否決 — rules-opt §2 R5） |
| 新憲法要否 | checkpoint 夜タスクとして **別 spec** |

**白天は spec 論点表のみ**（`docs/plans/2026-07-11-constitution-evening-agenda.md` 草案可）。

---

## §5 D — 運用 discipline の最善案（ツール + 運用）

### D-1 H0 · ターン契約 3 行

| 層 | 策 |
|----|-----|
| **ツール** | `report-verify` が strict tier 時 **Goal/Touch/SPEC_TOUCHED** 3 行欠落 → exit 1 |
| **運用** | CIO 応答先頭に turn-start 出力を **コピペ**（既存） |
| **観測** | metrics が週次で欠落推定（完璧な自動検知は不可 — チーム合意） |

### D-2 H2 · 🎖️ コピペ

A-8 K3 WARN で **半自動 CLOSED**。

### D-3 H7 · report-verify 形骸化

A-5 指標 4 + D-1 で **観測 CLOSED**。

### D-4 Visual ⑥

**今日対象外** — doc-lane intent 時のみ `cio:tool:route`（既存）。

### D-5 Fable L4

**対象外** — Self-Heal 3 回超の既存フロー維持。

---

## §6 △クリア総括表（v3.3 目標）

| △ID | v3.2 | v3.3 CLOSED 策 | Batch |
|-----|------|----------------|-------|
| △C1 | 未 | validate-contract | 3 |
| △D2 | 未 | matrix JSON + pre-implement | 1 |
| △H1 | 部分 | probe 3 本 subprocess | 1 |
| △G1 | 部分 | evening 連携 + 週1 | 2 |
| △E1/X6 | 部分 | 5 指標 + RED | 2 |
| △I1 | 部分 | flagReviewDate | 1 |
| △A1 | 監視のみ | KPI RED >20% | 2 |
| 形骸化-2 | 未 | warn-streak → strict | 2 |
| K3 | 未 | medal WARN | 3 |
| v3 △2 | 中 | 2 週運用後に低へ | B-1 |
| rules T1–17 | 未 | GO-B P1–P3 | C-1 |
| MCP △1–17 | 各種 | SCR + Tier B | C-2 |

---

## §7 リスクと対策（合議）

| リスク | 対策 | 担当 |
|--------|------|------|
| ゲート過多（形骸化4違反） | 新 exit 2 は **strict/customize/Grok のみ** | CIO |
| stamp 退避 probe が壊す | antihollow は **try/finally 復元** | Composer |
| evening 自動提案がスコープ逸脱 | 週1 · lastFailures 重複禁止 · scope verify | DeepSeek |
| MCP DEL で IDE 壊れ | §8.3 全 OK + Tier B 3 項 | 浜田 |
| 憲法白天改定 | **禁止** — agenda のみ | 全員 |

---

## §8 今日の実装 Batch（推奨順）

| Batch | 内容 | 検証 | 目安 |
|-------|------|------|------|
| **1** | A-2, A-3, A-7, A-9, A-10, spec 更新 | `verify:team-ops-v2` `smoke:quiet` | 1–1.5h |
| **2** | A-4, A-5, A-6, B-1 基盤 | `cio:team-ops-metrics` evening dry-run | 1–1.5h |
| **3** | A-1, A-8, B-3 | `verify:cio-grok-execution-infra` | 45m |
| **4** | C-1 R-P1（任意） | `verify:rules-optimization` | 1–2h |
| **夜** | C-3 憲法 agenda | — | 別セッション |

**commit 分割**: Batch ごと 1 commit · `Reviewed-by: deepseek`（SPEC_TOUCHED 時）。

---

## §9 検証（v3.3 完了時）

```bash
npm run verify:team-ops-v2
npm run verify:team-ops-antihollow
npm run verify:cio-four-ai-governance
npm run verify:cio-miss-reduction-governance
npm run smoke:quiet
npm run verify:desktop-ai-emergency-sync
```

---

**版**: v3.3 · 2026-07-11 JST · 実装完了（Batch 1–4 · rules-opt 既存 verify OK）
