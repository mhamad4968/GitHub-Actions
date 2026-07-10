# 非憲法ルール最適化 — 完全仕様 v1（2026-07-11）

> **地位**: 7/11 運用最適化デー · ルール索引・`.mdc` 薄型・verify 正本。**憲法 § / `constitution.mdc` 本文は改変しない**（第3 plan 層）。  
> **実装**: **本書 GO 済（浜田 2026-07-11 · spec commit）· `.mdc` / script 変更は §10 フェーズ順 · 実装 GO は別途**  
> **版**: **v1.0**（R5 合議 · △17 件 CLOSED · 後日対応ゼロ · 全員 GO）  
> **上位**: [`docs/constitution/00-rule-hierarchy.md`](../constitution/00-rule-hierarchy.md) / [`2026-07-11-ai-team-ops-optimization-spec.md`](2026-07-11-ai-team-ops-optimization-spec.md) / [`2026-07-11-mcp-tools-consolidation-spec.md`](2026-07-11-mcp-tools-consolidation-spec.md)

---

## §0 CEO 1ページ（浜田向け）

### 0.1 目的

`.cursor/rules` **60 本**・索引 **3 系統**・runbook **82 本**に散在する運用ルールについて、**ルール消失・解釈変更なし**で **発見・整合・機械検証**を強化する。

### 0.2 数字（確定）

| 項目 | 値 |
|------|-----|
| 対象 `.mdc` | 60（`constitution.mdc` 網羅版は **触らない**） |
| `cio-rules-topic-index` 欠落 | **14 件** → 追加で **100%** |
| `cursor-rules-topic-index` | 9 トピック → **15 ジャンル**（P2 一括） |
| `.mdc` 削除・リネーム | **0**（全フェーズ） |
| 幽霊 `.mdc` 復元 | **2**（`persist-policies` · `preflight-checklist`） |
| 新設 verify | **6**（§12） |
| 新設 data JSON | **4**（§11） |

### 0.3 設計原則（4）

1. **退行なし** — MUST/禁止/順序固定は needle で機械保持（§2）  
2. **追加優先** — P1 は **純削除 0**（CLOSE 順序は **追記で整合**）  
3. **憲法境界** — `AGENTS.md` § 条文 · `constitution.mdc` 本文 **不改変**  
4. **後日なし** — P1→P2→P3 を **同一 GO-B 内完走**（途中「明日」禁止）

### 0.4 浜田作業

| 段階 | 内容 |
|------|------|
| **GO-A** | 本 spec 承認 · commit push（**本ターン完了**） |
| **GO-B** | P1→P2→P3 実装指示（**別メッセージ**） |
| **Tier B** | なし（リポ内 docs/script/.mdc のみ） |

### 0.5 commit ルール優先（I7 固定）

User rules「commit は依頼時のみ」と憲法 **B1/セッション締め** が矛盾する場合:

- **Tier B · 破壊操作 · セッション締め B1** → 憲法手順優先  
- **本 spec 実装** → 浜田 **GO-B 明示ターンのみ** commit/push  
- **単独 AI commit 禁止**（GO なし）

---

## §1 AI チーム合意記録（R1–R5 · 2026-07-11）

| 役割 | モデル | 合意 | 1行 |
|------|--------|:----:|-----|
| ① CIO | Opus 4.8 | **GO** | 7 層→3 入口 · 追加優先 · 3 batch 完走 |
| ⑤ DeepSeek | deepseek-chat | **GO** | △17 CLOSED · needle + verify 5 重ガード |
| ③ OpenRouter | gpt-4.1-mini | **GO** | JSON 正本 2 本 · 幻覚 npm 追加なし |
| ④ Kimi | CIO 代行 | **GO** | constitution 不改変 · 幽霊は .mdc 復元 |
| ② Architect | — | **GO** | 統合否決 · discovery map で完結 |
| **CEO** | 浜田 | **GO-A** | spec 作成 · commit push（実装は GO-B 後） |

**合議ラウンド**: 5（R5 · **△ゼロ · 全員 GO**）。

### §1.1 R2 所見（要約）

- CLOSE 順序 **3 系統不一致**（boundary-close が sync/clock 欠落）  
- 索引 **3 系統**（cursor-index CI 完全 · cio-index **14 欠落**）  
- 幽霊 `.mdc` 2 件 · `ai-agent-tools` 陳腐 · MCP 5 層重複  
- `session-handoff` トピックに **23 .mdc 混在**（ジャンル汚染）

