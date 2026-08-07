---
name: cio-request-compose
description: >
  浜田の自然文依頼を貼付ブロックに組み立てる（確認A）。確認Aだけでは実装しない。
  「依頼文を作って」「compose」「レーン」「触らない」時に使う。
  正本 docs/runbooks/cio-request-compose.md / Desktop 36。
---

# CIO Request Compose（依頼効率化）

## いつ使う

- 新しい作業依頼をチャットで始めるとき
- 「依頼文を作って」「compose して」と言われたとき
- レーン / 触らない / GO待ちが曖昧なとき

**使わない**: セッション開始（bootstrap）・すでに実装GO済みの本題着手。

## GO境界・3行（毎回これ）

```
確認A（compose OK）＝依頼文の確定のみ。コード変更・deploy・commit 禁止。
G0（「調査から」）＝読取・報告・修正案のみ。実装・deploy・commit 禁止。
G2（「実装GO」明示）＝当該スコープの実装・gate・deploy 可。確認Aや調査だけでは入らない。
```

## 手順

1. 不足のみ聞き返し（最大4問 · 既出はスキップ）: レーン / 一行 intent / app（kintoneのみ） / GO待ち
2. ブロック生成（**既定でログ** · 抑止は `--no-log`）:

```bash
npm run cio:request:compose -- --lane <kintone|doc-lane|constitution|ops|report> --intent "<一行>" [--app NNN] [--phase investigate|implement]
```

3. 出力の6行ブロックをチャットに提示 → **浜田 OK（確認A）待ち**
4. 確認A完了後は **止まる**。次は浜田の「調査から」（G0）または「実装GO」（G2）を待つ

## 禁止

- 確認A OK だけで customize 編集 / deploy / commit
- 「調査から」だけで実装・deploy
- 触らない既定（688 / 677–679 / SKYSEA 等）の省略

## レーン早見

| ID | --app |
|----|-------|
| `kintone` | **必須** |
| `doc-lane` / `constitution` / `ops` / `report` | 不要 |

## 正本

- Runbook: `docs/runbooks/cio-request-compose.md`
- Templates: `data/cio-request-compose-templates.json`
- Desktop: `36-REQUEST-COMPOSE-INDEX.txt`
- Plan: `docs/plans/2026-08-08-request-efficiency-v02-and-go-boundary.md`
- Logs: `chat-sessions/request-compose-logs/`（確認A記録 · 実装GOの証拠ではない）

## 検証

```bash
npm run verify:cio-request-compose
```
