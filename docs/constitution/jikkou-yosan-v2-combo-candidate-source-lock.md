# 「当面コンボ」解釈ロック（#R-CONST-01）

**GO**: 2026-07-22 浜田承認（夕反省）

「当面コンボ」（datalist + 手入力）と書いてある要件は、**UI がコンボであることだけでは完了ではない**。

完了条件に含むもの:

1. **候補源が Excel データマスタ正本**（`scripts/data/jikkou-yosan-v2-excel-name-lists.json`）
2. 仮シード・レコード値の吸い上げで候補を膨らませない（#R-NAME-01）
3. `npm run verify:jikkou-name-lists-excel` が exit 0（#S-NAME-01）

仮シードのままの datalist は **未完了**。

関連: `docs/plans/2026-07-22-jikkou-yosan-ver02-spec-audit-checklist.md`（#R-OPS-01）
