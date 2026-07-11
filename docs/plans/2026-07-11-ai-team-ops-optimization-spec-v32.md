# AI チーム運用最適化 — 仕様 v3.2（体制改善 A–J + K）

> **地位**: `docs/plans/2026-07-11-ai-team-ops-optimization-spec.md`（v3）の **追補正本**。憲法 § 改変なし（第3 runbook / plan / script 層）。  
> **実装**: **本書 commit + push 後・浜田 GO 後**に Phase 1 着手。  
> **今夜セッション**: 憲法改善・統合は **別レーン**（本書は触れない）。

---

## §0 CEO 1ページ

### 0.1 目的

6役 + Grok L2b 体制の **運用摩擦**（ゲート過多・§50-3-8 スキップ・形骸化）を、**憲法を改めず** runbook / npm / gate で改善する。

### 0.2 パッケージ一覧

| ID | 名称 | 概要 |
|----|------|------|
| **A** | Lite lane | 軽微 doc 向け L0-micro（customize 禁止） |
| **B** | §50-3-8 強制 | customize セッションの close-git 前 audit |
| **C** | Grok C preset | 契約テンプレ + dry-run 上限 |
| **D** | turn-start tier | quick / standard / strict |
| **E** | KPI metrics | 週次5指標 |
| **F** | Architect 閾値 | 起動チェックリスト + routing |
| **G** | P3 夕反省連携 | 週1 #S 自動提案 |
| **H** | verify:team-ops-v2 | 統合 verify + runtime probe |
| **I** | feature flags | `CIO_LITE_LANE` 等・ロールバック弁 |
| **J** | Desktop 30番 §9 | 浜田確認用・閾値表 |
| **K** | anti-hollow | 形骸化 runtime probe + skip 品質 |

### 0.3 確定閾値（2026-07-11 合議）

| 閾値 | 選択 | 内容 |
|------|------|------|
| **L1** | Lite 境界 | 1 path・**非 customize**・Tier A・**20行以下**・deploy なし |
| **B1** | 5038 audit | `customize/**` 変更セッションの **close-git 前** audit（NG→commit ブロック） |
| **C1** | Grok 初回 | 本 repo **最初の2回は dry-run のみ**（3回目以降実 C or 禁止） |

### 0.4 浜田の作業

- **本書まで**: spec 確認のみ（commit/push は AI）  
- **実装 GO 後**: 画面目視・§41（仕様判断時のみ）  
- **npm / deploy 依頼なし**（§35-1 / TSB-024）

---

## §1 AI チーム合意記録（v3.2 最終合議 · 2026-07-11）

| 役割 | 合意 | 1行 |
|------|:----:|-----|
| ① CIO | **GO** | H+K 先行で形骸化を悪化させず実装可。Phase 分割必須 |
| ⑤ DeepSeek | **GO** | 憲法不改・spec→push→浜田GO の手順妥当。懸念なし |
| ③ Composer | **GO** | strict のみ customize。Subagent 境界維持 |
| ④ Kimi | **GO** | 外部 AI 出力は CIO 検収・事実は npm/git のみ |
| ⑥ Visual | N/A | 本パッケージ対象外 |
| Grok L2b | **GO** | C preset + C1 dry-run。deploy 禁止維持 |
| **CEO 浜田** | **保留→GO 待ち** | 本 commit/push 後に **実装 GO** を §41 で確認 |

**合議ラウンド**: v3.2 最終（形骸化監査・△クリア表反映後）

---

## §2 形骸化防止原則（5条）

1. **チャットだけの証跡は無効** — `5038-stamp.json` / MCP ログ / npm 出力 / git のみ  
2. **WARN は暫定** — 同一 WARN が **2セッション連続** → strict 昇格（runbook 記載）  
3. **スキップ率を KPI 化** — customize セッションで 5038 skip **30%超 → RED**（案 E）  
4. **新ゲートは重複禁止** — Lite + quick + 体裁 skip の三重回避は設計 NG  
5. **verify は runtime probe 必須** — needle のみの新 verify は不可（案 H/K）

---

## §3 既存形骸化（H0–H9）と対策マップ

| ID | 現状 | 対策案 |
|----|------|--------|
| H0 | ターン契約3行がチャットに載らない | D strict + K probe |
| H1 | customize で §50-3-8 未実施 | B + K2 |
| H2 | 🎖️ コピペ | K3（任意）diff 突合 WARN |
| H3 | stamp 形だけ | B + K2 禁止フレーズ |
| H4 | verify needle のみ | H + K runtime probe |
| H5 | Grok C 手動ループ | C preset |
| H6 | pre-implement 表示のみ | D strict 連携 |
| H7 | report-verify 形だけ | 既存維持 + E 監視 |
| H8 | ティア L2 固定 | 運用注意（今夜憲法で議論可） |
| H9 | ops △2「残留低」誤記 | **本書で訂正 → 残留 中** |

---

## §4 △クリア表