### §1.2 R3/R4 追加

- **削るより足す**（CLOSE · persist 復元）  
- **Interpretation Lock** 10 件  
- **every-turn 4→1 統合は否決**（P3 別日も禁止）

### §1.3 R5 確定

- **T1–T17 すべて CLOSED**（§6）  
- **cio-18 alwaysApply:true 維持**（CEO 2026-05-30 · CI whitelist 2 本）  
- **`verify:rules-optimization`** 一括ゲートで完了判定

---

## §2 「ルール退行なし」の定義

次の **いずれか** が起きたら **ルール退行** — commit 禁止:

| # | 退行 |
|---|------|
| R1 | 変更前 MUST/禁止/固定順序が、変更後 **同等以上の強度** で残らない |
| R2 | `.mdc` を「runbook 参照」1 行にしたが、runbook に **同一 ID**（R-SESS-01 等）が無い |
| R3 | 60 `.mdc` のいずれかが discover 経路から脱落（cursor-index / cio-index / RULES-INDEX 自動節） |
| R4 | 既存 `verify:*` / `smoke:quiet` / `verify:constitution-handoff` の **新規 NG** |
| R5 | `AGENTS.md` § · `constitution.mdc` 本文の意図変更 |

**完了宣言**（DEL-2 教訓）: 「P1/P2 完了」= §12 verify パック **全 exit 0** + §19 S12 テンプレ。**それ以前は禁止**。

---

## §3 現状スナップ（2026-07-11）

| 指標 | 値 |
|------|-----|
| `.cursor/rules/*.mdc` | 60 |
| `alwaysApply: true` | 2（`cio-constitution` · `cio-18-zero-tolerance`） |
| `globs` なし | 12 |
| `cursor-rules-topic-index` カバー | 100%（CI） |
| `cio-rules-topic-index` カバー | 77%（**14 欠落**） |
| `session-lifecycle-v2` full CLOSE | export → sync → clock → close-git |
| `session-boundary-close-gate` full CLOSE | export → **close-git 直**（**不整合**） |

### §3.1 cio-index 欠落 14 件（P1 で追加）

```
cio-deploy-ledger-gate.mdc
cio-git-history-alignment-gate.mdc
cio-kintone-live-schema-gate.mdc
cio-project-closure-gate.mdc
cio-session-close-git-gate.mdc
cursor-generate-image-assets.mdc
doc-lane-gate.mdc
file-copy-exact-path.mdc
mode-b-mdc-canonical-linter.mdc
modern-web-official-docs.mdc
next-session-jbis-followups.mdc
security-training-materials.mdc
session-boundary-close-gate.mdc
session-close-execute-first.mdc
```

---

## §4 多重構造（7 層 → 3 入口）

| 層 | 代表 | 本 spec での扱い |
|----|------|------------------|
| L1 憲法長文 | AGENTS · constitution.mdc | **触らない** |
| L2 Cursor 注入 | cio-constitution + globs | cio-18 **維持** · whitelist 明文化 |
| L3 索引 | RULES-INDEX · cursor-index · cio-index | **P2 整合** |
| L4 手順 | runbooks | CLOSE **JSON 正本**追加 |
| L5 機械 | npm verify | **6 本新設** |
| L6 人間 | Desktop AI緊急用 | 既存維持 |
| L7 skills | 11 SKILL | cio-index **+3 skills** |

**3 入口（P2 `cio-rules-discovery-map.md`）**:

1. **毎ターン** → `cio:turn-start` + `mode-b-canonical.mdc`  
2. **タスク別** → `cio:tool:route` + cursor-index 15 ジャンル  
3. **セッション** → `session-lifecycle-v2.md` + `cio-session-close-chain.json`

---

## §5 正式否決（再検討不要）

| 案 | 理由 |
|----|------|
| `.mdc` 削除・リネーム | verify needle / handoff 連鎖破壊 |
| every-turn 4→1 統合 | hooks · `verify-constitution-handoff` needle |
| cio-18 `alwaysApply: false` | 挙動変更 — whitelist で代替 |
| constitution.mdc 内リンク修正 | スコープ外 — **.mdc 復元**でリンク再有効化 |
| P3 別日 turn-contract | 後日対応禁止 |
| 15 ジャンル分割実施 | **P2 一括のみ** |

---

## §6 △クリア表（T1–T17）

