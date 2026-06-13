# 工事稼働日数算出 — Excel 20260613 準拠（688/687）

**正本ツール**: `C:\tmp\稼働日数算出ツール\稼働日数算出ツール20260613.xlsx`  
**前提 SPEC**: `docs/plans/2026-05-17-construction-workdays-spec-v1.md`（Space 56・687/688 構成）  
**更新日**: 2026-06-13  
**本番 BUILD（688）**: `2026-06-13-688-ref5yr-zero-year-register`（revision 23）

---

## 1. 入力・基準年

| 項目 | 仕様 |
|------|------|
| **見積作成年** | 必須。687 フィールド `estimate_year`（NUMBER）。688 の主入力。 |
| 着工日・完工日 | **不要**（687 では任意。688 では非表示）。 |
| 休日・暦日 | **見積作成年**の各月全日を暦日 C とする。 |
| 手動休日 | GW・夏休み・年末年始（月別サブテーブル `holiday_manual`） |

## 2. ※1 気象日数（過去5年）

| 項目 | 仕様 |
|------|------|
| 参照期間 | **見積作成年 Y の直前5年**（Y−5 〜 Y−1）。例: 2026 → 2021〜2025 |
| 足場 | 日別最大風速 **≧10 m/s** の月別日数 → 5年平均 |
| 塗装・休日 | 日別降水量 **≧10 mm**（気象庁「降水量の日合計 (mm)」）の月別日数 → 5年平均 |
| 表の月列 | **常に 1月〜12月**（見積年の暦月） |

算出式は Excel 20260613 と同一（`calcWorkdaysExcel20260613` / Option A 祝日マスタ）。

## 3. 過去5年参照表（打合せ・監査用）

688 タブ「過去5年(風速)」「過去5年(降雨)」に **Excel と同じ全閾値表** を表示。

| 種別 | 閾値 |
|------|------|
| 風速 | ≧10 / 15 / 20 / 30 m/s |
| 降雨 | ≧1 / 10 / 30 / 50 / 70 / 100 mm |

- 列は **見積作成年に対応する過去5年** のみ表示。
- 月列ヘッダー下の「2026年」等の年ラベルは **表示しない**。
- 該当日が0件の月・閾値も **0日** として登録（不足年警告を出さない）。

## 4. 参照データの構成

| 層 | 内容 |
|----|------|
| 組込 JSON | `scripts/data/workdays-5yr-omiya.json`（大宮地区・2018〜2025 等） |
| 687 保存 | 風速・降雨の **日別行**（`wind_data` / `rain_data` サブテーブル） |
| 実行時 | 組込 JSON ＋ 保存済み日別行をマージして `ref5yr` を再構築 |

**保存しない場合**: CSV 取込結果はセッション内のみ。再読込で消える。  
**保存した場合**: 案件読込時に日別行から再マージされ、過去5年表が再現される。

## 5. CSV 取込（688 UI）

| 項目 | 仕様 |
|------|------|
| ファイル | **風速CSV** と **降雨CSV** を **別々に** 取込（両方必要） |
| 形式 | 2列（日付, 値）。Shift_JIS / UTF-8 自動判定 |
| マージ | 組込参照表に **同じ年は上書き・新年は追加** |
| 全閾値 | 1回の取込で当該種別の全閾値ブロックを更新 |
| 再算出 | 取込後に自動実行（≧10m/s と ≧10mm が揃っていること） |

**例**: 見積作成年 2016 → 2011〜2015 の日別 CSV を風速・降雨それぞれ取込 → 表に 2011〜2015 が反映。

リポジトリ一括更新（開発用）:

```bash
npm run workdays:import-jma-csv
```

## 6. 687 フィールド追加

| コード | 種別 | 備考 |
|--------|------|------|
| `estimate_year` | NUMBER | 見積作成年（必須） |
| `start_date` / `end_date` | DATE | 任意（後方互換） |

追加スクリプト: `scripts/workdays-add-estimate-year-687.mjs`

## 7. ビルド・デプロイ・ゲート

```bash
npm run workdays:build-desktop:688
npm run workdays:calc-gate
npm run workdays:deploy-gate -- 688
npm run deploy:688
```

Runbook: `docs/runbooks/workdays-deploy-checklist.md`

## 8. 計算正本

- `scripts/workdays-calc-core.mjs`
  - `pastFiveYearsForEstimate`
  - `build5yrMonthlyAverages`
  - `calcWorkdaysBundleForEstimate`
  - `mergeDailyCsvIntoRef5yr` / `aggregateDailyToMonthlyCounts`
- 回帰: `scripts/workdays-calc-gate.mjs`（Excel 2023 足場・塗装 ±2.5 日）
