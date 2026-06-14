---
name: kintone-session-bootstrap
description: >-
  kintone-ai-lab の新規チャット／セッション復元時に使う。checkpoint・bridge・
  session:bootstrap を順に実行し、凍結・次タスク・必読を復元する。
---

# kintone セッション Bootstrap

## いつ使うか

- 新規 Cursor チャットの **第1ターン**
- 「どこまで進んだか」「次に何をするか」が不明なとき
- `checkpoint-latest.md` や handoff が言及されたとき

## 手順（この順で実行）

### 1. ワンコマンド（推奨）

```bash
npm run cio:session:start
```

**朝の立ち上げ**（rollup + handoff + health + 実装前ゲート）:

```bash
npm run cio:morning:ready
```

業務改善 ver.02 v1 **クローズ済（2026-06-13）** — `--project business-improvement` は **不要**（付けても pre-implement スキップのみ）。

依頼ルーティング: `data/cio-project-lanes.json`

未整備時は以下を順に手動実行:

```bash
npm run cio:turn-start
npm run session:bootstrap
npm run verify:session-handoff-integrity -- --import
```

### 2. 必読（圧縮版 — フル6部は bootstrap NG 時のみ）

| 優先 | ファイル | 目的 |
|------|----------|------|
| 1 | `docs/handoff/latest-session-bridge.json` | 次タスク・gitHead・promptBlock |
| 2 | `chat-sessions/checkpoint-latest.md`（先頭80行） | 凍結・直近完了 |
| 3 | `.cursor/rules/mode-b-canonical.mdc` | 4AI・先頭4行 |

`bridge.exportedAt` が checkpoint 先頭日付より **2日以上古い** 場合:

```bash
npm run cio:session:export-handoff
```

### 3. 凍結の確認

`checkpoint-latest.md` 先頭の **凍結表** を必ず読む。  
業務改善 kintone は **浜田「実装OK」サイン前に create/deploy 禁止**（2026-06-06 更新）。

### 4. 報告フォーマット（第1ターン終了時）

- **gitHead** / **次タスク1行**
- **凍結**（触ってはいけないこと）
- **本ターンで着手する1手**

## 参照

- 正本: `AGENTS.md` / `docs/agent-restore-checkpoint.md`
- 詳細6部: `chat-sessions/NEW-SESSION-STARTER.md`