| ID | CLOSED 策 | verify |
|:--:|-----------|--------|
| T1 | boundary-close に R-SESS-01/03 **追記** | `verify:rules-close-chain` |
| T2 | `persist-policies.mdc` 薄型復元 | `verify:rules-preservation-needles` |
| T3 | `preflight-checklist.mdc` ルーター復元 | `verify:rules-ghost-mdc` |
| T4 | cio-index 14 件追加 | `verify:cio-rules-topic-index` |
| T5 | cio-18 alwaysApply **維持** + CI whitelist | `verify-ci-rule-integrity` |
| T6 | cio-18 false 化 **不実施** | — |
| T7 | ai-agent-tools parity 更新 | 手動 + smoke |
| T8 | MCP 正本 = routing + triggers | 既存 verify |
| T9 | 統合否決 · discovery map 新設 | — |
| T10 | cursor-index 9→15 一括 | `verify:cursor-rules-index` |
| T11 | no-globs → `discoveryOnly:true` | schema verify |
| T12 | `cio-rules-topic-meta.json` sidecar | 単体 verify |
| T13 | `cio-session-close-chain.json` | T1 と同一 |
| T14 | `rules-interpretation-lock.json` | `verify:rules-interpretation-lock` |
| T15 | S12 完了テンプレ | 手順 |
| T16 | I7 commit 優先（§0.5） | Lock JSON |
| T17 | RULES-INDEX 注記（AGENTS § 不改変） | `rules:sync-mdc-index` |

---

## §7 Protected 20（本文削除・大幅薄型化禁止）

```
cio-constitution.mdc
mode-b-canonical.mdc
every-turn-rules-confirm.mdc
auto-read-by-topic.mdc
cio-operating-loop.mdc
cio-18-zero-tolerance.mdc
constitution-handoff-gate.mdc
session-handoff.mdc
session-close-execute-first.mdc
session-boundary-close-gate.mdc
cio-discipline-always.mdc
mcp-server-use-triggers.mdc
deepseek-pre-edit-gate.mdc
cio-handoff-export-validate-gate.mdc
constitution-enforcement-core.mdc
constitution-brief-card.mdc
docs/runbooks/session-lifecycle-v2.md
chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt
cio-constitution.mdc（重複記載禁止 — 核）
verify:constitution-handoff needles 参照ブロック（NEW-SESSION-STARTER 連結）
```

---

## §8 Interpretation Lock（I1–I10 · 変更禁止）

`data/rules-interpretation-lock.json` に機械化。要旨:

| ID | Lock |
|:--:|------|
| I1 | auto-read description「alwaysApply」= **YAML false のみ** |
| I2 | partial「OK」≠ implement GO |
| I3 | 案件 CLOSED ≠ セッション締め |
| I4 | `cio:session:cold-start` ⊃ `session:bootstrap` |
| I5 | alwaysApply true **2 本** = CEO 2026-05-30 正式例外 |
| I6 | 開発=AI · Tier B/破壊は GO |
| I7 | user commit 依頼 < 憲法 B1/締め（§0.5） |
| I8 | runbook 正本 > .mdc 想起 |
| I9 | RULES-INDEX § 軸 ≠ cursor-index .mdc 軸 |
| I10 | 「完了」= verify 全緑 + 浜田 ACK |

---

## §9 ai-agent-tools parity（T7 · 節別）

| 節 | 現状 | P2 更新 |
|----|------|---------|
| §0–0.5 | 多 AI 協議 | **維持** |
| §1 Exa/Brave | 必須表記 | **DDG MCP + context7**（`docs/mcp-status.md`） |
| §2 Linear | 維持 | **維持** |
| §3 Puppeteer | 必須 | **Playwright MCP 優先**（`mcp-tool-discipline`） |
| §4 Mintlify | MCP 必須 | **2026-07-11 DEL-1 削除済 · repo docs 正本** |
| §5 禁止 | 維持 | **維持** |
| §6 未接続 | 維持 | **維持** |
| §7 適合記録 | 維持 | **維持** |

**削除対象**: 存在しない MCP を **必須**とする文のみ。義務は **代替経路へ移転**（§2 R1 回避）。

---

## §10 実装フェーズ（GO-B · 後日なし）

### §10.1 P1 — 追加のみ（commit 1 · **削除行 0**）

