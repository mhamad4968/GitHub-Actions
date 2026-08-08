# 依頼効率化ツール v0.1 — spec

> **地位**: チャット式依頼ウィザード + 機械生成バックエンド  
> **GO**: 2026-07-11 浜田（チャット式 · 確認 A · 実装 GO）  
> **観測**: 憲法正式クローズとは別レーン（2週間観測と並行可）

## 1. 目的

浜田が Cursor チャットで **自然文依頼** → AI が聞き返し → **貼付ブロックを一度提示** → **OK 後に本題**、の型を固定する。

| 問題 | v0.1 の対策 |
|------|-------------|
| 依頼テンプレ散在 | `data/cio-request-compose-templates.json` 5レーン |
| レーン・触らない抜け | 既定 `688 / 677–679 / SKYSEA` 自動挿入 |
| AI 向け routing のみ | `cio:request:compose` を **AI が実行**（浜田は npm 不要） |

## 2. チャットフロー（正本）

1. 浜田: 自然文（例「736 PH1d 続き」）
2. AI: 不足のみ聞き返し（最大4問: レーン / intent / app / GO待ち）
3. AI: `npm run cio:request:compose -- --lane … --intent "…"` 実行
4. AI: ブロックをチャット提示 → **浜田 OK 待ち（確認 A）**
5. **確認 A 完了後**: 浜田の **調査指示（G0）** または **実装 GO（G2）** を待つ — **確認 A だけでは着手しない**
6. **G0 調査**: 読取・報告のみ（`--phase investigate`）。**コード変更・deploy 禁止**
7. **G2 実装 GO 後**: pre-implement-gate → tool:route → 実装 →（customize 時）preflight → deploy

## 3. 貼付ブロック（6行固定 · 2026-08-08 Step0 で【段階】追加）

```
【段階】…
【レーン】…
【やりたいこと】…
【触らない】…
【GO待ち】…
【AIへ】…
```

## 4. レーン

| ID | 用途 | --app |
|----|------|-------|
| `kintone` | customize / deploy | **必須** |
| `doc-lane` | Word / PPT / 資料 | — |
| `constitution` | 憲法・ルール | — |
| `ops` | bootstrap / handoff / 壁時計 | — |
| `report` | 報告・合議 | — |

## 5. 成果物

| ファイル | 役割 |
|----------|------|
| `data/cio-request-compose-templates.json` | レーン正本 |
| `scripts/lib/cio-request-compose.mjs` | 生成ロジック |
| `scripts/cio-request-compose.mjs` | CLI |
| `docs/runbooks/cio-request-compose.md` | 運用 runbook |
| `36-REQUEST-COMPOSE-INDEX.txt` | Desktop 早見 |

## 6. verify

```bash
npm run verify:cio-request-compose
```

## 7. v0.2（2026-08-08）

| ID | 内容 | 状態 |
|----|------|------|
| V2-1 | compose ログ `chat-sessions/request-compose-logs/`（既定ON · `--no-log` 抑止） | 実装 |
| V2-2 | Cursor Skill `.cursor/skills/cio-request-compose/SKILL.md` | 実装 |
| V2-3 | レーン別デフォルト（CEO · ops GO待ち · tool-route 連動） | 実装 |
| V2-N | 完了通知 | **最後** |
