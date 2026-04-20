# Claude × GitHub 運用 — 要約・マスターインデックス

**1 ページ目次**: [要約（TL;DR）](#要約tldr) → [導入状態（本リポ）](#導入状態本リポ) → [マスターインデックス](#マスターインデックス) → [議論で出た「3 本柱」](#議論で出た3-本柱) → [次にやること](#次にやること)

---

## 要約（TL;DR）

- **目的**: GitHub の Issue / PR コメントで **`@claude`** すると、CI 上で Claude Code が動き、**ブランチ・修正・PR** まで進められる（人間のレビュー前提）。  
- **道しるべ**: ルート **`CLAUDE.md`**（本リポは kintone 向けに具体化済み）。  
- **接続**: **`ANTHROPIC_API_KEY`**（Secrets）＋ **GitHub App「Claude」** ＋ **`.github/workflows/claude-code-action.yml`**。  
- **ローカル補助**: **`gh`**（Issue / PR 操作）を Claude Code ターミナルから使えると、同じ流れを手動でも再現しやすい。

---

## 導入状態（本リポ）

| 項目 | 状態 |
|------|------|
| **`CLAUDE.md`** | **あり**（エージェント正本） |
| **Claude Code Action ワークフロー** | **あり** → `.github/workflows/claude-code-action.yml` |
| **GitHub App / `ANTHROPIC_API_KEY`** | **リポジトリ側で設定が必要**（各環境の Secrets。コミット不可） |
| **`gh` の利用** | ローカル環境依存（ドキュメントのみ） |

**初回**: [`claude-github-setup.md`](claude-github-setup.md) の手順どおりに App と Secret を登録する。

---

## マスターインデックス

| 種別 | パス・リソース | 説明 |
|------|----------------|------|
| **ワークフロー** | `.github/workflows/claude-code-action.yml` | `@claude` トリガで `anthropics/claude-code-action@v1` を実行 |
| **導入手順** | [`docs/claude-github-setup.md`](claude-github-setup.md) | App・Secret・確認・セキュリティ注意 |
| **エージェント正本** | `CLAUDE.md` | 型・`kintone-apps.md`・儀式・推測禁止・**PR 前セルフレビュー**・**Issue パトロール** |
| **ルール索引（日付行）** | `RULES-INDEX.md` | 「Claude × GitHub」追記を検索 |
| **学習・新規アプリ** | [`docs/agent-learning-and-app-creation.md`](agent-learning-and-app-creation.md) | 「学習」の二意味・チェックリスト |
| **旧ファイル（リダイレクト）** | [`docs/claude-github-autonomy-discussion-log.md`](claude-github-autonomy-discussion-log.md) | 議論ログの整理は本ページに統合 |
| **公式** | [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions) | 最新の破壊的変更・Bedrock 等 |

---

## 議論で出た「3 本柱」

| 柱 | 内容 | 本リポ |
|----|------|--------|
| 1 | **`CLAUDE.md`** でプロジェクト規約・手順を固定 | **済** |
| 2 | **GitHub App + Actions** でイベント駆動 | **YAML 済**／**Secrets は要設定** |
| 3 | **`gh`** で Issue〜PR を CLI 化 | 任意（ローカル） |

---

## 次にやること

1. 管理者: [`claude-github-setup.md`](claude-github-setup.md) を完了する。  
2. 試験 Issue で **`@claude`（テスト用の小さな依頼）** を投げる。  
3. 運用で **`claude_args`**（モデル・`--max-turns`・allowedTools）を調整する場合は [公式 examples](https://github.com/anthropics/claude-code-action/tree/main/examples) を参照。

---

**エージェント全般**（短い依頼の補完・判断後に何をどこへ書くか）: ルート **`CLAUDE.md`「依頼の解釈・自己判断・ナレッジの貯め方」**。

---

*製品仕様の保証ではなく、社内ナレッジ用。*
