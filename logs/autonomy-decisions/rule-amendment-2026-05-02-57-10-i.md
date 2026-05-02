# rule-amendment — §57-10 I案 + RAG ミラー + post-commit 修復

- **amendment_id**: 57-10-i-2026-05-02
- **proposer**: ai (CIO スレッド / DeepSeek・Kimi・OpenRouter 見解を集約)
- **approved_by**: hamada（チャット 2026-05-02「も進めていいよ。深く考えてどうするかはみんなで決めて自律的におこなってください」= 当バッチ GO）
- **label**: [FEAT]
- **target**: §57-10 新設 / package.json / scripts / git-hooks/post-commit / verify:agent-env / docs/github-branch-protection.md
- **diff_summary**:
  - RAG 正本 4 ファイルを `.rag/extra-docs` にコピーする `rag-mirror-canonical-docs.mjs` と `verify:rag-mirror-canonical`。
  - post-commit を Node 実装にし、`hooks:install` を Windows 対応コピーに統一。
  - `main` branch protection は GitHub UI 前提の手順書を `docs/github-branch-protection.md` に追加。
- **review_at**: 2026-05-02 (async)
- **applied_commit**: `aeb157d`（例: `[FEAT] §57-10 I案: RAGミラー検証・post-commit Node化・branch protection手順`）
- **verify_result**: audit:rules ✅ / audit:tsb ✅ / verify:breaking ✅ / audit:xref ✅ / verify:rag-mirror-canonical ✅ / mandatory-read-gate ✅（Windows ローカルでは health-check が MCP 未接続で ❌ → WSL または Cursor 環境で再検）