| # | 作業 | ファイル |
|---|------|----------|
| P1-1 | full CLOSE に sync/clock **追記**（§10.4 順序） | `session-boundary-close-gate.mdc` |
| P1-2 | persist 薄型復元（§10.5） | `.cursor/rules/persist-policies.mdc` **新規** |
| P1-3 | preflight ルーター（§10.6） | `.cursor/rules/preflight-checklist.mdc` **新規** |
| P1-4 | cio-index 14 件 + skills 3（§10.7） | `data/cio-rules-topic-index.json` |
| P1-5 | needle スナップショット | `data/rules-preservation-needles.json` **新規** |

**P1 DoD**:

```powershell
npm run verify:rules-close-chain
npm run verify:rules-ghost-mdc
npm run verify:cio-rules-topic-index
npm run verify:rules-preservation-needles
npm run verify:cursor-rules-index
npm run smoke:quiet
```

### §10.2 P2 — 機械基盤（commit 2 · 同一 GO-B）

| # | 成果物 |
|---|--------|
| P2-1 | `data/cio-session-close-chain.json`（§11.1） |
| P2-2 | `data/rules-interpretation-lock.json`（§8） |
| P2-3 | `data/cio-rules-topic-meta.json`（§11.2） |
| P2-4 | `scripts/verify-rules-close-chain.mjs` |
| P2-5 | `scripts/verify-rules-ghost-mdc.mjs` |
| P2-6 | `scripts/verify-rules-preservation-needles.mjs` |
| P2-7 | `scripts/verify-cio-rules-topic-index.mjs` |
| P2-8 | `scripts/verify-rules-interpretation-lock.mjs` |
| P2-9 | `scripts/sync-cio-rules-topic-index.mjs` |
| P2-10 | `data/cursor-rules-topic-index.json` **9→15**（§10.8） |
| P2-11 | `docs/runbooks/cio-rules-discovery-map.md` |
| P2-12 | `ai-agent-tools-constitution.mdc` parity 更新（§9） |
| P2-13 | `verify-ci-rule-integrity.mjs` whitelist 2 本 |
| P2-14 | `package.json` → `verify:rules-optimization` |
| P2-15 | RULES-INDEX 注記 T17 + `npm run rules:sync-index-all` |

**P2 DoD**: §12 全 verify exit 0。

### §10.3 P3 — 完了判定（commit 3 または P2 同梱）

```powershell
npm run verify:rules-optimization
npm run smoke:quiet
npm run verify:constitution-handoff
```

**P3 DoD**: 上記 **すべて exit 0** → §19 S12 で完了報告。

### §10.4 full CLOSE 正順（T1 · 全正本一致）

```
1. checkpoint-latest.md / handoff-log.md 更新
2. npm run cio:session:export-handoff
3. npm run verify:session-handoff-integrity -- --validate-export
4. npm run session-starter:sync-desktop
5. npm run verify:desktop-ai-emergency-sync
6. npm run session:clock:clear
7. npm run cio:session:close-git -- --execute --auto-stage --message "…"
8. npm run verify:session-close-git-warn
```

**boundary-close 追記位置**: 現 step 4–5 の **前に** 上記 4–6 を挿入（既存 step 4 close-git は **step 7 へ繰り下げ**）。

### §10.5 persist-policies.mdc（復元テンプレ · ≤25 行）

```yaml
---
description: 恒久方針の永続化 — 正本は .rag/extra-docs/persist-policies.md
alwaysApply: false
globs: "**/*"
---
```

本文必須ポインタ（needle）:

- `.rag/extra-docs/persist-policies.md` が **意味正本**  
- 対話前提 · 呼称 · OneDrive 禁止 · ルール追加整合性プロセス  
- `RULES-INDEX.md` 随時メモ優先  
- constitution.mdc §13/15/26/30/31 リンク **再有効化**（constitution 本文は不改変）

### §10.6 preflight-checklist.mdc（ルーター · ≤15 行）

```yaml
---
description: deploy 前 preflight — 正本 cio-discipline-always + push-deploy-quality-gates-v2
alwaysApply: false
globs:
  - customize/**
  - package.json
---
```

- 正本: `.cursor/rules/cio-discipline-always.mdc`  
- runbook: `docs/runbooks/push-deploy-quality-gates-v2.md`  
- npm: `npm run cio:preflight:<app> -- --note "…"`  
- **alwaysApply 表記禁止**

### §10.7 cio-index 追記マップ（14 件）

