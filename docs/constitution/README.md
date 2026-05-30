# 憲法・ルール — ジャンル別読本（AI 向け）

**目的**: `AGENTS.md`（約 1,700 行）を **ジャンルごとに分割**し、タスクに応じて必要な部分だけを読む。  
**§ 番号の正本**: 変更・解釈は引き続き **`AGENTS.md`**。本ディレクトリは **読みやすいミラー**（`npm run constitution:extract-genres` で再生成）。

---

## AI の読み方（推奨順）

1. **階層** — [`00-rule-hierarchy.md`](00-rule-hierarchy.md)（第1憲法 / 第2機械 / 第3 runbook）
2. **入口（常時）** — `.cursor/rules/cio-constitution.mdc` + **`.cursor/rules/mode-b-canonical.mdc`**（4AI・四行テンプレ）
3. **状況索引** — `RULES-INDEX.md`
4. **ジャンル本文** — 下表を **1〜2 本だけ** Read
5. **正本確認** — `AGENTS.md` 該当 §（§1-2-3-4・§50-3-11 含む）

```text
タスク受領
  → RULES-INDEX（索引）
  → docs/constitution/<ジャンル>.md（分割読本）
  → AGENTS.md §N（必要なときだけ正本）
```

---

## ジャンル一覧

| ファイル | 内容（章） | いつ読む |
|----------|------------|----------|
| [00-preamble.md](00-preamble.md) | 前文・体系図・レーン切替 | 初回・迷ったとき |
| [01-fundamentals.md](01-fundamentals.md) | 第1章 §0〜§3・モデル・正本 | **毎タスク開始** |
| [02-kintone-development.md](02-kintone-development.md) | 第2章 §4〜§8 | kintone 実装・デプロイ |
| [03-quality-engineering.md](03-quality-engineering.md) | 第3章 §9〜§15 | 品質・戦略転換 |
| [04-environment-security.md](04-environment-security.md) | 第4章 §16〜§18 | WSL・mcp.json・秘密 |
| [05-knowledge-rag.md](05-knowledge-rag.md) | 第5〜6章 §19〜§21・RAG | ドキュ・検索 |
| [06-mcp-disaster-recovery.md](06-mcp-disaster-recovery.md) | 第7章 §22〜§25 | MCP 障害 |
| [07-frontend-web-quality.md](07-frontend-web-quality.md) | 第8章 §26〜§30 | UI・a11y |
| [08-deliverables-architecture.md](08-deliverables-architecture.md) | 第9〜10章 §31〜§33 | 納品・調査 |
| [09-human-autonomy-reporting.md](09-human-autonomy-reporting.md) | 第11章 §34〜§41 | 報告・§41 一問 |
| [10-session-operations.md](10-session-operations.md) | 第12章 §42〜§46 | セッション切替・朝 |
| [11-professional-judgment.md](11-professional-judgment.md) | 第13章 §47〜§49 | 批判・複数案 |
| [12-mcp-usage.md](12-mcp-usage.md) | 第14章 §50 系 | **MCP 選択** |
| [13-parallel-session.md](13-parallel-session.md) | 第15章 §51 系 | 並列禁止・時計 |
| [14-self-governance-safemode.md](14-self-governance-safemode.md) | 第18〜19章 | セーフモード |
| [15-raci-responsibility.md](15-raci-responsibility.md) | 第20・16章 Tier/RACI | **Tier A/B** |
| [16-amendment-process.md](16-amendment-process.md) | 第21章 §57 | 憲法改定 |
| [00-rule-hierarchy.md](00-rule-hierarchy.md) | 3階層索引 | **迷ったら最初** |
| [17-four-ai-mode-b.md](17-four-ai-mode-b.md) | §1-2-3-4・§50-3-11 | 4AI・開発プロトコル |
| [18-ai-team-read-map.md](18-ai-team-read-map.md) | 役割別ナビ | **どの AI が何を読むか**（Phase 2） |

**Desktop 控え**: `chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt`（`npm run constitution:sync-genre-desktop-map` / sync-desktop 時に自動再生成）

### AI-KERNEL 4要素カーネル（2026-05-30 細分化最適化・§50-3-11 非置換追補）

| ファイル | ジャンル | いつ読む |
|----------|----------|----------|
| [19-governance-four-ai-kernel.md](19-governance-four-ai-kernel.md) | **統制・役割**（CIO・4AI・2名チェック） | 毎ターン・着手前・報告 |
| [20-cost-token-defense-kernel.md](20-cost-token-defense-kernel.md) | **コスト・Fast防衛**（15ターン・荷造り） | 長セッション・引っ越し前 |
| [21-autonomous-patrol-kernel.md](21-autonomous-patrol-kernel.md) | **無人パトロール**（週末・自己修復） | 土日監査・週明け |
| [22-error-handling-kernel.md](22-error-handling-kernel.md) | **エラーハンドリング**（エスカレーション・3択） | verify 失敗・チケット |

**機械検証**: `npm run verify:constitution-genre-kernels`

---

## Cursor ルール（.mdc）との関係

| 層 | 役割 |
|----|------|
| `cio-constitution.mdc` | **唯一の alwaysApply 核**（四行・Desktop 正本） |
| **`mode-b-canonical.mdc`** | **方式B用語・四行テンプレ単一窓**（重複記述はここへ集約） |
| `every-turn-rules-confirm.mdc` | 毎ターン儀式の全文（四行は mode-b テンプレ参照） |
| `mcp-server-use-triggers.mdc` 等 | **glob 別**の追加想起 |
| `docs/constitution/*.md` | **AGENTS の分割読本**（長文を減らす） |

---

## その他の正本

| ファイル | 役割 |
|----------|------|
| `WORKFLOW.md` | 変更の Phase 0〜5 |
| `CLAUDE.md` | 薄型エントリ |
| `kintone-apps.md` | アプリ ID・BUILD の真実 |
| `docs/plans/2026-05-17-constitution-restructure.md` | 本整理の計画・今後の改訂 |

---

## メンテナンス

```powershell
# AGENTS.md 改定後: 再抽出 → Phase2 要約付与 → 検証
npm run constitution:extract-genres
npm run constitution:enhance-phase2
npm run constitution:verify-coverage

# 4 正本ミラー（任意）
npm run rag:mirror:canonical-docs
```

`manifest.json` に最終生成時刻とファイル一覧あり。
