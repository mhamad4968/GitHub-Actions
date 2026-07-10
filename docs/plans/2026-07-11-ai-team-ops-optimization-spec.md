# AI チーム運用最適化 — 完全仕様 v3（2026-07-11）

> **地位**: 7/11 運用最適化デー正本。憲法 § 改変なし（第3 runbook / plan 層）。  
> **実装**: **本書 GO 済・コード変更は浜田合図後**（P0–P3）。  
> **上位**: `AGENTS.md` §1-2-3-6 / `docs/plans/2026-07-04-ai-team-six-roles-spec.md` / `docs/runbooks/cio-four-ai-violation-remediation.md`

---

## §0 CEO 1ページ（浜田向け）

### 0.1 目的

今日（7/11）は **kintone implement なし**。「自律・ミス削減・安全・確実」を第一目標に **AI チームの OS** を文書化する。

### 0.2 6役（1行）

| 役割 | 担当 | 浜田 |
|------|------|------|
| 指揮・検証 | CIO（Opus 4.8） | — |
| 着手前盲点 | DeepSeek | — |
| Diff | Composer 2.5 Subagent | — |
| 長文精査 | Kimi | — |
| lint/test 緑ループ | Grok L2b C（条件付き） | — |
| GO・目視 | — | **浜田** |

### 0.3 1 implement ターン

`cio:turn-start --strict` → `cio:tool:route` → 5038 → Composer →（Grok C?）→ `cio:report-verify-response` → turn-complete

### 0.4 セッション終わり

`cio:session:export-handoff` → `session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync` →（指示時）`cio:session:close-git`

### 0.5 浜田の作業

GO · 仕様判断 · 画面目視 · §41 一問。**npm / deploy 依頼なし**（§35-1 / TSB-024）。

---

## §1 AI チーム合意記録（2026-07-11）

| 役割 | モデル | 合意 | 1行 |
|------|--------|:----:|-----|
| ① CIO | Opus 4.8 | GO | 4+1+1 柱・状態機械・△対策表を正本化。実装は合図後 |
| ⑤ DeepSeek | deepseek-chat | GO | v3 の 6 柱＋状態機械＋△全件対策＋既存 npm 統合を仕様書化 |
| ③④⑥ OpenRouter | gpt-4.1-mini | GO | 最適化と統合を含む AI オペレーション仕様確定 |
| ④ Kimi | kimi（第2–3R） | GO | 外部 AI 出力は CIO 検収必須・事実は npm/git のみ |
| ② Architect | — | N/A | 本 spec は 2 レーン未満・200 行未満のため Architect 起動不要 |
| **CEO** | 浜田 | **GO** | 仕様書作成・commit push（実装は確認後合図） |

**合議ラウンド**: 3（2026-07-11 JST）。第3ラウンド △ 全件に対策を付与済み。

---

## §2 第一目標

1. **確実** — 手順を npm / runbook で完走（記憶依存を減らす）
2. **安全** — Tier B・破壊操作は GO ゲートを越えない
3. **ミス削減** — 再発パターンをゲート化（`verify:cio-miss-reduction-governance` 拡張）
4. **自律** — 開発=AI（§35-1）。浜田は GO・目視のみ

---

## §3 柱 A — ターン契約（implement 1 件）

### 3.1 標準順序

