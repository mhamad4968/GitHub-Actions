# Ver.02 仕様総点検チェックリスト（#R-OPS-01）

**制定**: 2026-07-22 浜田 GO（夕反省）  
**用途**: 「仕様どおり完了」宣言の前に **2 行とも**チェック。どちらか欠けると完了と書かない。

| # | 点検行 | 正本 | 完了条件 |
|---|--------|------|----------|
| A | **仕様総点検**（U1–U30 / D-* / Y1–Y11 / Imp-*） | `docs/plans/2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md` | ギャップ表を更新し、未解消は残課題として明示 |
| B | **リスト正本突合**（名称・規格1/2/3・取引先） | Excel `データマスタ` / `scripts/data/jikkou-yosan-v2-excel-name-lists.json` | `npm run verify:jikkou-name-lists-excel` exit 0 |

**#R-CONST-01**: 「当面コンボ」は **候補源が Excel 正本であること**を含む。UI だけ datalist で候補が仮シードなら **未完了**。

**関連**: #R-NAME-01 / #S-NAME-01 / `docs/approved-changes/2026-07-22-evening-reflection-hamada-go.md`
