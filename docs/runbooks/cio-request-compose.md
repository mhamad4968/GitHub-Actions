# 依頼効率化 — チャット式ウィザード（正本）

> **機械正本**: `data/cio-request-compose-templates.json`  
> **CLI**: `npm run cio:request:compose`（**AI が実行** · 浜田は §35-1 どおり npm 不要）  
> **spec**: `docs/plans/2026-07-11-request-efficiency-tool-spec.md`

---

## 1. いつ使うか

- 新しい作業依頼をチャットで始めるとき
- レーンが曖昧なとき（kintone vs doc-lane vs 憲法）
- 「触らない」「GO待ち」を毎回手書きしたくないとき

**使わない**: セッション開始（`NEW-SESSION-STARTER` / bootstrap）— 別フロー。

---

## 2. 浜田 → AI（きっかけ）

どれか一行でよい:

- 「依頼文を作って」
- 「736 用の依頼を組み立てて」
- 「doc-lane で経営会議資料の依頼を作りたい」

---

## 3. AI の聞き返し（最大4問 · 既出ならスキップ）

| # | 質問 | 既定 |
|---|------|------|
| 1 | レーン | 文脈から推定し確認 |
| 2 | やりたいこと（一行） | — |
| 3 | app ID（kintone のみ） | — |
| 4 | GO待ち | レーン既定（deploy 前目視等） |

**触らない**は既定 `688 / 677–679 / SKYSEA` を自動挿入（追記は `--no-touch`）。

---

## 4. AI が実行（浜田 OK 前）

```bash
npm run cio:request:compose -- --lane kintone --intent "736 PH1d 外注ブロック" --app 736
npm run cio:request:compose -- --lane doc-lane --intent "経営会議 2026年7月" --copy
npm run cio:request:compose -- --list
```

---

## 5. 確認 A（必須）

1. AI が **5行ブロック**をチャットに提示  
2. 浜田が **OK** または修正1行  
3. **OK 後のみ** `cio:pre-implement-gate` / `cio:tool:route` / 実装

**禁止**: ブロック提示前に本題着手 · 浜田 OK なしに deploy/commit。

---

## 6. 出力例

```
【レーン】kintone-customize · app 736
【やりたいこと】PH1d 外注④〜⑦ブロック任意化の続き
【触らない】688 / 677–679 / SKYSEA
【GO待ち】浜田目視 OK まで deploy しない
【AIへ】着手前: cio:pre-implement-gate → cio:tool:route --app 736 → §50-3-8（customize 時） | route: …
```

---

## 7. Desktop 早見

`36-REQUEST-COMPOSE-INDEX.txt`（`session-starter:sync-desktop` で同期）

---

## 8. verify

```bash
npm run verify:cio-request-compose
```