| # | ステップ | 正本 npm / 手順 |
|---|----------|-----------------|
| 0 | ターン開始 | `npm run cio:turn-start -- --strict` |
| 1 | ルーティング | `npm run cio:tool:route -- --intent "…" --log` |
| 2 | 5038 | DeepSeek 1 問 → 突合 3 行 → `npm run cio:guard:5038 -- --stamp` |
| 3 | 実装 | **customize/** or 80 行超 → Composer Subagent のみ |
| 4 | Grok C（任意） | §4 決定木を満たすときのみ |
| 5 | 報告検証 | `npm run cio:report-verify-response -- --file <下書き>` exit 0 |
| 6 | ターン完了 | `npm run cio:turn-start -- --complete --strict` |

### 3.2 例外表

| 条件 | 動作 |
|------|------|
| turn-start `--strict` exit 2 | **報告のみターン**（Edit/Shell 禁止） |
| 5038 証跡なし | Edit 禁止（`cio:guard:5038` 既存） |
| tool:route 該当なし | CIO 手動航海図 + 理由 1 行 |
| Composer Subagent 失敗 | 再 dispatch **1 回** → 仍失敗 → 柱 F |
| report-verify exit ≠ 0 | **送信禁止** |
| deploy 後 garble 1 回目 | #S1: `deploy-customization.js` sync リトライ（**実装済**） |
| deploy 後 garble 2 回目 | 柱 F rollback |

### 3.3 5038 簡易マトリクス

| 状態 | 動作 |
|------|------|
| 証跡なし | Edit / deploy 禁止 |
| `cio:turn-start --strict` + 証跡なし | exit 2 |
| 正当スキップ | `cio:guard:5038 -- --skip "理由"` + `§50-3-8 スキップ理由:` 1 行 |

### 3.4 report-verify 合格基準

`scripts/cio-chat-report-selfcheck.mjs`（`cio:report-verify-response`）の **exit 0 条件**を満たすこと:

- §1 先頭 4 行（ティア・適用憲法・🎖️・ルール確認）
- 報告ターン: §M-2 V2 七行
- CEO 最低基準ブロック（該当時）
- 禁止語なし · SPEC_TOUCHED / SECOND_REVIEWER 矛盾なし

### 3.5 turn-start 拡張（P1a・合図後）

既存 `scripts/cio-turn-start.mjs` に **契約 3 行**を追加出力（新 script 禁止）:

1. 本ターン Goal（1 行）
2. 触る正本パス（最大 2）
3. `SPEC_TOUCHED: yes|no` 予定

---

## §4 柱 B — 役割境界

### 4.1 起動条件表

| 役割 | 起動条件 | 禁止 |
|------|----------|------|
| DeepSeek | customize / SPEC / deploy 前 | 指揮代行 |
| Composer | customize/** · 80 行超 diff | §50-3-8 なし単独 save/deploy |
| Grok L2b C | §4.2 決定木 ALL OK | deploy / push / kintone PUT |
| Kimi | 80 行超 · 長文 SPEC | diff 適用 · 指揮 |
| Architect | 3 レーン以上 **or** spec 200 行超 | 常時起動 · deploy |
| Visual ⑥ | CEO 向け図 1 枚 | コード diff |
| Fable L4 | Self-Heal 3 回超 · §47-A 級 | 常時起動 |

**レーン定義**: `kintone-apps.md` 行 + `data/cio-project-closures.json`（付録 A）。

### 4.2 Grok C 決定木

`docs/runbooks/cio-grok-execution-loop.md` C1–C7 を参照。**1 つでも NG → Grok C 起動しない**。

```
check-c-ready exit 0 ?
  YES → Grok C（上限 C7: 15 call / 10 min）
  NO  → Mode B または CIO 直（lint ループ最大 2 回）
```

CIO が **【Grok 実行契約】** を代行。Composer は Grok 条件を直接扱わない。

### 4.3 外部 AI 検収（全員共通）

| 出力元 | タグ | 検収 |
|--------|------|------|
| DeepSeek / Kimi / OpenRouter / Composer / Grok | `[EXTERNAL-AI-DRAFT]` | CIO が npm/git と突合後に正本化 |
| 事実・数値 | — | **npm 出力 / git log のみ**（AI 生成パス名禁止） |

---

## §5 柱 C — 記憶外部化

### 5.1 bridge `lastFailures[]`（P0・合図後）

`scripts/cio-session-export-handoff.mjs` の bridge オブジェクトに追加:

```json
"lastFailures": [
  { "id": "S1-garble", "at": "ISO8601", "verify": "npm run …", "note": "1行" }
]
```

**収集源**（最大 3 件）:

- 当セッション verify exit ≠ 0
- 夕反省 #S / #R（承認済み）
- debug-tips 追補候補

### 5.2 既存資産（再発明禁止）

| 機能 | 正本 | 状態 |
|------|------|------|
| handoff repair | `cio:handoff:repair-latest` | 実装済 |
| debug-tips マージ | `cio-debug-tips-stock.mjs` | export 時実行済 |
| turn-start | `cio-turn-start.mjs` | 拡張のみ |
| garble retry #S1 | `deploy-customization.js` L158 | 実装済 |

### 5.3 export 原子化（R3 対策・P0）

`export-handoff` 内: **repair → bridge 書込 → tips stock** を同一 try ブロック。失敗時 bridge **不更新** + exit 1。

### 5.4 B-MDFLOW（§MDD）

Markdown を唯一の契約面: SPEC → 航海図（Goal/Constraints/Acceptance）→ diff → verify → handoff 1 行。

- 語彙正本: `AGENTS.md` §50-3-2a
- 領域例: `templates/yojitsu-budget-lite/SPEC.md` §10.5
- **評価タイミング**: 新ターン `cio:turn-start` 時に関連 SPEC 先頭 50 行を Read

---

## §6 柱 D — Tier 安全弁

| から | へ | 条件 |
|------|-----|------|
| Tier A | Tier B | kintone PUT · deploy · 破壊 REST · `.mdc` 憲法改定 |
| Tier B | 実行 | 浜田 GO 1 件 → AI execute |
| 「急ぎ」 | — | Tier B 省略不可 · 5038 skip のみ `--skip`+理由 |

---

## §7 柱 E — 観測（新設 npm なし）

| タイミング | npm |
|------------|-----|
| WAKE 後 | `npm run cio:health` |
| 報告前 | `npm run report:pipeline-status` |
| 朝 | `docs/reports/<今日>-morning-prep.md` |
| deploy 後 | #S1 + `verify:cio-kintone-apps-portfolio-build` |
| 週次 | `npm run cio:weekend:autonomous-audit` |

---

## §8 柱 F — 回復

| 段 | 条件 | アクション |
|----|------|------------|
| F1 | verify 1 回 fail | 修正 → 再 verify |
| F2 | verify 2 連続 fail | `npm run cio:composer:escalation-guard` |
| F3 | garble 2 回目 | `kintone-apps.md` rev 復元手順（5 行・§8.1） |
| F4 | Self-Heal 3 回上限 | `npm run cio:error:generate-ticket` → CEO 3 択 |

### 8.1 rollback 手順（garble 2 回目）

1. `git show HEAD:kintone-apps.md` または直前 commit の portfolio 行を確認
2. 当該 app BUILD/rev 行を **1 行**に復元（手動 Edit · Tier A）
3. `npm run verify:cio-kintone-apps-portfolio-build`
4. `bridge.lastFailures` に `garble-rollback` 記録
5. handoff 1 行追記

---

## §9 状態機械

```
ORIENT
  → TURN_OPEN
  → [柱 A 完走]
  → TURN_CLOSED
  → SESSION_EXPORTING（export-handoff のみ）
  → bridge + lastFailures + tips
  → SESSION_CLOSED（sync + close-git）
```

**禁止**: TURN_OPEN 中の export-handoff（implement 途中荷造り）。

---

## §10 実装フェーズ（浜田合図後）

| Phase | 内容 | 検証 |
|-------|------|------|
| **P0** | lastFailures + export 原子化 | `verify:session-handoff-integrity --import` |
| **P1a** | turn-start 契約 3 行 | `verify:cio-18-countermeasures` |
| **P1b** | 本 spec needles | `verify:cio-miss-reduction-governance` |
| **P1c** | #S1 配線監査 | `verify:cio-kintone-apps-portfolio-build` |
| **P2** | `cio-four-ai-governance.md` 追補 | `verify:cio-four-ai-governance` |
| **P3** | 運用 1 週後 — strict 遵守を夕反省 #S 化 | 任意 |

**本コミット範囲**: **本 spec + checkpoint/handoff 更新のみ**（P0–P3 コード未着手）。

---

## §11 △ / リスク対策一覧（第3R 確定）

| ID | 対策 | 残留 |
|----|------|------|
| △1 Grok 煩雑 | CIO 契約代行 + 決定木 | 低 |
| △2 turn-start 形骸化 | `--strict` + 契約 3 行 | 低 |
| △3 状態不整合 | §9 状態機械 | 低 |
| △4 hallucination | 外部 AI 検収表 | 低 |
| △5 P0 単独不足 | P0+P1 バンドル | 低 |
| △6 レーン語彙 | 付録 A | 低 |
| △7 report-verify | §3.4 | 低 |
| R1 garble | #S1 済 + F3 rollback | 中→低 |
| R2 rollback | §8 | 中→低 |
| R3 export 失敗 | §5.3 原子化 | 低 |

---

## 付録 A — レーン語彙

| 語 | 意味 |
|----|------|
| レーン | `kintone-apps.md` 1 アプリ行 or クローズ ID 1 件 |
| 3 レーン以上 | 異なる appId / closure グループを **同一ターン**で変更 |
| 部分 GO | checkpoint HTML コメント `部分GOスコープ` |

---

## 付録 B — 関連正本

| パス |
|------|
| `docs/runbooks/cio-grok-execution-loop.md` |
| `docs/runbooks/cio-four-ai-violation-remediation.md` |
| `docs/runbooks/ai-team-tool-routing-v2.md` |
| `docs/runbooks/session-lifecycle-v2.md` |
| `docs/plans/2026-07-04-ai-team-six-roles-spec.md` |
| `scripts/cio-turn-start.mjs` |
| `scripts/cio-session-export-handoff.mjs` |

---

## 改定履歴

| 日付 | 内容 |
|------|------|
| 2026-07-11 | v3 初版 — 3R 合議 + CEO GO（spec のみ commit） |
