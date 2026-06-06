# Cursor 環境アップグレード計画（2026-06-06）

**目的**: AIチームが **浜田 GO 後も自律的に品質を上げ続ける** ための環境改善。  
**方針**: 人間ゲート（Tier B・実装OKサイン）は維持しつつ、**手戻り・迷い・handoff 劣化** を機械で潰す。

---

## 1. 現状診断（要約）

| 領域 | 成熟度 | 課題 |
|------|--------|------|
| 憲法・ルール（50 `.mdc`） | 非常に高 | コンテキストコスト大・発見性低 |
| npm ゲート（`cio:*` 71本） | 非常に高 | エージェントが「いつ実行するか」を見失う |
| MCP（24サーバー級） | 高 | Windows/WSL・repo overlay 分裂 |
| Handoff | 中 | `checkpoint-latest.md` 肥大・bridge 陳腐化 |
| **Repo Skills** | **なし** | ワークフローが prose + npm に散在 |
| CI | 低〜中 | bootstrap / handoff / report の多くがローカルのみ |

**結論**: 「監督付き 4AI」には最適。**完全無人**は意図的に未対応。レバーは **Skills 化・handoff 鮮度・朝ゲート自動化・checkpoint 圧縮**。

---

## 2. フェーズ計画

### Phase A — 即日（2026-06-06〜07）✅ 着手済

| # | 施策 | 成果物 |
|---|------|--------|
| A1 | **Repo Skills 3本** | `.cursor/skills/kintone-session-bootstrap/` 他 |
| A2 | **朝の実装前ゲート** | `npm run cio:morning:pre-implement` |
| A3 | **checkpoint ロールアップ** | `npm run cio:checkpoint:rollup` |
| A4 | **セッション開始ワンコマンド** | `npm run cio:session:start` |
| A5 | **本計画 + 機械ロードマップ** | 本ファイル + `data/cursor-environment-upgrade.json` |

### Phase B — ✅ 2026-06-06 完了

| # | 施策 | 成果物 |
|---|------|--------|
| B1 | sessionEnd → handoff export | `data/cursor-env-config.json` + `session-end-autopilot.mjs` |
| B2 | bridge 陳腐化ゲート | `--strict-staleness` + `scripts/lib/cio-bridge-staleness.mjs` |
| B3 | CI handoff サブセット | `.github/workflows/cursor-env-gates.yml` |
| B4 | 業務改善 Skill | `.cursor/skills/kintone-business-improvement-lane/` |
| B5 | 実装OK seal | `npm run cio:implementation-ok-seal` |

### Phase C — ✅ 2026-06-06 完了

| # | 施策 | 成果物 |
|---|------|--------|
| C1 | MCP マニフェスト | `data/cio-mcp-manifest.json` + `verify:cio-mcp-manifest` |
| C2 | 第二レビュー JSON | `cio:second-reviewer:capture` + `second-reviewer-latest.json` |
| C3 | cold-start 1-pager | `.cursor/rules/autonomous-cold-start.mdc` |
| C4 | デモスモーク骨格 | `npm run smoke:bi-demo` |
| C5 | RAG 索引 | `data/rag-business-improvement-manifest.json` + `rag:sync-business-improvement` |

### Phase D — 骨格済（Automations は浜田承認後）

| ツール | 状態 | 参照 |
|--------|------|------|
| **Cursor Automations** | runbook 作成済 | `docs/runbooks/cursor-automations-weekly.md` |
| **Chrome DevTools MCP** | 6/9〜手順に記載 | `data/cio-mcp-manifest.json` phaseD |
| **Accessibility scanner** | customize 後 | 同上 |
| **user-rag** | sync スクリプト済 | `rag:sync-business-improvement` |
| **Cursor SDK** | 8/1前・未着手 | `_future` へ |

---

## 3. 自律性の設計原則（変更しないもの）

1. **浜田 GO / 実装OKサイン** — Tier B は人間必須
2. **破壊的操作ブロック** — hooks + `cio-block-destructive`
3. **4AI 相互ロック** — Composer 単独デプロイ禁止
4. **正本優先** — checkpoint より `AGENTS.md` / spec

**自律化するもの**: ゲート実行順・handoff 更新・ドキュメント訂正・スモーク・レビュー記録。

---

## 4. 明日（6/7）朝の運用（新フロー）

```
浜田: 「仕様と手順を再確認して」
  ↓
AI: npm run cio:morning:pre-implement -- --project business-improvement
  ↓
AI: 仕様突合サマリ + 案B1 手順 + 本日確定5件を提示
  ↓
浜田: 「実装OK」
  ↓
AI: docs/handoff/implementation-ok-seal.json に記録（Phase B5）
  ↓
AI: 案B1 着手（6/7 or 6/8）
```

---

## 5. 成功指標（KPI）

| 指標 | 現状 | 目標（1ヶ月） |
|------|------|----------------|
| bridge と checkpoint の日付差 | 〜6日 | **0日**（セッション終了時） |
| checkpoint 先頭画面行数 | 〜30行 + 1600行履歴 | **〜80行**（rollup 後） |
| 新チャット復元までの必読ファイル | 6+ | **3**（bridge + rollup checkpoint + skill） |
| 実装前ゲート手動忘れ | あり得る | **npm 1本で強制** |
| Skills（repo） | 0 | **5+** |

---

## 6. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-06 | 初版 — Phase A 実装着手（浜田指示） |
| 2026-06-06 | **Phase B〜D 完了**（B/C 実装・D runbook 骨格）— `npm run verify:cio-env-upgrade` |
