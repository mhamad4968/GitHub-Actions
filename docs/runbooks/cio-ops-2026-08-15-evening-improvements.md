# 夕反省改善（2026-08-15 浜田全承認）

正本 GO: `docs/approved-changes/2026-08-15-evening-reflection-hamada-go.md`  
見送り: MCP-2（課金用新 MCP を追加しない）／CON-1（AGENTS 大改訂しない）

| ID | 内容 | 実装 |
|----|------|------|
| OPS-1 | Total% + Resets で期間判定。内訳バー禁止 | `cursor-plan-usage-watch.md` 手順 0 |
| OPS-2 | 再起動後 dirty は hash 突合してから残件報告 | RULE-3 |
| ORG-1 | ③チャットは運用→体制→MCP→ルール→憲法 | `cio-day-close-v1.md` / `cio-day-close.mjs` |
| ORG-2 | 期間判定は CIO が reset_day と突合。聞き返して移譲しない | `cursor-plan-usage-watch.md` |
| RULE-2 | Plan & Usage 受領時は月次リセット vs UI 内訳を手順にする | 同上 |
| RULE-3 | hash が HEAD と同一なら残件に数えない | `verify-session-close-git-warn.mjs` `isPhantomStatDirty` |
| MCP-1 | 締め DeepSeek 1問 | 維持 |
| RULE-1 | medal レーン固定 | 維持 |
| CON-2 | §1-2-4 混同禁止は今夜追記済。追加拡張しない | 維持 |
| CON-3 | ③実装は GO 後 | day-close pause |

**しない**: 新 MCP。AGENTS 大改訂。715 再着手。customize。
