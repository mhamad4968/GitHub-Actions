# R-19 / R-20 DD 棚卸し（736 READ-ONLY ヒント · 2026-07-25 夕方）

**制約**: App **735/736 書込禁止**（[736 画面](https://jbis-kintone.cybozu.com/k/736/) は参照のみ）。実装反映は依頼者回答（早くて **7/27**）または浜田 GO 後。

## 突合メモ（CIO）

| 項目 | 736（現行・参照） | Ver.02（756 側・正本候補） | DD 含意 |
|------|-------------------|---------------------------|---------|
| R-19 名称規格 | `datalist` + `masterCache`（工種名・工種CD・種別・種別CD）を **コード表アプリ**から動的読込 | `scripts/data/jikkou-yosan-v2-excel-name-lists.json`（Excel DV 実測・プロファイル切替） | 736はマスタ連動、756は Excel 固定シード。依頼者リスト差し替え前は **Excel JSON を正**とし、736の動的マスタは「将来の選択中心化」参考 |
| R-20 取引先 | ブロック vendor 行 + 手入力中心（`sub_vendor` / mat vendor） | `vendors[]` 60件前後（`データマスタ!J3:J103`）をシード | 736はリスト強制が弱い。756は Excel 取引先をシード済み → **リスト外入力の扱い**だけ依頼者確認が残る |
| UI パターン | `datalist(id, items)` を複数（wt/cat/sub-type） | Chrome datalist 絞り込み対策コメントあり（`desktop.ui.js`） | 736の datalist 実装は参考可。ピクセル一致は求めない（SPEC A-07） |
| データ移行 | `migrate-from-736-*` モジュールあり | 735/736 WRITE 禁止のまま読取移行のみ設計 | Excel 完全移行は依頼者データ待ち（checkpoint 継続メモ3） |

## 依頼者回答待ちで進められること（書込なし）

1. R-19: プロファイル別 `name1/name2/name3` と工種CD→profile 対応表の **欠番・表記ゆれ**棚卸し（JSON vs `docs/plans/2026-07-20-jikkou-list-source-scan.md`）
2. R-20: `vendors` と明細列 I（警備系など）の **役割分担**を1表に整理（どちらが名称2/3か）
3. 736 画面の操作感は **目視ヒントのみ**（customize/736 編集・deploy しない）

## やらないこと

- `customize/736/**` 編集・deploy
- 旧 BUILD の 756 再 deploy
- 依頼者未回答の正式リストを独断で確定すること
