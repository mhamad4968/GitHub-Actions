# 687/688 工事稼働日数 — deploy チェックリスト（R6 + R10 承認）



表 UI または `workdays-calc-core.mjs` を触ったセッションは **deploy 前に必読**。

**運用（#R-688-DEPLOY-01 · 2026-07-11）**: **浜田の実装 GO 後**に `customize/688` を修正したら、**同一セッション内**で `cio:preflight:688` → `deploy:688` まで完走してから目視依頼する（deploy 忘れ禁止）。

仕様（Excel 20260613）: `docs/plans/2026-06-13-construction-workdays-excel-20260613.md`



## 0. 一括ゲート（R10）



```bash

npm run workdays:deploy-gate -- 688   # または 687

```



= **R1** `workdays-verify-built-ui` + **R4** `workdays-calc-gate`。`deploy:687` / `deploy:688` に組込済。



## 1. ビルド



```bash

npm run workdays:build-desktop      # 687

npm run workdays:build-desktop:688  # 688（REF5YR JSON を desktop.js に同梱）

```



参照 JSON 更新（気象庁 CSV → リポ）:



```bash

npm run workdays:import-jma-csv

npm run workdays:build-desktop:688  # 再ビルド必須

```



## 2. preflight → deploy



```bash

npm run cio:preflight:688 -- --note "（規律一行）"

npm run deploy:688

```



`deploy:688` / `deploy:687` の順: **deploy-gate** → preflight guard → deploy → **R3** `sync-kintone-apps-build`（deploy 成功時自動）。



## 3. 手動確認（ゲート未カバー分）



- 見積作成年入力 → 過去5年（Y−5〜Y−1）が表・算出に反映

- 過去5年タブ: 風速4閾値・降雨6閾値が縦並び

- CSV 取込: 風速・降雨 **両方** で再算出成功

- 月列は **1月〜12月**（見積年暦月）

- 月列ヘッダー下に **年ラベルが無い** こと



## 4. 計算正本変更時（R4）



`scripts/workdays-calc-core.mjs` を変えたら **同一セッション**で `workdays-calc-gate.mjs` を更新すること。



## 5. 687 フィールド



見積作成年 `estimate_year` 追加: `scripts/workdays-add-estimate-year-687.mjs`（初回のみ）。



## 承認



| ID | 内容 | 承認日 |

|----|------|--------|

| R1 | UI マーカー grep | 2026-06-09 + 2026-06-10 再確認 |

| R2 | 月列ソート | 同上 |

| R3 | BUILD 同期 | 同上（`deploy-customization.js`） |

| R4 | calc-gate | 同上 |

| R5 | 締めスコープ | `session-close-reflection-scope.md` |

| R6 | 本 runbook | 同上 |

| R10 | deploy-gate 一括 | **2026-06-10 浜田 GO** |



## 関連



- 反省会スコープ: `docs/runbooks/session-close-reflection-scope.md`

- 6/9 詳細: `docs/reports/2026-06-09-evening-reflection.md`

- 6/10 承認: `docs/approved-changes/2026-06-10-rules-r1-r12-hamada-go.md`

- Excel 20260613 仕様: `docs/plans/2026-06-13-construction-workdays-excel-20260613.md`

