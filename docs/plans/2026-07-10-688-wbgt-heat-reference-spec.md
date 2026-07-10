# 688 猛暑日（WBGT）参考表示 — 仕様（2026-07-10 GO）

**親 SPEC**: [`2026-06-13-construction-workdays-excel-20260613.md`](2026-06-13-construction-workdays-excel-20260613.md) §12  
**アプリ**: [688 工事稼働日数ダッシュ](https://jbis-kintone.cybozu.com/k/688/) · データ正本 [687](https://jbis-kintone.cybozu.com/k/687/)  
**状態**: **仕様 GO**（浜田 2026-07-10）· **implement 前**（commit/push 後に着手確認）  
**688 保留**: 本件のみ **部分解凍**（他改修は触らない）

---

## 0. 目的

施工主報告・月別表に **猛暑日数（WBGT 参考）** を載せられるようにする。  
**稼働可能日数・不稼働率・雨休率・足場/塗装の再算出結果には一切含めない**（参考専用）。

---

## 1. 計算（正本）

根拠: `C:\tmp\稼働日数算出ツール\猛暑日の日数計算方法.jpg` · `猛暑日日数計算方法、.txt`

| 段階 | 式 |
|------|-----|
| 時間集計 | 各 **時間** の WBGT **≥ 31** をカウント（1〜12月・全年同ロジック） |
| 日数換算 | `換算日数 = Σ(WBGT≥31 の時間数) ÷ 8h` |
| 月別表示 | 過去5年の **同月** 換算日数の **平均**（小数可） |
| 年間参考（任意表示） | 5年分の **年間** 換算日数の平均（画像例: 12.53日） |

**含めてはいけないもの（厳守）**

- 稼働可能日数 ※3 · 不稼働率 ※4 · 雨休率 · ダブり ※2 · `result_scaffold_days` / `result_paint_days`
- `calcWorkdays` / `calcWorkdaysExcel20260613` / `calcWorkdaysBundleForEstimate` の入力・出力

実装は **`workdays-heat-reference.mjs`**（新規）に分離し、`workdays-calc-core.mjs` には **パラメータを追加しない**。

---

## 2. データソース

| 項目 | 内容 |
|------|------|
| サイト | [環境省 暑さ指数(WBGT) 実泬値・予測値ダウンロード](https://www.wbgt.env.go.jp/wbgt_data_download.php) |
| 使用データ | **実測値（実況）のみ** — **予測値は対象外** |
| 気象要素 | **暑さ指数（WBGT）** のみ（湿球・黒球・品質情報は MVP では任意） |
| 期間 | 見積作成年 Y の **Y−5年 1/1 〜 Y−1年 12/31**（降雨・風速と同型） |
| サンプル | `C:\tmp\稼働日数算出ツール\dl_wbgt.2026071021.csv`（さいたま・時間別） |

### 2.1 CSV 形式（環境省 DL）

| 行 | 内容 |
|----|------|
| L1 | ダウンロード時刻 |
| L2 | 空 |
| L3 | 地点名（例: さいたま） |
| L4 | `日付,時間,暑さ指数` |
| L5〜 | `2021/4/1,1:00,13.1` … |

- エンコード: **Shift_JIS**（UTF-8 も受理）
- パーサ: `parseCsvWbgtHourly`（**日別2列パーサとは別**）

### 2.2 地点

- CSV 3行目 → 既存 `normalizeObsLocation`（`さいたま` / `大宮` エイリアス済）
- 風速・降雨と **地点不一致時は警告**（猛暑日のみ取込は可 · 監査用にメッセージ）

---

## 3. UI（688）

### 3.1 CSV 取込ヘルプ（降雨②同型）

**③ 猛暑日（参考・稼働計算外）**

- 気象要素: **暑さ指数（WBGT）**（時間別）
- 数え方: WBGT **≥31** の **時間** を集計 → **÷8h** → 月別 → 5年同月平均
- CSV: **日付・時間・暑さ指数** の3列
- ボタン: **`CSV→猛暑日（WBGT）`**

### 3.2 月別表 — 3タブ共通

| タブ | 猛暑日行 |
|------|----------|
| **足場** | 表 **最下行**（不稼働率 ※4 の下） |
| **塗装** | 表 **最下行**（雨休率の下） |
| **休日** | 表 **最下行**（不稼働率 ※4 の下） |

- 行ラベル: **猛暑日数（参考）※5**
- ※5 脚注: 「WBGT31以上の時間÷8hの月平均。**稼働可能日数等の算出には使用しない。**」

### 3.3 表示オプション

| フィールド（687） | UI | 既定 |
|-------------------|-----|------|
| `show_heat_reference` | ☑ 月別表に猛暑日行を表示 | **OFF** |
| `print_heat_reference` | ☑ 施工主報告印刷に猛暑日行を含める | **OFF** |

OFF 時は行自体を **非表示**（グレーアウト不可）。

### 3.4 過去5年タブ

- 新タブ: **「過去5年(猛暑日)」**（`ref-heat`）
- 降雨タブ同型の **年×月グリッド**（換算日数）
- 印刷: オプション ON 時 **過去5年猛暑日 1枚** を追加（降雨1枚と同型）

---

## 4. 687 フィールド追加

| コード | 種別 | 備考 |
|--------|------|------|
| `wbgt_data` | サブテーブル | `wbgt_obs_datetime`（DATETIME または DATE+TIME 2列）· `wbgt_value`（NUMBER） |
| `show_heat_reference` | CHECK_BOX | 画面表示 |
| `print_heat_reference` | CHECK_BOX | 印刷 |

スクリプト: `scripts/workdays-patch-fields-687-wbgt-heat.mjs`（新規）  
**順序**: 687 フィールド deploy → 688 customize deploy

`ref5yr` 組込 JSON（`workdays-5yr-omiya.json`）への猛暑ブロック追加は **任意**（初回は CSV 取込のみでも可）。

---

## 5. 実装・ゲート

```bash
# 687 フィールド（本番1回）
npx dotenv -e .env -e .env.proxy -- node scripts/workdays-patch-fields-687-wbgt-heat.mjs

npm run workdays:build-desktop:688
npm run workdays:calc-gate          # 既存値不変
npm run workdays:heat-reference-gate  # 新規 · 猛暑日のみ
npm run cio:preflight:688 -- --note "688 WBGT heat reference"
npm run deploy:688
```

**`workdays:heat-reference-gate`（新規）**

- `dl_wbgt.2026071021.csv` または `scripts/data/workdays-wbgt-sample-saitama.csv` で月別換算を検証
- `calc-gate` の scaffold/paint が **猛暑日 ON/OFF で同一**であることを assert

---

## 6. AIチームレビュー（2026-07-10）

| # | 観点 | 判定 | コメント |
|---|------|------|----------|
| R1 | **稼働計算との分離** | **GO** | 別モジュール `workdays-heat-reference.mjs` · `calc-core` 非改変 |
| R2 | **既存 regression** | **GO** | `workdays-calc-gate` 不変 · 猛暑日は post-render のみ |
| R3 | **CSV パーサ** | **GO** | 時間別3列 · Shift_JIS · 先頭4行スキップ — サンプル検証済 |
| R4 | **地点** | **GO** | `さいたま` は `OBS_OPTIONS` 既存 · 大宮エイリアスあり |
| R5 | **687 フィールド** | **条件付き GO** | 本番フィールド追加を **688 deploy より先**に実施 |
| R6 | **データ源** | **GO** | 環境省実測 WBGT · 予測値除外を UI/ヘルプで明示 |
| R7 | **688 保留** | **GO** | 浜田 **部分解凍 GO** — 本 SPEC スコープのみ |
| R8 | **印刷** | **GO** | 塗装・足場・休日 **3枚** + 5年シート · `print_heat_reference` で制御 |

**総合**: **問題なし — 仕様 GO · implement 着手可**（浜田の implement 確認後）

**盲点（記録）**

- 品質情報列付き CSV の除外ルールは **サンプル入手後に追記**（MVP は数値列のみ）
- 組込 `ref5yr` 無し初回は **CSV 取込必須** — ヘルプに明記

---

## 7. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-10 | 初版 · 浜田 GO · AIチームレビュー GO |
| 2026-07-10 | **浜田目視 OK** — 東京WBGT CSV · 画面/印刷 · 過去5年(猛暑日) rev82 |
