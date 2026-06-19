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

## 手順（推奨: ワンコマンド）

### 統合 cold-start（推奨）

```bash
npm run cio:session:cold-start
```

朝報 fast 自動生成 → preflight（scores/bridge）→ rollup → quick-health → bootstrap → import を **1 本**で実行。

Runbook: `docs/runbooks/session-cold-start-v1.md`

### 朝のみ（bootstrap 前）

```bash
npm run cio:morning:ready
```

朝報未作成時は **fast 自動生成**（従来は verify NG で warn のみ）。

### 従来（分割）

```bash
npm run cio:session:start
```

preflight + turn-start + bootstrap + import（cold-start の Phase 5〜6 相当）。

## 必読（圧縮版）

| 優先 | ファイル | 目的 |
|------|----------|------|
| 1 | `docs/handoff/latest-session-bridge.json` | 次タスク・gitHead |
| 2 | `chat-sessions/checkpoint-latest.md`（先頭80行） | 凍結・直近完了 |
| 3 | `docs/reports/<今日>-morning-prep.md` | 朝のヘルス（fast/full マーカー確認） |
| 4 | `.cursor/rules/mode-b-canonical.mdc` | 4AI・先頭4行 |

## 凍結の確認

`checkpoint-latest.md` 先頭の **凍結表** を必ず読む。

## 報告フォーマット（第1ターン終了時）

- **gitHead** / **次タスク1行**
- **凍結**（触ってはいけないこと）
- **本ターンで着手する1手**

## 参照

- 正本: `AGENTS.md` / `docs/agent-restore-checkpoint.md`
- Runbook: `docs/runbooks/session-cold-start-v1.md`
- 詳細6部: `chat-sessions/NEW-SESSION-STARTER.md`
