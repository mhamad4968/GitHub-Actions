# 実行予算支援ツール Ver.02 — 実装判断前成果物一覧

**基準日時**: 2026-07-21
**状態**: 成果物作成・P-33〜P-44反映・最終AIチーム再監査完了（設計GO／実装GO待ち）
**重要**: 実装GOなし。コード・スクリプト・kintoneアプリ・設定・deploy・テストデータは未作成／未変更。

## 1. 正本・設計成果物

| 成果物 | 役割 | 状態 |
|---|---|---|
| `2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md` | 業務仕様正本。P-21〜P-44、R-21〜R-24を含む | DRAFTだが各CONFIRMED項目は実装根拠 |
| `2026-07-21-jikkou-yosan-ver02-3app-schema-design.md` | 3アプリ責務、キー、複製、ロック、予実縦持ち、将来スクリプト方針 | REVIEW対象 |
| `2026-07-21-jikkou-yosan-ver02-3app-field-catalog.md` | 全物理フィールドコード・型・必須/一意・責務分離 | REVIEW対象 |
| `2026-07-21-jikkou-yosan-ver02-preimplementation-test-plan.md` | 計算、キー、競合、版、予実、7/23 Excel突合の試験計画 | REVIEW対象 |
| `2026-07-21-jikkou-yosan-ver02-final-reaudit-report.md` | 独立再監査・指摘修正・最終設計GO報告 | **FINAL** |
| `2026-07-20-jikkou-yosan-ver02-field-mapping-draft.md` | Excel/業務項目と3アプリ設計の対応 | 3アプリ設計へ更新済み |
| `2026-07-20-jikkou-yosan-ver02-block-inventory.json` | Excel観測のNo.1〜42・給与5行の候補台帳 | 新規強制投入には使わない |

## 2. 今回固定した安全設計

1. 3アプリJOINは変更可能な工事コードではなく不変`project_id`。
2. P-29重複検出は`project_business_key`、同時初版は`series_guard_key`、同時次版は`version_record_key`。
3. ①↔②所属版は`budget_version_id`、③の`registered_version_id`は監査専用。
4. ②の版間追跡は`stable_block_id + row_key`。
5. ③は実績非コピー、月別縦持ち、最終予算は工事・原価行ごとに1件。
6. ロックの正は①の`status`＋新版存在。②スナップショットは権限用派生値。
7. 新版・通常予算・予実保存は`bulkRequest`＋`revision`で原子保存。
8. 金額正は②`active`ブロック計。①は再生成キャッシュ。`retired`は現行予算0。
9. 請負/給与はROUNDなし十進保持、内訳は行ROUND、税込/率はExcel互換ROUND。
10. 7/23は依頼者提供の正データExcelを公式期待値にする。

## 3. 意図的に未作成（実装判断後）

- 3アプリ用フィールドJSON
- アプリ作成・設定スクリプト
- 計算コア・カスタムUI・版複製処理
- kintoneのアプリ、ビュー、権限、関連レコード
- Space 56への変更
- テストレコード・データ投入

## 4. AIチーム再監査の必須論点

1. `project_id`／業務キー／版ID／ブロックID／行キーの責務と一意制約。
2. 同時初版・同時次版・旧画面保存のレース条件。
3. ①の総括投影サブテーブルと②「1行=1レコード」の二重正本化リスク。
4. ③の`monthly_consumption`と`final_budget`を同一アプリに置く妥当性。
5. P-30（月次粒度）と§9.4「実績日」の整合。
6. 請負ROUNDなしの小数保存と整数表示の両立。
7. Excelライク1画面のために必要なAPI件数・保存の原子性・再実行性。
8. kintone標準機能だけで防げない権限・API迂回。
9. 7/23までの現実的範囲と、見せてはいけない未検証箇所。

## 5. 判定ルール

- Blocker/Highが1件でも残る: NO-GO
- Mediumのみ: 解消方針と試験が明示されるまで条件付きGO
- 矛盾0、必須試験定義済み、浜田明示GO: 実装着手可能

再監査結果と提案を浜田へ報告し、浜田の実装判断を受けるまで実装しない。
