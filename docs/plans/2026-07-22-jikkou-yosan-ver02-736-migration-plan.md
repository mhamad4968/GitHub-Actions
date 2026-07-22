# 736 → Ver.02 データ移行計画

**作成日**: 2026-07-22  
**状態**: Phase B — 書込み経路実装済（`--execute --project-code` + GO）。パイロット未実行（浜田 execute GO 待ち）  
**ソース**: App **736**（実行予算書 ver.01・READ ONLY）  
**移行先**: App **756**（①親/総括）・**757**（②内訳明細）・**758**（③実績）

**関連正本**

- [`2026-07-21-jikkou-yosan-ver02-3app-schema-design.md`](2026-07-21-jikkou-yosan-ver02-3app-schema-design.md)
- [`2026-07-21-jikkou-yosan-ver02-3app-field-catalog.md`](2026-07-21-jikkou-yosan-ver02-3app-field-catalog.md)
- [`2026-07-20-jikkou-yosan-ver02-field-mapping-draft.md`](2026-07-20-jikkou-yosan-ver02-field-mapping-draft.md)
- 736 フィールド正本: `customize/736/desktop.js` の `FC` 定数
- Ver.02 スキーマ JSON: `scripts/data/jikkou-yosan-v2-app{1,2,3}-fields.json`

---

## 0. 不変制約

| 制約 | 内容 |
|---|---|
| **FORBIDDEN** | App **735** / **736** への一切の WRITE（更新・削除・フィールド追加含む） |
| **移行単位** | 736 の **1レコード = 1予算版** → App1 親 1 件 + App2 フラット行 N 件 + App3 0 件（初回） |
| **execute ゲート** | `JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1` **かつ** `--execute` の両方が必要 |
| **既定** | **dry-run**（736 READ のみ・756/757/758 へ POST なし） |
| **キー発行** | `project_id` / `budget_version_id` / `stable_block_id` / `row_key` は移行時に新規 UUID（736 の `$id` は `source_record_id` に監査保存） |
| **保存経路** | 本番移行は App1 カスタム UI の `bulkRequest` 原子保存と同等ロジックを CLI から再利用（直接 757 REST 単体 POST 禁止） |

---

## 1. 736 データモデル（移行前）

736 は **単一アプリ・多サブテーブル** 構成。

| サブテーブル | 736 コード | 役割 |
|---|---|---|
| 請負明細 | `spec_lines` | 施工/保安の契約工種行 |
| 総括原価 | `cost_lines` | 原価投影（`連携`/`link` 行は内訳ブロックと detail_marker で結合） |
| 材料明細 | `mat_lines` | ②③ 材料ブロック（`mat_group`: 塗料/その他） |
| 内訳明細 | `subcontract_lines` | 工種ブロック（`subcontract_block` + `sub_row_kind`） |

版管理フィールド（736 トップ）: `version_type`, `version_seq`, `source_record_id`, `status`, `is_locked`, `revision_note`

---

## 2. フィールド対応表

### 2.1 App1（756）— 親レコード

#### 2.1.1 版・キー（移行時生成）

| 736 | App1 | 変換 |
|---|---|---|
| — | `project_id` | 同一 `project_code` 系列の初版で発行し全版で共有 |
| `project_code` | `project_code` + `project_branch` | 736 に枝番フィールド無し → `2423101-2` 形式なら `-` 以降を `project_branch` に分割（要パイロット確認） |
| — | `project_business_key` | `project_code\|project_branch`（keys.mjs） |
| — | `budget_version_id` | 版ごとに新規 `bv-…` |
| — | `series_guard_key` | 初版: `project\|businessKey` / 次版: `version\|budget_version_id` |
| — | `version_record_key` | `project_id\|version_seq` |
| `$id` | `source_record_id` | 736 レコード ID を監査用に保存 |
| — | `actual_write_seq` | `0` 固定（③未移行） |
| — | `derived_lock_state` | `status=版確定` または `is_locked` から導出 |
| — | `write_channel` | `migration_from_736`（監査用・将来 DD 追加時） |

