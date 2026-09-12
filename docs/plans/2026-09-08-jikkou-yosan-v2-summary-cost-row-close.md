# 756 統括原価行 — 2026-09-08 クローズ仕様

**日付**: 2026-09-08  
**状態**: **LIVE・浜田目視OK**。このラウンドの [756](https://jbis-kintone.cybozu.com/k/756) customize はここまで。  
**LIVE**: BUILD `2026-09-08-ver02-summary-himoku-type` rev **359** / fileKey `28f0ea90-6ba5-4db5-a0c3-1f0f7f557a3f`  
**親正本**: `docs/plans/2026-09-05-jikkou-yosan-v2-summary-tonight-decisions.md`（§2 を本ファイルが上書き）  
**内訳正本**: `docs/plans/2026-09-04-jikkou-yosan-v2-uchiwake-hierarchy-spec.md`（不触）  
**736**: 不触

---

## 1. このラウンドで確定したこと

統括タブの **原価行だけ**。

| 項目 | 確定 |
|------|------|
| 行の粒 | **内訳ブロック × 費目 × 種別**（諸経費フッタは施工ブロック末の別行） |
| ブロック | **またがない**。同じ費目＋種別でも内訳№が違えば別行 |
| 会社・人 | 行を分けない。同じブロック内の同じ費目＋種別は **1行に合算** |
| 列 | **11列**（画面と印刷は同じ）。会社名・氏名の列は出さない |
| 費目列 | 出さない。キーには費目を残す（「材料費」と「外注費×材料費」は混ぜない） |
| 備考 | 手入力のみ。旧6欄 `row_key` は4欄へ正規化。衝突は先の備考 |
| 保存フィールド | `summary_vendor_name` / `summary_person_name` / `summary_row_key` は **削除しない** |

### 11列

1. 内訳№（自動・ジャンプ）  
2. 区分  
3. 工種番号  
4. システム工種  
5. 種別  
6. 材料  
7. 単位  
8. 数量  
9. 単価  
10. 金額  
11. 備考（入力）

数量・単価: 単位が全部同じなら数量合計・単価＝ROUND(金額÷数量, 0)。混在は 式 × 1 × 金額。

---

## 2. このラウンドで触っていないこと

今作らない。9/10 レビューや別依頼があるまでコード・deploy しない。

| 対象 | 正本・メモ |
|------|------------|
| 内訳の会社名・氏名入力 | 内訳正本のまま |
| 給与手当の名称・氏名 | T/U listOnly のまま |
| 工事原価管理（予実）タブ | **G0 正本** `docs/plans/2026-09-12-jikkou-yosan-v2-cost-mgmt-g0.md`（工種単位の作り直し。実装は別途GO。本クローズの「作り直さない」は予実について上書き） |
| 作業者設定タブ | 駐車 `docs/plans/2026-09-06-jikkou-yosan-v2-salary-staff-settings-tab-parked.md` |
| 請負の全面作り直し | しない |
| 736 / 757 customize deploy | しない |

---

## 3. 9/10 関係者レビュー

2026-09-10 に関係者レビュー。そこで出た修正・原価管理表・作業者設定は **そのときの依頼と実装GO** で着手する。本ファイルは「いまの統括原価行の正」であり、予実・設定タブの仕様ではない。

**2026-09-12 夜**: 予実の G0 は `docs/plans/2026-09-12-jikkou-yosan-v2-cost-mgmt-g0.md`。**行の粒**は `docs/plans/2026-09-12-jikkou-yosan-v2-summary-split-by-unit.md` が上書き（単位が違うと統括で分ける）。11列は本ファイルのまま。customize は単位分けの実装GOまでしない。

---

## 4. コード位置

- 投影: `scripts/lib/jikkou-yosan-v2/projection.mjs`
- 画面・印刷: `customize/jikkou-yosan-v2-app1/desktop.ui.js`（bundle `desktop.js`）
