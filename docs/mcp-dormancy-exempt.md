# MCP 死蔵検知における `dormancy_exempt`（C2）

**正本**: `~/.cursor/mcp.json` の各サーバー `_meta`  
**実装**: `scripts/check-mcp-dormancy.mjs`（S12 v2）  
**目的**: WSL の bash cron からは **Windows 専用 MCP** を実 call できず、過去 N 日 0 回で「死蔵」と誤判定されるのを防ぐ。

## 現在 `dormancy_exempt: true` のサーバー（2026-04-25 時点）

| MCP キー | 理由（概要） |
|-----------|----------------|
| `github` | Windows 側 PowerShell ラッパー経由。WSL からの JSON-RPC 疎通は前提にしない。 |
| `office-powerpoint` | Windows 側 Python venv 実行。IDE からの利用を想定。 |
| `tavily` | `disabled: true` の設計。必要時のみ手動で有効化。死蔵カウント対象外。 |

各エントリの詳細文は `mcp.json` 内 `_meta.exempt_reason` を参照（Unicode エスケープの場合あり）。

## 運用ルール

- **新規 exempt** を付けるとき: ① `exempt_reason` を必ず書く ② 本ファイルに 1 行追記 ③ `check-mcp-dormancy.mjs` の挙動を §11-5 で確認  
- **exempt の削除**: その MCP が WSL からも安定疎通できるようになったときのみ

## 関連

- `AGENTS.md` §50-2（死蔵 MCP）、§17（mcp.json 編集）、TSB / `CURSOR-トラブル対応メモ` の S12 節