#### 2.1.2 工事ヘッダ（直接写し）

| 736 | App1 |
|---|---|
| `version_type` | `version_type` |
| `version_seq` | `version_seq` |
| `source_record_id` | `source_record_id`（736 内の複製元。$id とは別） |
| `status` | `status` |
| `is_locked` | `is_locked` |
| `revision_note` | `revision_note` |
| `client_name` | `client_name` |
| `project_official_name` | `project_official_name` |
| `project_name` | `project_name` |
| `start_date` / `end_date` | `start_date` / `end_date` |
| `site_entry_date` / `draft_date` | 同名 |
| `girder_type` / `order_branch` / `department` | 同名 |
| `safety_rule_88` | `safety_rule_88` |
| `person_in_charge` | `person_in_charge` |
| `note` | `note` |
| `ui_col_layout_json` | `ui_col_layout_json` |

#### 2.1.3 サブテーブル → App1 サブテーブル

**spec_lines → contract_lines**

| 736 子フィールド | App1 子フィールド |
|---|---|
| `spec_row_key` | `contract_row_key` |
| `spec_name` | `contract_work_name` |
| `spec_category` | `contract_section`（施工/保安） |
| `spec_unit` | `contract_unit` |
| `spec_qty` | `contract_qty` |
| `spec_unit_price` | `contract_unit_price` |
| `spec_amount` | `contract_amount` |
| `spec_note` | `contract_note` |
| — | `contract_sort_order` | 行インデックス |

**cost_lines（非 link）→ summary_cost_lines**

| 736 子フィールド | App1 子フィールド | 備考 |
|---|---|---|
| `cost_row_key` | （内部） | summary 行キー |
| `cost_work_type_code` | `summary_work_type_code` | |
| `cost_work_type` | `summary_work_type_name` | |
| `cost_budget_category` | `summary_cost_category` | 施工/保安/給与手当 |
| `cost_category` | `summary_line_type` | 種別 |
| `cost_unit/qty/unit_price/amount` | `summary_unit/qty/unit_price/amount_excl_tax` | 税抜 |
| `cost_tax_rate` | `summary_tax_rate` | 0/0.08/0.1 → 0％/8％/10％ ラベル変換 |
| `cost_basis_note` | `summary_calc_basis` / `summary_note` | 分割ルール要パイロット |
| `detail_marker` | `summary_block_no` | link 行のみ。非 link は空 |
| link 行の `subcontract_block` | `summary_stable_block_id` | **App2 の stable_block_id と一致必須** |

**736 に無い App1 フィールド**

- `salary_lines`: 736 では cost_lines 内の給与相当行 → `cost_budget_category=給与手当` で抽出し salary_lines へ正規化（要ロジック）
- 集計キャッシュ (`contract_total_1`, `cost_total_8`, `profit_9` 等): 保存後 JS 再計算で整合確認。不一致は移行拒否

---

### 2.2 App2（757）— 内訳フラット行

736 の **1 サブテーブル行 = App2 の 1 レコード**。

#### subcontract_lines → App2

| 736 | App2 | 変換 |
|---|---|---|
| `sub_row_key` | `row_key` | 版間継承用 UUID（空なら新規） |
| `subcontract_block` | `stable_block_id` | 736 ブロック ID を版間 UUID に昇格 or 写し（パイロットで固定） |
| `sub_row_kind` | `row_kind` | 下表 |
| `sub_vendor` | `vendor_name` | vendor 行 |
| `sub_line_type` | `name_2`（細目） | 種別 `name_1` は Excel 整列（材料費/労務費/工具･機械使用料）で補完。旧: name_1 直入れは1列ずれ |
| `sub_unit/qty/unit_price/amount` | `unit/quantity/unit_price/amount` | 内訳は整数 ROUND |
| `sub_basis` | `calc_basis` | |
| — | `detail_record_key` | `budget_version_id\|row_key`（64 字以内 compact UUID） |
| — | `project_id`, `budget_version_id`, `project_business_key` | 親から複写 |
| — | `block_no`, `block_sort_order`, `row_sort_order` | 736 行順から再採番 |
| — | `block_status` | `active` |
| — | `parent_lock_snapshot` | 親 `derived_lock_state` から |
| — | `write_channel` | `migration_from_736` |

