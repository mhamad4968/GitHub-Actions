# NEW-SESSION-STARTER 分割 6/6 — path-table-footer

> 正本ハブ: `chat-sessions/NEW-SESSION-STARTER.md`（貼付用・短縮版）
> 親ファイル: v3.35 まで monolithic → **v3.36** より分割（2026-05-07 CIO）

---


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ファイル位置リファレンス
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| 用途              | パス                                                       |
|-------------------|------------------------------------------------------------|
| 現在地（短く）    | kintone-ai-lab/chat-sessions/checkpoint-latest.md          |
| 直近の詳細経緯    | kintone-ai-lab/chat-sessions/<YYYY-MM-DD>.md               |
| 朝ブリーフィング  | kintone-ai-lab/docs/reports/<YYYY-MM-DD>-morning-prep.md   |
| 開発憲法          | kintone-ai-lab/AGENTS.md (第15章 §51 まで)                  |
| 儀式・優先順位    | kintone-ai-lab/CLAUDE.md                                   |
| Phase 0-5 作業 OS | kintone-ai-lab/WORKFLOW.md                                 |
| ホーム索引        | ~/RULES-INDEX.md                                           |
| リポ索引          | kintone-ai-lab/RULES-INDEX.md (§N 全件 + MCP 活用 + 並列禁止) |
| 関係性契約        | ~/.cursor/rules/persist-policies.mdc                       |
| 復元プロトコル    | kintone-ai-lab/docs/agent-restore-checkpoint.md            |
| 失敗事例集        | kintone-ai-lab/docs/troubleshooting.md (TSB-006〜TSB-015) |
| 緊急バックアップ  | ~/.cursor-emergency-backup/                                |
| 儀式（ハブ）      | kintone-ai-lab/chat-sessions/NEW-SESSION-STARTER.md（短）＋ `session-starter-parts/part-A`〜`F`（詳細） |
| トラブル対応      | kintone-ai-lab/chat-sessions/CURSOR-トラブル対応メモ.md   |
| MCP 状態管理      | kintone-ai-lab/docs/mcp-status.md                          |
| MCP 強化戦略      | kintone-ai-lab/docs/plans/2026-04-23-mcp-strategy-v1.md    |
| CLI 進化戦略      | kintone-ai-lab/docs/plans/2026-04-23-cli-evolution-v1.md   |
| 新・PC 台帳仕様   | kintone-ai-lab/docs/plans/2026-04-21-new-pc-ledger-spec.md |
| MCP 設定          | ~/.cursor/mcp.json (16 servers / バックアップ backups/mcp/) |
| WSL ホーム        | /home/mhamada202408224/                                    |
| Windows Desktop   | /mnt/c/Users/mhamada202408224/Desktop/                     |
| 緊急メモ控え      | /mnt/c/Users/mhamada202408224/Desktop/AI緊急用/            |
| セッション集約メモ（任意・2026-04-28） | Desktop `SESSION-HANDOFF-LATEST-2026-04-28.txt`（スターター未配置時の要約。sync で 4 本復元） |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
最終更新: 2026-05-07 JST — **v3.36**（スターター **6+1 分割**／Desktop は `00-NEW-SESSION-STARTER_yyyymmdd.txt`＋**`01`〜`06`-STARTER-part-*.txt**（**00 からの連番**）／S14 cron は `bash scripts/install-morning-cron.sh` で `.nvmrc` 追随）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
