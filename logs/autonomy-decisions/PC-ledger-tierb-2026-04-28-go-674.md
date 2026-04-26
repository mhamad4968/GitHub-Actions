# PC 台帳 674 — Tier B GO 実行ログ（2026-04-28）

## 前提

- **浜田 GO**: チャット「GOでお願いします。」（App **674** のみ）。

## 実行順（直列）

1. `POST /k/v1/preview/app/form/fields.json` — **594 HW 7 件**（manufacturer … extra_info_2）+ **`internal_system_meta`（GROUP）** → revision **11** → preview **deploy** SUCCESS  
2. `npm run pc-ledger:674:layout-internal-group` — 内部メタ 5 件を `internal_system_meta` 内へ layout 移動 → revision **12** → deploy SUCCESS  
3. `npm run pc-ledger:apply-labels -- --app=674` — ラベル **2 件**更新 → revision **13** → deploy SUCCESS  
4. `npm run deploy:674` — customize `new-pc-ledger-v1/desktop.js` → revision **14** / fileKey `741fd3e9-fce3-4efb-ad15-833cc6363bc1` → **Deploy SUCCESS**  
5. `npm run revision:snapshot -- --app=674 --label=go-2026-04-28-hw-group-customize` → `data/snapshots/674-go-2026-04-28-hw-group-customize-20260427-083803.json`（live **revision 14**）  
6. `npm run field-spec:diff` — **43/43 match**  
7. `npm run kintone:test` — **9/9**  
8. `npm run smoke:quiet` — **9/9**

## メモ

- 594 / 627 / 626 / 667 等への write **なし**。
