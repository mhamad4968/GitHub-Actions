# B-1 移行: 旧データ → 新・PC台帳（674）マッピング表（ドラフト v0）

**正本**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§7.4.7**。本表は **§7.4.7 の A〜E** と対応付ける。

**生成物**: `npm run pc-ledger:b1-import-csv` → `C:\tmp\new-pc-ledger\b1-import-674-draft-*.csv`（列順は **674 フォーム layout API** に追従）。

## 1. 種別・ステータス（G3 → A）

| 旧 (594) | 674 `account_type` | 674 `pc_status` |
|---|---|---|
| `type` そのまま（個人 / サーバーNAS / その他） | 同一文字列 | — |
| `status` = 使用中 | — | 利用中 |
| `status` = 保管 | — | 保管 |
| `status` = 廃棄 | — | （B-1 対象外・取込に出さない） |
| `status` が上記以外 | — | **利用中** にフォールバックし **ドライランに警告**（浜田確認） |

## 2. 本体・スペック（G2 → A）

| 旧 | 674 フィールド | 備考 |
|---|---|---|
| `PC_name` | `pc_name` | 業務キー（§7.4.7） |
| `sn` | `serial` | 指数表記は整数文字列に展開（取込 CSV ではタブ前置なし） |
| `manufacturer` | `manufacturer` | |
| `model_name` | `model_name` | 改行・全角スペース正規化 |
| `product_id` | `manufacturing_no` | |
| `ip1` | `fixed_ip_1` | |
| `ip2` | `fixed_ip_2` | |
| `dop` | `purchase_date` | DATE `YYYY-MM-DD` |
| `last_inventory_date` | `latest_inventory_date` | |
| `note` | `note` | 594 全文＋差分追記（下記 G5） |

## 3. 内部メタ（B + A）

| 内容 | 674 フィールド | 値 |
|---|---|---|
| 移行識別子 | `internal_system_meta.import_source` | `B1_IMPORT_SCRIPT_v0`（スクリプト内定数） |
| 旧 594 `$id` | `internal_system_meta.legacy_record_id_594` | 数値 |
| 旧 PC 名の控え | `internal_system_meta.legacy_pc_name_594` | 594 `PC_name` と同値で開始（§4.3.1） |
| 既存移行カウンタ | `internal_system_meta.pc_serial_no` | `0`（§4.2.1a） |
| 作成日時 JST | `internal_system_meta.created_at_jst` | 空（取込後に運用で可） |

## 4. 627 結合（G4 / G5）

| 条件 | 627 を 674 に載せる範囲 |
|---|---|
| `account_type`=個人 かつ `pc_status`≠保管 かつ 627 が `pc_594_record_id` で突合 | `logon_name`, `mail`, `mail_acct`, `m365_id`, `windows_name`, `user_name`, `dept_name`, `group_name` を **627 優先**（§7.4.7（3）） |
| 個人×**保管**（§4.1a） | **627 は無視**（アカウント列は空）。`user_name` 等は 594 のみ |
| サーバーNAS / その他 | 627 不使用。`user_name` / `dept_name` / `group_name` / `mail` は **594** |

### G5: 594 と 627 の `user_name` が異なる（627 結合行）

- 674 `user_name` は **627**。
- 674 `note` の **末尾**に1行追記: `[594:user_name] （594の値）`

## 5. G1（単独フィールドなし）→ C

| 旧 | 674 | 形式 |
|---|---|---|
| `location` | `extra_info_1` 先頭ブロック | `[594:location] 値` |
| `etc_1` | `extra_info_1` | `[594:etc_1] 値`（location と改行で連結可） |
| `etc_2` | `extra_info_1` | `[594:etc_2] 値` |
| `record_id`（文字管理番号） | `extra_info_2` | `[594:record_id] 値`（`legacy_record_id_594` の数値と重複させない） |

## 6. 取り込まない（674 に出さない）旧列

| 旧 | 理由 |
|---|---|
| `ledger_record_id` | 674 に同名フィールドなし（§7.4.7）。必要なら将来 `note` 等へ **浜田 GO** のうえ C で追記 |
| `abolished_flag` | 廃止済みは B-1 から除外済み |
| 627 の `$id` / `pc_594_record_id` | 674レコードのフィールドとしては持たない（突合メタ） |

## 7. SKYSEA（既定）

| 674 フィールド | ドラフト値 |
|---|---|
| `skysea_system_meta.skysea_status` | `未確認` |
| 他 SKYSEA 子 | 空 |

## 8. 変更手続き

- 本表の **C の接頭辞・捨てる項目・フォールバック**を変える → **浜田 GO** + **§13**（仕様 §7.4.7（6））。