| 追加先トピック | 追加 .mdc |
|----------------|-----------|
| セッション・handoff | `session-boundary-close-gate` · `session-close-execute-first` · `cio-session-close-git-gate` · `cio-deploy-ledger-gate` · `cio-project-closure-gate` |
| kintone 全般 | `cio-kintone-live-schema-gate` |
| kintone customize | `mode-b-mdc-canonical-linter` |
| MCP | `cursor-generate-image-assets` |
| doc-lane | `doc-lane-gate` |
| セキュリティ | `security-training-materials` |
| 予実 | — |
| 新設 **Git履歴** | `cio-git-history-alignment-gate` |
| 新設 **Web公式** | `modern-web-official-docs` · `next-session-jbis-followups` |
| misc / 運用補助 | `file-copy-exact-path` |

**skills 追記 3**:

- `.cursor/skills/grok-execution-loop/SKILL.md`  
- `.cursor/skills/office-pptx-doc-lane/SKILL.md`  
- `.cursor/skills/office-docx-doc-lane/SKILL.md`

### §10.8 cursor-index 15 ジャンル（P2 一括）

| id | label | 主な files |
|----|-------|------------|
| G01 | 毎ターン・四行 | cio-core から every-turn, brief-card, cio-18, discipline |
| G02 | セッション WAKE | cold-start, handoff-gate, read-ladder, bootstrap 系 |
| G03 | セッション CLOSE | boundary-close, close-execute-first, close-git-gate, deploy-ledger |
| G04 | handoff・bridge | session-handoff, export-validate, operating-loop |
| G05 | 案件クローズ | project-closure-gate |
| G06 | Git履歴 | git-history-alignment-gate |
| G07 | kintone 実装 | kintone*, fields, live-schema, destructive-rest |
| G08 | customize deploy | constitutional-focus-customize, composer-*, preflight 想起 |
| G09 | MCP・ツール | mcp-*, ai-agent-tools, generate-image |
| G10 | 4AI・DeepSeek | deepseek-*, spec-logic-gate |
| G11 | doc-lane | doc-lane-gate, evening-reflection, report-min |
| G12 | 環境・障害 | env-*, error-ticket-*, debug-tips, dissolution-interlock |
| G13 | セキュリティ | snyk, security-news, training-materials |
| G14 | CI・GitHub | github-workflows, commit-msg-kimi |
| G15 | ドメイン glob | yojitsu, modern-web, jbis, file-copy, misc |

各 file に `"discoveryOnly": true|false`（globs なし 12 本は **true**）。

**version**: `2026-07-11-rules-opt-v1`

---

## §11 新設 data JSON スキーマ

### §11.1 cio-session-close-chain.json

```json
{
  "version": "2026-07-11",
  "fullClose": {
    "steps": [
      { "id": "CP", "npm": null, "files": ["chat-sessions/checkpoint-latest.md", "chat-sessions/handoff-log.md"] },
      { "id": "EXPORT", "npm": "cio:session:export-handoff" },
      { "id": "VALIDATE", "npm": "verify:session-handoff-integrity", "args": ["--validate-export"] },
      { "id": "SYNC", "npm": "session-starter:sync-desktop" },
      { "id": "DESKTOP", "npm": "verify:desktop-ai-emergency-sync" },
      { "id": "CLOCK", "npm": "session:clock:clear" },
      { "id": "CLOSE_GIT", "npm": "cio:session:close-git", "args": ["--execute", "--auto-stage"] },
      { "id": "WARN", "npm": "verify:session-close-git-warn" }
    ],
    "regulationIds": ["R-SESS-01", "R-SESS-03"]
  },
  "partialClose": {
    "steps": [
      { "id": "CP", "npm": null },
      { "id": "APPEND", "npm": "cio:handoff:append-block" },
      { "id": "EXPORT", "npm": "cio:session:export-handoff" }
    ]
  }
}
```

### §11.2 cio-rules-topic-meta.json

```json
{
  "version": "2026-07-11",
  "topics": {
    "セッション・handoff": {
      "npm": ["cio:session:cold-start", "verify:checkpoint-handoff-template"],
      "runbook": "docs/runbooks/session-lifecycle-v2.md"
    }
  }
}
```

`sync-cio-rules-topic-index.mjs` は **topics[].rules のみ**生成 · meta は **手編集 sidecar**（上書き禁止）。

---

## §12 verify パック

