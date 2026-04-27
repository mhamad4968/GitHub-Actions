# 予実・予算リポ用ミニテンプレ

`kintone-ai-lab` の **`scripts/mandatory-read-gate.mjs` フル版**を小さくした雛形です。新リポのルートに **このフォルダの中身だけ**コピーしてください。

## セットアップ

1. コピー後、`SPEC.template.md` → **`SPEC.md`** にリネームし、中身を編集する（400 文字以上）。
2. **`STATUS.md`** または **`HANDOFF.md`** のどちらか（80 文字以上）を置く。セッション切替の一行サマリ用。
3. `npm install` は不要（スクリプトのみ）。検査は次で実行:

```bash
npm run verify:gate
```

## Cursor との向き合い

- 新チャット初手で **`npm run verify:gate`** を Read より先に回す運用にすると抜けにくいです。
- 本家リポと同じく、`.cursor/rules` に「gate exit 0 まで編集しない」を書くとより強いです。

## 参照

- `../../scripts/mandatory-read-gate.mjs` — 本番ゲート（コピー元の思想）