**sub_row_kind → row_kind**

| 736 `sub_row_kind` | App2 `row_kind` |
|---|---|
| `vendor` | `block_header` |
| `detail` | `detail` |
| `overhead` | `overhead` |
| `block_total` | `block_total` |
| `legal_welfare` | `legal_welfare` |
| `order_amount` | `detail`（要レビュー） |
| `labor_total` | `subtotal` |

#### mat_lines → App2（材料ブロック）

| 736 | App2 | 備考 |
|---|---|---|
| `mat_row_key` | `row_key` | |
| `mat_vendor` | `vendor_name` | |
| `mat_group` | `name_2` | 塗料等。先頭行の `name_1`＝材料費 |
| `mat_name` / `mat_capacity` / `mat_maker` | `name_3` に連結 | 旧: name_1/2/3＝製品/容量/メーカーは1列ずれ |
| `mat_qty/unit_price/amount` | `quantity/unit_price/amount` | |
| `mat_basis` | `calc_basis` | |
| — | `stable_block_id` | ②/③ 用に新規 block UUID |
| — | `row_kind` | `detail` |
| — | `cost_category_key` | 施工 |

---

### 2.3 App3（758）— 実績

| 736 | App3 | 備考 |
|---|---|---|
| （該当なし） | — | 736 に月別消化・最終予算の永続フィールド無し |

**初回移行**: App3 レコードは **0 件**。予実は Ver.02 運用開始後に手入力または別途 CSV 取込フェーズで対応。

---

## 3. リスクと対策

| ID | リスク | 影響 | 対策 |
|---|---|---|---|
| R1 | 736 誤 WRITE | 現行本番破壊 | `FORBIDDEN_APP_IDS` + CLI/script 二重ガード。移行スクリプトは 736 GET のみ |
| R2 | `project_id` 系列の誤結合 | 版が別工事に混ざる | `project_code` 正規化 + 初版のみ `series_guard_key` 一意検索。パイロット 1 工事で系列全版を手動突合 |
| R3 | `stable_block_id` 不一致 | ①総括と②内訳が JOIN 不能 | link 行の `detail_marker` ↔ `subcontract_block` ↔ mat ブロックを移行マップ JSON に保存 |
| R4 | 税税率ラベル差（736 数値 vs App1 DD ％表記） | 保存 400 | 0/0.08/0.1 → 0％/8％/10％ 変換表を単体テスト |
| R5 | `detail_record_key` 64 字超過 | bulkRequest 400 | `compactUuidFactory` 使用（Phase C 実績済み） |
| R6 | 集計キャッシュ不一致 | 版確定拒否 | 移行後 `summary_projection_status` 検証。差分あれば dry-run レポートで止める |
| R7 | 給与手当行の所在 | salary_lines 空 | cost_lines の `cost_budget_category` 抽出ルールをパイロットで確定 |
| R8 | 大量一括移行 | API 制限・中途失敗 | 1 工事パイロット → 工事単位バッチ。checkpoint JSON で再開 |
| R9 | 736 読取のみ ACL | dry-run 失敗 | 移行実施前に読取権限確認（運用アカウント） |

---

## 4. フェーズ

### Phase A — 計画・scaffold（本ドキュメント + dry-run CLI） ✅

- フィールド対応表確定（本書）
- `scripts/jikkou-yosan-v2-migrate-from-736.mjs` dry-run: 件数・サンプル映射
- execute は GO ゲート後も **書込み abort**（scaffold）→ **2026-07-22 書込み実装済**

