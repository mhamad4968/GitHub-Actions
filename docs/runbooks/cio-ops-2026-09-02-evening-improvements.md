# 夕反省改善（2026-09-02 浜田全GO）

正本 GO: `docs/approved-changes/2026-09-02-evening-reflection-hamada-go.md`  
見送り: 配線整理 MCP 自動反映／下枠の他工程影響必須ルール化／憲法改定。pending npm-update は commit しない。

| ID | 内容 | 実装 |
|----|------|------|
| #S1 | 後続 success の GHA failure を healed。EOD は unresolved のみ NG | `scripts/lib/gh-run-classifier.mjs` / `scripts/cio-eod-github.mjs` |
| #O1 | checkpoint 次の1手と現行レーンが違うときは `--goal` で契約 Goal を上書き（checkpoint 本文は不触） | `scripts/cio-turn-start.mjs` / `resolveTurnStartGoal` |
| #M1 | Kimi `kimi_review` が `moonshot-v1-128k` 404 またはパス ENOENT のとき DeepSeek に寄せ、チャット 1 行。切替フラグは MCP 台帳行 | `docs/mcp-status.md` / routing §5.1 |
| #P1 | 会計年度四半期固定: 5–7=Q1 / 8–10=Q2 / 11–1=Q3 / 2–4=Q4（暦年四半期禁止） | `user683-sync-summaries-to-kintone.mjs` / `user683_claude_relay.py` |

**しない**: AGENTS 大改訂。新 MCP。customize 追加。
