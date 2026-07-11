# ルール発見マップ — 3 入口（2026-07-11）

> **正本**: [`docs/plans/2026-07-11-rules-optimization-spec.md`](../plans/2026-07-11-rules-optimization-spec.md)  
> **索引**: [`data/cursor-rules-topic-index.json`](../../data/cursor-rules-topic-index.json)（15 ジャンル）· [`data/cio-rules-topic-index.json`](../../data/cio-rules-topic-index.json)（npm/runbook 付き）

7 層に散在していた運用ルールの **AI 向け入口を 3 つ**に固定する。憲法 § · `constitution.mdc` 網羅版は **Read 必要時のみ**。

---

## 入口 1 — 毎ターン

| 順 | Read / 実行 |
|----|-------------|
| 1 | `npm run cio:turn-start`（strict 推奨） |
| 2 | `.cursor/rules/mode-b-canonical.mdc` — 四行テンプレ（コピー禁止） |
| 3 | `.cursor/rules/every-turn-rules-confirm.mdc` — §1e 報告 |

**ジャンル**: cursor-index `g01-every-turn`

---

## 入口 2 — タスク別

| 順 | Read / 実行 |
|----|-------------|
| 1 | `npm run cio:tool:route -- --intent "…" --log` |
| 2 | [`data/cursor-rules-topic-index.json`](../../data/cursor-rules-topic-index.json) でジャンル特定 → 該当 `.mdc` |
| 3 | runbook は [`data/cio-rules-topic-meta.json`](../../data/cio-rules-topic-meta.json) または cio-index の `runbook` フィールド |

**discoveryOnly: true** の .mdc は globs 未注入 — **索引から明示 Read**。

**3 入口（lifecycle-v2）**: 正本 `data/cio-rule-entry-points.json` · ナビ `docs/constitution/27-constitution-navigation-charter.md`。現役ゲート `data/cio-formalization-registry.json`（`26-formalization-lifecycle-charter.md`）。

---

## 入口 3 — セッション（WAKE / CLOSE）

| フェーズ | 正本 |
|----------|------|
| WAKE | `docs/runbooks/session-lifecycle-v2.md` §3 · `npm run cio:session:cold-start` |
| partial CLOSE | `session-boundary-close-gate.mdc` 判定 → checkpoint + append-block + export |
| full CLOSE | [`data/cio-session-close-chain.json`](../../data/cio-session-close-chain.json) · `session-close-execute-first.mdc` |

**verify**: `npm run verify:rules-close-chain`

---

## 幽霊 .mdc 復元（2026-07-11）

| ファイル | 役割 |
|----------|------|
| `persist-policies.mdc` | `.rag/extra-docs/persist-policies.md` ルータ |
| `preflight-checklist.mdc` | `cio-discipline-always.mdc` + deploy runbook ルータ |

---

## 完了判定

```powershell
npm run verify:rules-optimization
```

exit 0 + 浜田 ACK = ルール最適化完了（§18 S12）。
