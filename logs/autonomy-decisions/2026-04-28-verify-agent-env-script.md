# 2026-04-28 — `npm run verify:agent-env` 新設

- **要望**: 自律エージェントが動きやすい環境を大事にしたい（継続）。
- **対応**: `scripts/verify-agent-env.mjs` ＋ `package.json` の **`verify:agent-env`**。憲法→`mandatory-read-gate`→`verify:all`→`smoke:quiet`。Desktop 同期・時計 strict なし。`mcp-tool-discipline` のアイドル①を本コマンドに紐付け。`SESSION-BOOTSTRAP-CHECKLIST` フェーズ 6・`RULES-INDEX` §57-5・`.rag/extra-docs/RULES-INDEX` を同期。
