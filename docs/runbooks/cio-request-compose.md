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

## 5. 確認 A と GO 段階（必須 · #R-GO-BOUNDARY-01）

**確認 A ≠ 実装 GO ≠ 調査 GO**。正本: `docs/constitution/28-ceo-go-phases-charter.md`（依頼 compose 接続節）

| 段階 | 浜田 | AI |
|------|------|-----|
| **確認 A** | compose ブロック **OK** | 依頼文確定のみ。**着手しない** |
| **G0 調査** | 「調査から」等 | 読取・報告・修正案提示。**コード変更・commit・deploy 禁止** |
| **G2 実装** | 「実装GO」「修正して」等（明示） | 当該スコープの実装 · gate · deploy |

調査依頼時は `--phase investigate` を付けてブロック生成（§4 参照）。

---

## 6. 確認 A の手順

1. AI が **5行ブロック**をチャットに提示  
2. 浜田が **OK** または修正1行  
3. **確認 A 完了** — ここではまだ本題に入らない（次は浜田の **調査指示** または **実装 GO** を待つ）

**禁止**: ブロック提示前に本題着手 · **確認 A OK だけで** customize 編集 / deploy / commit · **「調査から」だけで** 実装・デプロイ

---

## 7. 調査フェーズ（G0）

浜田が「調査から」等と言った **後**:

```bash
npm run cio:request:compose -- --lane kintone --intent "…" --app 688 --phase investigate
```

- **可**: API/ログ読取 · 原因報告 · 修正案の提示  
- **禁止**: `customize/**` 編集 · `deploy:*` · commit/push

---

## 8. 実装フェーズ（G2）

浜田の **明示実装 GO** の **後**:

```bash
npm run cio:pre-implement-gate -- --strict
npm run cio:tool:route -- --app <APP>
# customize 時: §50-3-8 → 実装 → preflight → deploy
```

`--phase implement`（既定）でブロック再生成可。

---

## 9. 出力例（実装 GO 後）

```
【レーン】kintone-customize · app 736
【やりたいこと】PH1d 外注④〜⑦ブロック任意化の続き
【触らない】688 / 677–679 / SKYSEA
【GO待ち】浜田目視 OK まで deploy しない
【AIへ】実装GO後: cio:pre-implement-gate → cio:tool:route --app 736 → §50-3-8（customize 時） | route: …
```

**調査時の出力例**（`--phase investigate`）:

```
【GO待ち】浜田の実装GOまで customize 編集・commit・deploy 禁止
【AIへ】調査のみ · 実装GO待ち — API/ログ読取・原因報告・修正案提示可
```

---

## 10. Desktop 早見

`36-REQUEST-COMPOSE-INDEX.txt`（`session-starter:sync-desktop` で同期）

---

## 11. verify

```bash
npm run verify:cio-request-compose
```
