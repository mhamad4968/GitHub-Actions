# AI Team Tool Routing v2 — 依頼意図 → MCP / npm（正本）

> **正本日**: 2026-06-21 JST — 運用改善 D（A/B/C 完了後）  
> **上位**: Session Lifecycle v2 WORK / `.cursor/rules/mcp-server-use-triggers.mdc`  
> **機械正本**: `data/cio-ai-team-tool-routing.json`

---

## 1. なぜ v2 か

MCP サーバーは **27+** あり、トリガー表（`mcp-server-use-triggers.mdc`）と npm ゲート（B v2）が並立していたが、**依頼文から具体的な一手**へ落とす索引がなかった。

| 問題 | v2 の対策 |
|------|-----------|
| 「どの MCP を先に？」が毎回探索 | `cio:tool:route` で **意図 → 提案** |
| 複数 MCP が競合 | manifest **`priority`**（低値優先） |
| セキュリティ/障害/移行が索引外 | **17 カテゴリ** intent を追加 |
| 選択理由が追えない | `--log` で `chat-sessions/tool-routing-logs/` |

---

## 2. 使い方（WORK 着手前）

```bash
# 1. 着手前ゲート（従来どおり）
npm run cio:pre-implement-gate -- --intent "736 deploy 文言修正"

# 2. ツールルーティング提案（NEW）
npm run cio:tool:route -- --intent "736 deploy 文言修正" --app 736

# 3. トレースログ付き
npm run cio:tool:route -- --intent "736 deploy" --app 736 --log
```

**出力例**

```
[cio:tool:route] intent="736 deploy 文言修正"
  category: kintone-deploy | id: kintone-deploy | intent=kintone-deploy score=4 mcp priority=10
  MCP primary: kintone → kintone-get-app-deploy-status, kintone-deploy-app
  npm: cio:pre-implement-gate → cio:preflight:736 → cio:deploy-gate → deploy:736
  §50-3-8: deepseek
  skill: .cursor/skills/kintone-deploy-lane/SKILL.md
  runbook: docs/runbooks/push-deploy-quality-gates-v2.md
```

---

## 3. Lifecycle との組み合わせ

| Phase | ルーティング |
|-------|-------------|
| **WAKE** | `session-cold-start` intent → `cio:session:cold-start` |
| **ORIENT** | `internal-rag-research`（spec 横断） |
| **WORK** | **`cio:tool:route`** → MCP descriptor 必読 → 実装 |
| **CLOSE** | `session-close` → handoff / export / close-git |

WORK 標準順:

```
pre-implement-gate → tool:route → §50-3-8（該当時）→ MCP/npm 実行 → B v2 品質ゲート
```

---

## 4. intent カテゴリ（17）

| カテゴリ | 代表 intent | 主 MCP |
|----------|-------------|--------|
| session | cold-start / close | — |
| governance | second-review / tool-routing-self | deepseek, kimi |
| kintone-deploy | deploy | kintone |
| kintone-schema | schema-live | kintone-schema-mcp |
| kintone-crud | crud-records | kintone-dev（検証優先） |
| frontend-ui | ui-verify | playwright, chrome-devtools |
| accessibility | audit | accessibility-scanner |
| library-docs | library-docs | context7 |
| performance | eslint-quality | eslint-mcp |
| security | cve / audit-log | cve-search, git-history-mcp |
| incident | recover | kintone + recovery runbook |
| compliance | constitution | git-history-mcp |
| data | migrate | kintone + verify:kintone-fields |
| doc-lane | doc-lane | office-powerpoint（図形/コネクタ/グラフ）, figma |
| github-ci | github-ci | github |
| design | figma | figma, colors-fonts |
| research | internal-rag | rag, repo-tree |

---

## 5. MCP 優先度とフォールバック

manifest 各 intent の `mcp[]` に **`priority`**（1–100、**低いほど先**）。

MCP 失敗時（DeepSeek 合意 2026-06-19）:

1. 同一 intent の次 priority MCP
2. `fallback.mcpFailureChain`: deepseek → openrouter
3. 不可ならチャット 1 行: `MCPスキップ: <server> — <理由>`

---

## 6. npm ゲートとの対応（B v2 連動）

| タイミング | npm |
|------------|-----|
| commit 前 | `cio:pre-commit-check` |
| push 前 | `cio:pre-push-check` |
| deploy 前 | `cio:deploy-gate -- <app>` |
| MCP 環境 | `cio:mcp:gate`（kintone 作業前） |
| infra 検証 | `verify:cio-tool-routing-infra` |

---

## 7. 関連ファイル

| ファイル | 役割 |
|----------|------|
| `data/cio-ai-team-tool-routing.json` | intent 正本 |
| `data/cio-tool-routing-test-intents.json` | ルート回帰テスト |
| `scripts/lib/cio-tool-routing.mjs` | マッチ・優先度・ログ |
| `scripts/cio-tool-route.mjs` | CLI |
| `.cursor/skills/ai-team-tool-routing/SKILL.md` | Skill 入口 |
| `data/cio-project-lanes.json` | プロジェクトレーン（lane 参照） |

---

## 8. 拡張手順

1. `data/cio-ai-team-tool-routing.json` に intent 追加（**id / category / keywords / priority 必須**）
2. `data/cio-tool-routing-test-intents.json` に期待値 1 行追加
3. `npm run verify:cio-tool-routing-infra`
4. 必要なら `mcp-server-use-triggers.mdc` に 1 行トリガー追記

---

## 9. 検証

```bash
npm run verify:cio-tool-routing-infra
npm run cio:tool:route:test
```
