# Grok L2b 実行ループ Skill

> **正本**: `docs/runbooks/cio-grok-execution-loop.md`  
> **仕様**: `docs/plans/2026-07-09-grok-l2b-hybrid-spec.md`

## いつ使う

- Composer **初回 Diff 後**に `npm run verify` / lint / smoke が **NG**
- 対象が **1アプリ・in-scope 固定**で、仕様判断が不要
- **deploy / push / kintone PUT** が不要

## 使わない

- 初回 implement（Composer 担当）
- 仕様曖昧・多アプリ横断
- lint 以外だけの deadlock → Fable 検討（`cio-fable5-escalation.md`）

## 手順（C モード）

```bash
npm run cio:grok:execution-guard -- --mark-5038
npm run cio:grok:execution-guard -- --mark-composer-diff
npm run cio:tool:route -- --intent "lint 修正ループ Grok"

# 契約を templates/grok-execution-contract.template.md から埋めてチャットに貼付
npm run cio:grok:execution-guard -- --validate-diff
npm run cio:grok:execution-guard -- --stamp --mode C \
  --goal "lint 緑" \
  --done-when "npm run lint:customize" \
  --in-scope "customize/736/desktop.js"
npm run cio:grok:execution-guard -- --check-c-ready
```

**contractHash** を Subagent プロンプトに含める。Grok 起動後は CIO が diff 検収。

## MCP（read-only）

契約の **Allowed MCP** に列挙したもののみ:

- **eslint-mcp** — lint 客体
- **kintone-schema-mcp** — フィールド型照合
- **git-history-mcp** — 規律照合
- **repo-tree** — パス確認

## 完了

```bash
npm run cio:grok:execution-guard -- --record-success
```

deploy は CIO が `cio:deploy-gate` 経由で別途実行。
