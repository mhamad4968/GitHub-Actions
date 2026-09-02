# AI Team Tool Routing v2 — 依頼意図 → MCP / npm（正本）

> **正本日**: 2026-07-04 JST — 6役追補（visual-diagram intent）  
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

### 2.1 実戦シナリオ3本（2026-08-08 MCP月次パック · ops / constitution / report）

依頼 compose のレーンと揃えた **固定フレーズ**。handoff/checkpoint を ops に混ぜると `session-close` に吸われるので避ける。

| レーン | 推奨 `--intent` | 期待 id |
|--------|-----------------|---------|
| **ops** | `壁時計 session-clock opsレーン` | `ops-session` |
| **constitution** | `憲法 R20 4要素 compliance` | `compliance-constitution` |
| **report** | `棚卸し 合議 報告レーン` | `report-lane` |

```bash
npm run cio:tool:route -- --intent "壁時計 session-clock opsレーン"
npm run cio:tool:route -- --intent "憲法 R20 4要素 compliance"
npm run cio:tool:route -- --intent "棚卸し 合議 報告レーン"
# 依頼文作成は別 intent
npm run cio:tool:route -- --intent "依頼文を作って composeブロック"
```

回帰: `data/cio-tool-routing-test-intents.json`（`verify:cio-tool-routing-infra`）

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
| visualization | visual-diagram | **openrouter**（V1 gpt-4.1-nano）, figma fallback |
| **implementation** | **grok-verify-loop** | **Grok Subagent** + eslint-mcp / kintone-schema-mcp（read-only） |
| research | internal-rag | rag (`query_documents`), repo-tree |

---

## 5. MCP 優先度とフォールバック

manifest 各 intent の `mcp[]` に **`priority`**（1–100、**低いほど先**）。

MCP 失敗時（DeepSeek 合意 2026-06-19）:

1. 同一 intent の次 priority MCP
2. `fallback.mcpFailureChain`: deepseek → openrouter
3. 不可ならチャット 1 行: `MCPスキップ: <server> — <理由>`

### 5.1 Kimi ローカルファイル経路（#R-KIMI-01 / 2026-07-19 浜田 GO）

Windows Cursor から Kimi の `kimi_read_file` / `kimi_review` / `kimi_shell` を使う場合、
Kimi MCP は WSL Ubuntu 内で動作するため、Windows パスを直接渡さない。

1. `C:\Users\...\repo\...` を `/mnt/c/Users/.../repo/...` に変換し、`path` と `workFolder` を統一する。
2. `kimi_read_file`、必要時は `kimi_shell` の `test -e` で対象を確認する。
3. 指定された Kimi レビューを実行する。
4. Windows パスの `ENOENT` は **経路障害**、代替AIの結果は **代替レビュー** と記録する。
5. 代替レビュー後も経路を修復し、Kimi本人の読取＋レビュー成功を **復旧完了** とする。
6. `/mnt/...` でも `ENOENT` なら実ファイル欠落またはマウント障害として fallback。`EACCES` は権限エラーとして扱う。
7. **#M1（2026-09-02）**: `kimi_review` が `moonshot-v1-128k` **404** のときも ENOENT と同じく **DeepSeek へ寄せ**、チャットに `MCPスキップ: kimi — <理由> → DeepSeek` を 1 行。切替フラグは `docs/mcp-status.md`。mcp.json のモデル ID は独断変更しない。

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

---

## 10. Grok L2b 検証ループ（2026-07-09 体制変更 · 明日以降の標準）

| 段階 | 担当 | コマンド / 条件 |
|------|------|-----------------|
| 1 初回実装 | **Composer** | 通常 Edit · `npm run cio:grok:execution-guard -- --mark-composer-diff` |
| 2 lint/verify NG | **Grok C** | `§50-3-8` 済 · `--check-c-ready` → `--stamp --mode C` · in-scope 固定 |
| 3 diff 監査 | Grok / guard | `--validate-diff`（deploy/push/PUT 禁止スキャン） |
| 4 突破不能 | CIO → Fable | `cio-grok-execution-loop.md` 階段 |

**新セッション開始時**: `npm run cio:grok:session-reset`（cold-start Phase 5b 内包）  
**意図ルーティング**: `npm run cio:tool:route -- --intent "grok verify loop lint fix"`  
**禁止**: Grok 単独での deploy · kintone PUT · push

---

## 11. RAG `query_documents` の scope（2026-07-28）

MCP rag の `BASE_DIR` は **`/mnt/c/Users/.../kintone-ai-lab`**（WSL 経由）。

| 指定 | 結果 |
|------|------|
| scope 省略 | 全索引（通常これ） |
| `/mnt/c/Users/.../kintone-ai-lab/.rag/extra-docs/...` | プレフィックス一致可 |
| `C:\Users\...` | **マッチ0**（絶対パス扱いにならない） |

正本はリポ Read。RAG は当たり付けのみ（`docs/runbooks/rag-constitution-aide-trial.md`）。
