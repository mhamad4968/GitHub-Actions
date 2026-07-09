---
name: ai-team-tool-routing
description: >
  依頼意図から MCP / npm / 第2者 / verify を提案する。WORK 着手前に
  cio:tool:route を実行。正本 docs/runbooks/ai-team-tool-routing-v2.md
---

# AI Team Tool Routing

## いつ使う

- 依頼を受けて **WORK 着手前**（`cio:pre-implement-gate` の直後）
- 「どの MCP / npm を使うべき？」と迷ったとき
- deploy / セキュリティ / 障害復旧 / doc-lane など **カテゴリ横断**の依頼

## 手順

1. 依頼を 1 行に要約する
2. ルーティング提案:

```bash
npm run cio:tool:route -- --intent "<要約>" [--app <APP_ID>] [--log]
```

3. 出力の **skill / runbook** を Read
4. **MCP 呼出前**は `.cursor/rules/mcp-tool-discipline.mdc`（descriptor 必読）
5. **§50-3-8** が出力にあれば DeepSeek → 突合 → stamp
6. npm 列を **B v2 品質ゲート**順で実行

## Grok L2b（verify ループ）

lint/smoke NG かつ Composer 初回 Diff 済みのとき:

```bash
npm run cio:tool:route -- --intent "lint 修正ループ Grok"
```

→ Skill: `.cursor/skills/grok-execution-loop/SKILL.md`

## 正本

- Runbook: `docs/runbooks/ai-team-tool-routing-v2.md`
- Manifest: `data/cio-ai-team-tool-routing.json`
- MCP トリガー: `.cursor/rules/mcp-server-use-triggers.mdc`
- Lifecycle WORK: `docs/runbooks/session-lifecycle-v2.md` §4.3

## 検証

```bash
npm run verify:cio-tool-routing-infra
```
