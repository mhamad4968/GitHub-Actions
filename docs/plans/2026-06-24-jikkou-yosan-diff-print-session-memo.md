# 実行予算書 736 — 差分付き印刷 実装メモ（2026-06-24 セッション用）

> **浜田指示（2026-06-23）**: 明日は **Step1（差分付き印刷・総括表）** から着手。  
> **前提**: v2c-preview 完了（BUILD `structural-match` rev 123）。反省提案 B-1〜B-6 は **全承認済み**。

---

## 1. すでに決まっていること（§2.4 P3 — 再確認のみ）

| 項目 | 決定 |
|------|------|
| 印刷種別 | **通常印刷** / **差分付き印刷** を選択 |
| 差分付き | 画面上の比較モード・色付けを印刷に反映 |
| 削除行 | 画面で**展開中**のときだけ印刷に含める |
| フッター | 「比較: 版○ ○○（直前版／当初版）」を印字 |
| 対象 | **総括表・詳細表**（版管理タブは印刷対象外） |

正本: [`2026-06-20-jikkou-yosan-version-management-spec.md`](2026-06-20-jikkou-yosan-version-management-spec.md) §2.4

---

## 2. 明日 15 分で詰めること（浜田判断）

| # | 論点 | 選択肢 | 推奨 |
|---|------|--------|------|
| Q1 | UI | ラジオ / ドロップダウン | **ラジオ**（印刷ボタン横・2択） |
| Q2 | 比較オフ・版1のみ | 差分付きを無効化 | **無効**（通常のみ） |
| Q3 | 対象タブ | 総括・詳細それぞれの印刷ボタン | **両方**に同じ種別を適用 |
| Q4 | 差分サマリー印刷 | 1枚目に要約を載せるか | **Step2-3 確定**（2026-07-04 — [`2026-07-04-jikkou-yosan-diff-print-summary-v2d.md`](2026-07-04-jikkou-yosan-diff-print-summary-v2d.md)） |
| Q5 | 色 | 画面同色 / 印刷用に薄く | **画面同色**（モノクロは後日） |

---

## 3. 実装ステップ（使用感優先）

### Step 1 — 最短で触れる（目標: 当日〜翌日）

- [ ] 印刷ボタン付近に **通常 / 差分付き** ラジオ
- [ ] `openTabPrint` / `buildPrintSummaryHtml` / `buildPrintDetailHtml` に差分 CSS クラス付与
- [ ] 既存 `diffResult` + `structuralRowKey` を印刷 HTML 生成時に再利用
- [ ] フッターに比較対象版（`diffBaseMeta`）
- [ ] **総括表印刷**から先行リリース → deploy:736

### Step 2 — 実運用に近づける

- [ ] 詳細表印刷にも差分反映
- [ ] 削除行ブロックの印刷制御（展開時のみ）
- [ ] 差分一覧パネル相当の簡易サマリー（任意）

### Step 3 — フィードバック反映

- [ ] 色・レイアウト調整
- [ ] 差分付き印刷時の A4 改ページ確認

---

## 4. 技術メモ（実装者向け）

| 箇所 | 内容 |
|------|------|
| 印刷入口 | `openTabPrint(mode)` — `mode` は `summary` / `detail` |
| 差分コア | `scripts/jikkou-yosan-diff-core.mjs`（`computeBudgetDiff`, `structuralRowKey`） |
| 画面差分 | `prepareDiffForRender()` — 印刷前も `snapshotForDiff` で両版再計算 |
| 注意 | `recalcState` は `cost_lines` の `row_key` を保持すること（2026-06-23 修正済） |
| 連携行 | cascade 行は金額セルに増減額のみ（誤った全行マーク防止） |

---

## 5. 受け入れテスト（版2・材料 +7,600 の例）

1. 一覧 → 版2 → 直前版と比較がオン
2. 総括表で ② `▲ +7,600` を画面確認
3. **差分付き印刷** → プレビューで ②・材料費合計・⑧⑨ に色と増減
4. **通常印刷** → ハイライトなし
5. 削除行なし（行追加削除していない場合）

---

## 6. 関連 BUILD 履歴（2026-06-23）

| BUILD | 内容 |
|-------|------|
| `jikkou-yosan-confirm-status-fix` | 版確定ステータス |
| `jikkou-yosan-diff-preview-v2c` | 差分プレビュー初版 |
| `jikkou-yosan-diff-visibility-v2c1` | 増減額・サマリー |
| `jikkou-yosan-diff-cascade-split` | 直接編集 / 自動反映の分離 |
| `jikkou-yosan-diff-cascade-mark-fix` | cascade 行の誤マーク抑制 |
| `jikkou-yosan-diff-rowkey-fix` | row_key 再計算で消失するバグ |
| `jikkou-yosan-diff-structural-match` | 構造キー突合・53件削除誤表示解消 |