### Phase B — パイロット（1 工事）

1. 代表工事を選定（**LIVE 候補: `2623001-001`**＝736 に 2 版。旧メモ `2423101` はテナントに無し）
2. dry-run:
   ```bash
   npm run jikkou-yosan:v2-migrate-from-736 -- --project-code 2623001-001
   ```
3. サンプル映射を Excel / 736 画面と目視突合
4. `stable_block_id` 対応表（JSON）を 1 工事分作成
5. execute 書込み実装 GO（浜田承認）→ 実装済。実行は:
   ```bash
   set JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1
   npm run jikkou-yosan:v2-migrate-from-736 -- --execute --project-code 2623001-001
   ```
   - App1 POST + App2 `planAtomicBudgetSave` bulkRequest
   - `source_record_id`=736 `$id` で冪等スキップ
   - 735/736 不変
   - App3 は 0 件（初回）

### Phase C — パイロット execute + 検証

1. `JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1` + `--execute --project-code …`
2. App1 UI で総括/内訳表示・⑧⑨ 再計算一致確認
3. 版複製 smoke（移行版を複製して stable_block_id 継承）
4. 問題あれば 756/757 テストデータ削除（736 は触らない）

### Phase D — バッチ移行

1. 工事一覧を `projects[].versions` 降順で取得
2. 工事ごとに checkpoint 保存 → 成功した工事をスキップ可能に
3. 全工事 dry-run サマリー → 件数差分ゼロ確認
4. バッチ execute（夜間・API レート監視）
5. 736 は **読取専用アーカイブ**として残置（切替日を runbook に記録）

---

## 5. dry-run 手順

### 5.1 前提

- `.env` / `.env.proxy` に kintone 読取資格情報
- `scripts/data/jikkou-yosan-v2-app-ids.json` に 756/757/758 が `deployed`

### 5.2 全件インベントリ

```bash
npm run jikkou-yosan:v2-migrate-from-736
```

出力:

- `source.totalCount` — 736 レコード数
- `summary.projectCount` — 工事コード系列数
- `summary.subtableRowTotals` — サブテーブル行合計
- `summary.estimatedOutputs` — 移行先件数見積もり
- `samples[0]` — 先頭 1 件の映射プレビュー

### 5.3 1 工事パイロット

```bash
npm run jikkou-yosan:v2-migrate-from-736 -- --project-code 2423101 --sample-limit 3
```

### 5.4 execute（scaffold 現状）

```bash
# 現状は GO 確認後に書込み前 abort
JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1 npm run jikkou-yosan:v2-migrate-from-736 -- --execute
```

---

## 6. 実装ファイル

| ファイル | 役割 |
|---|---|
| `docs/plans/2026-07-22-jikkou-yosan-ver02-736-migration-plan.md` | 本計画 |
| `scripts/jikkou-yosan-v2-migrate-from-736.mjs` | CLI エントリ |
| `scripts/lib/jikkou-yosan-v2/migrate-from-736-model.mjs` | 純関数マッピング・集計 |
| `scripts/lib/jikkou-yosan-v2/kintone.mjs` | getKintoneConfig / assertAllowedAppId / loadState |
| `scripts/lib/jikkou-yosan-v2/keys.mjs` | project_id / businessKey 生成 |
| `scripts/lib/jikkou-yosan-v2/save-model.mjs` + `executor.mjs` | execute フェーズで再利用予定 |

---

## 7. 未決事項（パイロット前に浜田確認）

1. `project_code` 枝番の分割規則（`-` 区切り以外の案件があるか）
2. 給与手当行の 736 上の判別条件（`cost_budget_category` 以外の手がかり）
3. 移行対象工事の範囲（全件 vs アクティブ工事のみ）
4. 736 切替後も 736 を参照表示する期間の要否

**736 / 735 への書込みは実装 GO 後も永久禁止。**