| △ID | クリア条件 | Phase |
|-----|------------|-------|
| X1 | Phase ごと smoke + `verify:team-ops-v2` OK | 各 |
| X2 | Lite でも K2 skip 品質 | 4 |
| X3 | quick + diff 非空 → exit 2 | 2 |
| X4 | Grok hash + dry-run 上限 C1 | 5 |
| X5 | `.mdc`/`AGENTS` は Tier B フラグ | 全 |
| X6 | KPI 閾値超え → runbook 提案 | 6 |
| △A1 | Lite 率 ≤20% | 4 |
| △A2 | customize → Lite 拒否 | 4 |
| △B1 | audit = customize セッションのみ | 3 |
| △B2 | skip 20字+ + 禁止フレーズ NG | 3 |
| △C1 | contractHash ≠ diff → 拒否 | 5 |
| △C2 | dry-run 2回上限 C1 | 5 |
| △D1 | quick は diff 空のみ | 2 |
| △D2 | tier×lane マトリクス固定 | 2 |
| △E1 | 5指標固定 | 6 |
| △F1 | Architect 月2回ソフト上限 | 6 |
| △G1 | 自動 #S 週1上限 | 6 |
| △H1 | runtime probe 3本 | 1 |
| △I1 | feature flag デフォルト+期限 | 1 |
| △J1 | 30番 §9 フェーズごと更新 | 2+ |

**v3 §11 △2 訂正**: turn-start 形骸化 残留 **低 → 中**（△H1 CLOSED まで）

---

## §5 案別仕様（要約）

### A — Lite lane（L0-micro）

- 条件: L1 すべて満たす  
- 禁止: `customize/**` · `deploy:*` · `.cursor/rules/**` · `AGENTS.md`  
- 証跡: `§50-3-8 スキップ理由:` 1行 + `logs/cio-turn-start/lite-usage.json`  
- npm: `cio:turn-start -- --tier lite`（Phase 4）

### B — §50-3-8 session audit

- タイミング: B1 — `cio:session:close-git` 前  
- 対象: 当セッションで `customize/**` に diff あり  
- 合格: `5038-stamp.json` or DeepSeek MCP ログ or `cio:guard:5038 --stamp`  
- npm: `cio:guard:5038-session-audit`（Phase 3・新規）

### C — Grok C preset

- npm: `cio:grok:contract-preset -- --app <id> --done-when "npm run …"`  
- C1: `--dry-run` 必須が先 2 回  
- 既存 `cio:grok:execution-guard` 連鎖維持

### D — turn-start tier

| tier | Edit | Shell | 契約 |
|------|:----:|:-----:|------|
| quick | ✕ | read npm のみ | Goal 1行 |
| standard | ○ Tier A | ○ 非 deploy | 3行 |
| strict | ○ | ○ | 3行 + pre-implement |

- quick: **git diff 非空 → exit 2**  
- customize/**: **strict のみ**

### E — KPI（週次5指標）

1. §50-3-8 skip 率（customize）  
2. Grok C 起動 / 緑化率  
3. Lite 使用率  
4. report-verify 失敗回数  
5. bridge.lastFailures 件数  

- npm: `cio:team-ops-metrics`（Phase 6）

### F — Architect

- 起動: 3レーン+ or spec 200行+（既存）  
- runbook チェックリスト + `cio:tool:route --intent architect-review`

### G — P3 夕反省

- lastFailures と重複提案禁止  
- 自動 #S **週1件上限**  
- scope: `evening-reflection-scope.md` 厳守

### H — verify:team-ops-v2

- 既存 needles + **runtime probe**（K）  
- Phase 1 必須

### I — feature flags

| 変数 | 既定 | 用途 |
|------|------|------|
| `CIO_LITE_LANE` | `1` | Lite 無効化 |
| `CIO_TURN_TIER_STRICT` | `0` | 全 tier strict 強制 |

### J — Desktop 30番 §9

- 閾値 L1/B1/C1 + 週次解釈1行  
- `npm run session-starter:sync-desktop` 同ターン

### K — anti-hollow

**K2 禁止フレーズ**（skip 不可）: `形式のみ` `同上` `省略` `軽微のため` `時間のため` `浜田GO`（単独）

**runtime probe 3本**:

1. `cio:turn-start --strict` 証跡なし → exit 2  
2. `cio:guard:5038 -- --skip "形式のみ"` → exit 1  
3. `cio:turn-start --tier quick` + diff 非空 → exit 2  

- npm: `verify:team-ops-antihollow`（H に内包）

---

## §6 実装フェーズ

| Phase | 内容 | 検証 |
|-------|------|------|
| **0** | 本 spec + 合意記録 | 浜田 GO 待ち |
| **1** | H + K + I | `verify:team-ops-v2` `verify:team-ops-antihollow` |
| **2** | D + J | `cio-turn-start` tier + 30番 §9 |
| **3** | B + K2 | `cio:guard:5038-session-audit` |
| **4** | A | Lite + △A1 A2 |
| **5** | C | `cio:grok:contract-preset` + C1 |
| **6** | E + G + F | `cio:team-ops-metrics` |
| **7** | 全 verify + smoke + desktop sync + handoff 1行 | `smoke:quiet` |

**禁止**: Phase 跨ぎ一括 commit · kintone deploy · 憲法条文改定（今夜まで）

---

## §7 関連正本

| パス |
|------|
| `docs/plans/2026-07-11-ai-team-ops-optimization-spec.md`（v3） |
| `docs/plans/2026-07-04-ai-team-six-roles-spec.md` |
| `docs/plans/2026-07-09-grok-l2b-hybrid-spec.md` |
| `chat-sessions/desktop-ai-emergency-read-pack/30-AI-TEAM-ORG-CHART.txt` |
| `docs/runbooks/cio-grok-execution-loop.md` |
| `docs/runbooks/cio-four-ai-violation-remediation.md` |

---

## §8 検証（実装後）

```bash
npm run verify:team-ops-v2
npm run verify:team-ops-antihollow
npm run verify:cio-miss-reduction-governance
npm run smoke:quiet
```

---

**版**: v3.2 · 2026-07-11 JST · AI チーム全員合意（実装 GO は浜田 §41 待ち）
