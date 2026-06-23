# 736 差分系 — 第2者レビュー チェックリスト（B-6）

> **条件**: `scripts/jikkou-yosan-diff-*.mjs` または `customize/736/desktop.ui.js` の **差分・印刷** 関連変更時  
> **実施者**: DeepSeek または別モデル（§50-3-8）。省略時は `§50-3-8 スキップ理由:` 1 行必須。

---

## 1. 行突合（pairTableRows / structuralRowKey）

- [ ] 比較前に **ランダム UUID を付与していない**（`snapshotForDiff` で `ensureRowKeysOnState` しない）
- [ ] `row_key` 一致 → 構造キー → 位置 の優先順が仕様どおり
- [ ] 小計行・連携行が **別行として誤マッチ** していない（同一キー衝突で -10M 級の誤差が出ない）
- [ ] `recalcState` 後も `costLineFromCalcRow` が `row_key` を保持する

**テスト**: `npm run jikkou-yosan:rowkey-gate` exit 0

---

## 2. cascade 分類（直接編集 vs 自動反映）

- [ ] ユーザーが触った行 = **直接編集**（黄 `#fff3cd`）
- [ ] 再計算連動 = **自動反映**（水色 `#cfe2ff`、金額セルに増減のみ）
- [ ] 材料 1 箇所変更で **全行が変更扱い** にならない

---

## 3. 印刷連携（v2c-print 以降）

- [ ] 印刷 HTML が `diffResult` / `structuralRowKey` を **画面と同じコア** で再利用
- [ ] 比較オフ・版1のみ → 差分付き印刷は **無効**
- [ ] 削除行は **展開時のみ** 印刷に含める（§2.4 P3）
- [ ] フッターに比較対象版（`diffBaseMeta`）

---

## レビュー記録（handoff 1 行例）

```
§50-3-8 diff-review: 突合OK / cascade分離OK / 印刷連携（該当なし or OK）
```
