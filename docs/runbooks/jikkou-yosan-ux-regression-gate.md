# 実行予算書 736 — UX 先祖返りゲート（B-3）

> **いつ**: `customize/736/**` を触った **push 前** と **deploy 前**（自動）  
> **目的**: 依頼者UX v2 / v2d で確定した UI 配置・per-block 削除行・ui/js 同期を **機械で固定**する

---

## 背景（2026-07-04 事故）

| 事故 | 原因 |
|------|------|
| live が古い UI のまま | `desktop.ui.js` に修正があるのに `desktop.js` 未 build / 未 deploy |
| sticky / 印刷 UI が消える | リファクタ時に `renderFormActionBar` から要素が外れる |
| 削除行が表末に戻る | `diffDeletedExpanded` 固定 map / 材料一括 `renderDiffRemovedBlock` に戻る |

---

## コマンド

```bash
# 単体
npm run jikkou-yosan:ux-gate
npm run jikkou-yosan:ui-js-sync-gate

# push 前（736 変更時のみ実行）
npm run jikkou-yosan:pre-push-gate

# deploy 前（build 内包）
npm run jikkou-yosan:deploy-gate
```

---

## 検証内容

正本: `scripts/data/jikkou-yosan-ux-invariants.json`

| 区分 | 例 |
|------|-----|
| **must** | `headerOpen = false`、`.jy-sticky-top`、`renderActionBarPrintTools`、材料 per-block 削除行、v2d 印刷サマリー |
| **mustNot** | `headerOpen = true`、材料一括削除行、`<details … open>` 差分一覧 |
| **syncAnchors** | ui の特徴文字列が `desktop.js` に存在（build 漏れ検知） |

**新 UX を追加したら** invariants JSON に must を 1 行追加し、意図的に外す旧パターンがあれば mustNot も追加する。

---

## 運用ルール

1. **編集は `desktop.ui.js` のみ** — `desktop.js` 直編集禁止
2. 変更後 **`npm run jikkou-yosan:build-desktop`**（`JIKKOU_YOSAN_BUILD=` 必須）
3. **push 前** `jikkou-yosan:pre-push-gate`（pre-push hook 経由でも可）
4. **deploy 前** `jikkou-yosan:deploy-gate` + 手動 diff-smoke / UX smoke（下記）
5. handoff に 1 行: `736 ux-gate: OK` または NG 内容

---

## 手動 UX smoke（deploy 前・約 3 分）

| # | 操作 | 期待 |
|---|------|------|
| U1 | 版2を開きスクロール | 文字サイズ・印刷・タブ・差分青帯が **画面上部固定** |
| U2 | 差分比較 ON | 黄帯「簡潔/詳細」が固定行に表示 |
| U3 | 初期表示 | 工事基本情報・差分一覧が **閉**、茶色案内あり |
| U4 | 詳細表・材料 | 塗料/その他ブロック合計 **直下** に削除行（折りたたみ） |
| U5 | 差分付き印刷プレビュー | 先頭 1 ページ = 差分サマリー |

記録例: `736 ux-smoke: OK（sticky+per-block+summary-page）`

---

## 関連

- 差分 calc smoke: `docs/runbooks/jikkou-yosan-diff-smoke.md`
- 仕様: `docs/plans/2026-07-04-jikkou-yosan-diff-print-summary-v2d.md`
- deploy 品質ゲート: `docs/runbooks/push-deploy-quality-gates-v2.md`
