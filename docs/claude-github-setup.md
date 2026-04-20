# Claude Code × GitHub — 導入手順（本リポジトリ）

**ワークフロー**: `.github/workflows/claude-code-action.yml`（**`anthropics/claude-code-action@v1`**）  
**要約・索引の正本**: [`claude-github-index.md`](claude-github-index.md)

---

## 前提

- リポジトリの **管理者**権限（GitHub App のインストールと Secrets 登録ができること）。  
- **Anthropic API** 利用（Direct API）。Bedrock / Vertex は [公式ドキュメント](https://code.claude.com/docs/en/github-actions) を参照。

---

## 手順（最短）

1. **GitHub App「Claude」をインストール**  
   [https://github.com/apps/claude](https://github.com/apps/claude)  
   権限: Contents / Issues / Pull requests の Read & write（公式どおり）。

2. **Repository secret**  
   `Settings` → `Secrets and variables` → `Actions` → **`ANTHROPIC_API_KEY`** を追加（キーをワークフロー YAML に直書きしない）。

3. **動作確認**  
   Issue または PR コメントで **`@claude`** と書く（本文またはタイトルに含める。トリガー条件はワークフロー YAML の `if` と一致）。

4. **（推奨）ローカルからの一括セットアップ**  
   Claude Code ターミナルで **`/install-github-app`** を実行すると、App と Secrets の案内が進む（公式 Quick setup）。

---

## 本リポジトリ向けメモ

- ルートの **`CLAUDE.md`** がエージェントの道しるべ（kintone の儀式・型・推測禁止）。GitHub 上の Claude もリポジトリを checkout するため **参照される想定**。  
- カスタマイズ例（モデル・max-turns・allowedTools）は [claude-code-action の examples](https://github.com/anthropics/claude-code-action/tree/main/examples) を参照し、必要なら本ワークフローの `with:` に `claude_args` 等を追加。

---

## トラブル・セキュリティ

- **Secret 未設定**で起動するとステップが失敗する。先に `ANTHROPIC_API_KEY` を登録する。  
- エージェントがコードを書き換えるため、**PR は人間がレビューしてからマージ**する。  
- フォーク PR・コメント経由のプロンプトには **インジェクションリスク**がある。運用ポリシーとワークフローの `permissions` を必要最小限に保つ。社内でワークフロー監査をする場合は Trail of Bits の **agentic-actions-auditor** スキル等を参照。

---

## 参照リンク

| 内容 | URL |
|------|-----|
| 公式: Claude Code GitHub Actions | https://code.claude.com/docs/en/github-actions |
| Action リポジトリ | https://github.com/anthropics/claude-code-action |
| セキュリティ（権限） | https://github.com/anthropics/claude-code-action/blob/main/docs/security.md |