| npm | 脚本 | 役割 |
|-----|------|------|
| `verify:rules-close-chain` | `verify-rules-close-chain.mjs` | JSON ↔ 3 .mdc ↔ lifecycle-v2 |
| `verify:rules-ghost-mdc` | `verify-rules-ghost-mdc.mjs` | constitution/RULES-INDEX リンク実在 |
| `verify:rules-preservation-needles` | `verify-rules-preservation-needles.mjs` | P1 変更 .mdc の MUST 句 |
| `verify:cio-rules-topic-index` | `verify-cio-rules-topic-index.mjs` | cursor-index ⊆ cio-index |
| `verify:rules-interpretation-lock` | `verify-rules-interpretation-lock.mjs` | Lock JSON 存在 + 10 ID |
| **`verify:rules-optimization`** | **上記 + cursor-index + ci-rule-integrity + thin-rule-messaging** | **P3 一括** |

**package.json 追加例**:

```json
"verify:rules-optimization": "node scripts/verify-rules-close-chain.mjs && node scripts/verify-rules-ghost-mdc.mjs && node scripts/verify-rules-preservation-needles.mjs && node scripts/verify-cio-rules-topic-index.mjs && node scripts/verify-rules-interpretation-lock.mjs && node scripts/verify-cursor-rules-index.mjs && node scripts/verify-ci-rule-integrity.mjs && node scripts/verify-thin-rule-messaging.mjs"
```

---

## §13 rules-preservation-needles.json（P1 前に作成）

変更対象ごとに **3–10 needles**（部分文字列）。最低セット:

**session-boundary-close-gate.mdc**:

- `session-starter:sync-desktop`  
- `verify:desktop-ai-emergency-sync`  
- `session:clock:clear`  
- `R-SESS-01`  
- `R-SESS-03`  
- `partial CLOSE`  
- `案件 CLOSED`

**persist-policies.mdc**（新規）:

- `完全に人として扱う`  
- `さん」付け不要`  
- `OneDrive は使用禁止`  
- `RULES-INDEX.md`  
- `整合性チェックプロセス`

**preflight-checklist.mdc**（新規）:

- `cio-discipline-always`  
- `cio:preflight`  
- `45 分以内`

---

## §14 5 重ガード（G1–G5）

| # | 内容 |
|---|------|
| G1 | No-delete · No-rename · No-merge |
| G2 | needles 100% 一致 |
| G3 | §12 verify 全緑 |
| G4 | P2 で `verify-breaking-deletions` targets に変更 `.mdc` 追加 |
| G5 | Protected 20 本文削除禁止 |

---

## §15 ロールバック

| 段階 | 手順 |
|------|------|
| P1 NG | `git revert` P1 commit 1 件 |
| P2 NG | P2 commit 単独 revert（P1 は維持可） |
| verify 赤 | **完了宣言禁止** · 原因修正 **新 commit**（amend 禁止） |

---

## §16 MCP 統廃合との関係

- MCP spec v3.1 **完了済** — 本 spec は **ルール層のみ**  
- `ai-agent-tools` §4 Mintlify 削除記述は **MCP DEL-1 と整合**  
- `verify:mcp-deleted-refs` は **MCP 専用** — 本 spec では **触らない**

---

## §17 SCR チェックリスト（実装時）

| SCR | 内容 | フェーズ |
|-----|------|:--------:|
| SCR-R1 | P1 前 `git status` clean または spec のみ | P1 |
| SCR-R2 | boundary-close **追記 diff** で削除行 0 確認 | P1 |
| SCR-R3 | persist RAG needle 10/10 | P1 |
| SCR-R4 | cio-index 14 + skills 3 | P1 |
| SCR-R5 | CLOSE JSON と 3 正本一致 | P2 |
| SCR-R6 | cursor-index 15 · catalogVersion bump | P2 |
| SCR-R7 | `rules:sync-index-all` 同一ターン | P2 |
| SCR-R8 | `verify:rules-optimization` exit 0 | P3 |

---

## §18 完了報告テンプレ（S12）

```markdown
## ルール最適化 完了（2026-07-11）

- P1 commit: `<hash>` — 追加のみ · 削除 0
- P2 commit: `<hash>` — verify 6 本 + JSON 4 本
- verify:rules-optimization: exit 0
- verify:constitution-handoff: exit 0
- smoke:quiet: exit 0
- 未実施: なし
- 浜田 ACK: （1 行）
```

**「完了」は上記 + 浜田 ACK まで。**

---

## §19 改訂履歴

| 版 | 日付 | 内容 |
|----|------|------|
| v1.0 | 2026-07-11 | R1–R5 合議 · GO-A spec 正本 · △17 CLOSED |
