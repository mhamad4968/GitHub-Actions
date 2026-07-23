# Ver.02 仕様総点検チェックリスト（#R-OPS-01）

**制定**: 2026-07-22 浜田 GO（夕反省）  
**用途**: 「仕様どおり完了」宣言の前に **2 行とも**チェック。どちらか欠けると完了と書かない。  
**絶対条件（2026-07-23 浜田）**: 行 A の点検は **観点の異なる複数パス**で行う（単一路線の突合だけでは不可）。正本: `docs/plans/2026-07-23-jikkou-yosan-ver02-multi-pass-audit.md`。

| # | 点検行 | 正本 | 完了条件 | 状態（2026-07-23） |
|---|--------|------|----------|-------------------|
| A | **仕様総点検**（U1–U30 / D-* / Y1–Y11 / Imp-*） | `docs/plans/2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md` | ギャップ表を更新し、未解消は残課題として明示 | **多パス＋S1–S3是正済**（2026-07-23）。重大L2コード是正済。残L1=R-11/12/13。LIVE BUILD `2026-07-23-ver02-spec-s1s2s3` rev58 |
| B | **リスト正本突合**（名称・規格1/2/3・取引先） | Excel `データマスタ` / `scripts/data/jikkou-yosan-v2-excel-name-lists.json` | `npm run verify:jikkou-name-lists-excel` exit 0 | **OK**（2026-07-23 再確認） |

**#R-CONST-01**: 「当面コンボ」は **候補源が Excel 正本であること**を含む。UI だけ datalist で候補が仮シードなら **未完了**。

**関連**: #R-NAME-01 / #S-NAME-01 / `docs/approved-changes/2026-07-22-evening-reflection-hamada-go.md`  
**ギャップ表**: `docs/plans/2026-07-23-jikkou-yosan-ver02-spec-audit-gap-table.md`
