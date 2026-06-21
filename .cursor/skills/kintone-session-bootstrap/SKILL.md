---
name: kintone-session-bootstrap
description: >-
  kintone-ai-lab の新規チャット／セッション復元時に使う。Session Lifecycle v2
  （WAKE→ORIENT→ALIGN→WORK→CLOSE）に従い cold-start で復元する。
---

# kintone セッション Bootstrap

## 正本

**`docs/runbooks/session-lifecycle-v2.md`** — 5 Phase / L0・L1・L2 Reading

WAKE 詳細: `docs/runbooks/session-cold-start-v1.md`

## いつ使うか

- 新規 Cursor チャットの **第1ターン**（WAKE + ORIENT）
- 「どこまで進んだか」「次に何をするか」が不明なとき
- `checkpoint-latest.md` や handoff が言及されたとき

## WAKE — ワンコマンド（推奨）

```bash
npm run cio:session:cold-start
```

朝報 fast 自動生成 → preflight（gitHead 含む bridge 修復）→ 凍結ゾーン → rollup → bootstrap → import を **1 本**で実行。

### 従来（分割）

| 用途 | コマンド |
|------|----------|
| 統合 | `npm run cio:session:cold-start` |
| 朝のみ | `npm run cio:morning:ready` |
| bootstrap のみ | `npm run session:bootstrap` |

## ORIENT — L0 必読

| 優先 | ファイル | 目的 |
|------|----------|------|
| 1 | `docs/handoff/latest-session-bridge.json` | gitHead・次タスク |
| 2 | `chat-sessions/checkpoint-latest.md`（**先頭 50 行**） | 凍結・直近完了 |
| 3 | `chat-sessions/constitution-first-read-pack/00-ORDER.txt` 〜 `05-full-refs.txt` | 憲法要約 |

## L2 フォールバック（bootstrap NG 時のみ）

`chat-sessions/NEW-SESSION-STARTER.md` + part-A〜F。同一セッション **1 回まで**。NG 続行 → 浜田へエスカレーション。

## 報告（ORIENT 終了時）

- **gitHead** / bridge 鮮度
- **凍結**（触ってはいけないこと）
- **次タスク 1 行**
- **本ターン §41 候補**（あれば 1 問）

## CLOSE

| 種別 | ルール |
|------|--------|
| partial | `session-boundary-close-gate.mdc` — checkpoint + export-handoff |
| full | `session-close-execute-first.mdc` — close-git |

## 参照

- `AGENTS.md` / `docs/agent-restore-checkpoint.md`
- `.cursor/rules/autonomous-cold-start.mdc`
