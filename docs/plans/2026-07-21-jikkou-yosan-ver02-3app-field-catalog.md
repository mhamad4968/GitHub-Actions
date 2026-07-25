# 実行予算支援ツール Ver.02 — 3アプリ物理フィールドカタログ

**作成**: 2026-07-21（実装前成果物）
**状態**: FINAL DESIGN — AIチーム再監査PASS／実装GO待ち。コード・JSON・kintone設定は未作成／未変更
**上位設計**: [`2026-07-21-jikkou-yosan-ver02-3app-schema-design.md`](2026-07-21-jikkou-yosan-ver02-3app-schema-design.md)
**正本仕様**: [`2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md`](2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md)

## 0. キーの責務分離

| コード | 意味 | 不変性 | 用途 |
|---|---|---|---|
| `project_id` | 1工事系列の内部UUID | **不変**。初版で発行し全版・②③へ継承 | 3アプリ間JOINの正 |
| `project_business_key` | 正規化した工事コード＋枝番 | 業務値訂正時は変更可 | P-29の重複検出・検索 |
| `budget_version_id` | 1予算版の内部UUID | **不変**。版ごとに新規発行 | ①↔②所属版JOIN |
| `series_guard_key` | 初版=`project|業務キー`、次版=`version|版ID` | ①で一意 | 同一業務キーの初版同時作成をDB制約で止める |
| `version_record_key` | `project_id + version_seq` | 不変・①で一意 | 同一系列の次版同時作成をDB制約で止める |
| `stable_block_id` | 工種ブロックの内部UUID | 版複製時に継承 | 総括↔内訳↔予実の工種JOIN |
| `row_key` | 内訳1行の内部UUID | 版複製時に継承 | 行単位の版差分 |
| `detail_record_key` | `budget_version_id + row_key` | ②で一意 | 同一版内の行重複防止 |
| `actual_record_key` | ③の業務粒度を表す合成キー | ③で一意 | 月別消化・最終予算の二重登録防止 |

`project_business_key`をJOINの正にしない。工事コード・枝番の誤入力訂正で②③が孤立する事故を防ぐため、JOINには不変`project_id`を使う。
正規化案: 工事コードと枝番を前後空白除去し、`<工事コード>|<枝番または空>`。表示用ではなく内部値。

## 1. アプリ①「実行予算書作成支援ツールver02」

### 1.1 親・版・監査フィールド

| コード | ラベル | kintone型 | 必須/一意 | 値・選択肢 |
|---|---|---|---|---|
| `project_id` | 工事ID | 文字列(1行) | 必須／一意なし | `prj-UUID`。全版で同値 |
| `project_business_key` | 工事業務キー | 文字列(1行) | 必須／一意なし | 工事コード＋枝番の正規化値 |
| `budget_version_id` | 予算版ID | 文字列(1行) | 必須／**一意** | `bv-UUID` |
| `series_guard_key` | 系列一意ガード | 文字列(1行) | 必須／**一意** | 初版`project|project_business_key`、次版`version|budget_version_id` |
| `version_record_key` | 工事版キー | 文字列(1行) | 必須／**一意** | `project_id|version_seq` |
| `version_seq` | 版連番 | 数値 | 必須 | 初版1、次版+1 |
| `source_record_id` | 複製元レコードID | 数値 | 任意 | 736流用。直前版比較用 |
| `version_type` | 版種別 | ドロップダウン | 必須 | 当初／仕様変更／価格変更／仕様・価格変更／その他 |
| `status` | ステータス | ドロップダウン | 必須 | 下書き／版確定 |
| `is_locked` | 版ロック表示 | チェックボックス | 任意 | 736互換の派生キャッシュ。保存判定に使わない（P-38） |
| `derived_lock_state` | 導出ロック状態 | ドロップダウン | 必須 | editable／budget_locked／full_locked。表示キャッシュ |
| `revision_note` | 修正理由メモ | 文字列(複数行) | 任意 | 736同様 |
| `actual_write_seq` | 予実保存CAS連番 | 数値 | 必須 | 初期0。③保存時にrevision付きで+1 |
| `Created_by`等 | 作成者・作成日時・更新者・更新日時 | kintone標準 | 自動 | 専用確定者フィールドは作らない |

`project_business_key`は版が複数あるため単独では一意にできない。初版の二重作成は、既存系列検索＋初版だけ同じ値になる`series_guard_key`の一意制約で防ぐ。次版の同時作成は不変`project_id|version_seq`の`version_record_key`で防ぐ。工事コード＋枝番を訂正しても版キーは変更せず、初版`series_guard_key`と検索表示用`project_business_key`だけを原子更新する。

### 1.2 工事基本情報

| コード | ラベル | 型 | 必須/既定 |
|---|---|---|---|
| `project_code` | 工事コード | 文字列(1行) | **必須** |
| `project_branch` | 工事コード枝番 | 文字列(1行) | 任意 |
| `client_name` | 発注者 | 文字列(1行) | 任意 |
| `project_official_name` | 工事正式名称 | 文字列(1行) | 任意 |
| `project_name` | 工事名称 | 文字列(1行) | 任意 |
| `start_date` / `end_date` | 着手日／竣工日 | 日付 | 任意 |
| `project_days` | 工期日数 | 数値 | 自動・編集不可 |
| `site_entry_date` / `draft_date` | 現場入場予定日／立案日 | 日付 | 任意 |
| `girder_type` / `order_branch` / `department` | 桁種別／発注支社／部門 | 文字列(1行) | 736踏襲 |
| `safety_rule_88` | 安衛則88条 | ラジオ | **必須**・既定「有」 |
| `person_in_charge` | 担当者（ユーザー） | ユーザー選択 | 任意・監査／互換。UI手入力は `person_in_charge_name` |
| `created_by_name` | 作成者 | 文字列(1行) | 任意・**手入力**（736同趣旨・C13） |
| `person_in_charge_name` | 担当者 | 文字列(1行) | 任意・**手入力**（736同趣旨・C13） |
| `note` | 備考 | 文字列(複数行) | 任意 |

### 1.3 請負明細サブテーブル `contract_lines`

| コード | ラベル | 型 | 備考 |
|---|---|---|---|
| `contract_row_key` | 行キー | 文字列(1行) | 内部UUID |
| `contract_section` | 区分 | ドロップダウン | 施工／保安 |
| `contract_work_name` | 契約工種 | 文字列(1行) | 当面手入力 |
| `contract_unit` | 単位 | ドロップダウン | 共通単位 |
| `contract_qty` / `contract_unit_price` | 数量／単価 | 数値 | 数量は小数可 |
| `contract_amount` | 金額（税抜・内部値） | 数値 | 十進演算で自動・ROUNDなし。UIのみ整数表示 |
| `contract_rate_to_1` | 対①率 | 数値 | 比率保存、UIは0.0% |
| `contract_note` | 備考 | 文字列(1行) | 任意 |
| `contract_sort_order` | 表示順 | 数値 | 内部 |

### 1.4 給与手当サブテーブル `salary_lines`

| コード | ラベル | 型 | 備考 |
|---|---|---|---|
| `salary_row_key` | 行キー | 文字列(1行) | 内部UUID |
| `salary_role` | 役職／名称 | 文字列(1行) | 初期5行候補 |
| `salary_unit` | 単位 | ドロップダウン | 初期「箇月」 |
| `salary_qty` / `salary_unit_price` | 数量／単価 | 数値 | — |
| `salary_amount` | 金額（税抜・内部値） | 数値 | 十進演算で自動・ROUNDなし。UIのみ整数表示 |
| `salary_rate_to_1` | 対①率 | 数値 | 比率保存、UIは0.0% |
| `salary_note` | 備考 | 文字列(1行) | 任意 |
| `salary_sort_order` | 表示順 | 数値 | 内部 |

### 1.5 総括原価投影サブテーブル `summary_cost_lines`

| コード | ラベル | 型 | 備考 |
|---|---|---|---|
| `summary_stable_block_id` | 安定ブロックID | 文字列(1行) | ②とのJOIN |
| `summary_block_no` | 内訳№ | 数値 | 表示順から自動 |
| `summary_cost_category` | 費用区分 | ドロップダウン | 施工／保安 |
| `summary_work_type_code` / `summary_work_type_name` | 工種番号／名称 | 文字列 | コード表候補 |
| `summary_line_type` | 種別 | 文字列(1行) | 総括限定・手入力 |
| `summary_unit` / `summary_qty` / `summary_unit_price` | 単位／数量／単価 | 各型 | 単位混在時は式／1／ブロック計 |
| `summary_amount_excl_tax` | 金額（税抜） | 数値 | ②の「計」から投影する再生成可能キャッシュ・編集不可 |
| `summary_tax_rate` | 消費税率 | ドロップダウン | 0%／8%／10% |
| `summary_amount_incl_tax` | 金額（税込） | 数値 | JS自動 |
| `summary_rate_to_1` | 対①率 | 数値 | 比率保存、UIは0.0% |
| `summary_calc_basis` / `summary_note` | 計算基準／備考 | 文字列 | 総括限定 |
| `summary_sort_order` | 表示順 | 数値 | 内部 |

### 1.6 集計・UIフィールド

`contract_construction_total`、`contract_safety_total`、`contract_total_1`、`cost_construction_total`、`cost_safety_total`、`salary_total`、`cost_total_8`、`profit_9`、各対①率（数値、JS自動・編集不可）、`summary_projection_status`（DD: `synced`／`dirty`／`error`）、`summary_projection_checked_at`（日時）、`ui_col_layout_json`（複数行文字列）。

P-33/P-39により、`summary_amount_excl_tax`および原価集計欄は正本ではなく表示キャッシュ。⑧⑨は②の`active`ブロック`block_total`と①給与から再計算し、`retired`は現行予算0として除外する。版確定時に全`stable_block_id`を照合し、差があれば確定を拒否して②から再投影する。①から②への金額逆同期は禁止。

P-36により、請負・給与の行金額とその合計は丸め前の十進値を保持し、カスタムUIだけ0桁表示にする。`contract_total_1`等も表示整数行の合計ではなく内部値の合計。内訳`amount`はP-22で行単位ROUND済み整数。

## 2. アプリ②「実行予算ver02_内訳明細」

| コード | ラベル | 型 | 必須/一意 | 備考 |
|---|---|---|---|---|
| `detail_record_key` | 内訳行レコードキー | 文字列(1行) | 必須／**一意** | `budget_version_id|row_key` |
| `project_id` | 工事ID | 文字列(1行) | 必須 | 3アプリJOIN |
| `project_business_key` | 工事業務キー | 文字列(1行) | 必須 | 検索表示用 |
| `budget_version_id` | 所属予算版ID | 文字列(1行) | 必須 | ①所属版JOIN |
| `stable_block_id` | 安定ブロックID | 文字列(1行) | 必須 | 版間継承 |
| `row_key` | 行キー | 文字列(1行) | 必須 | 版間継承 |
| `row_kind` | 行種別 | ドロップダウン | 必須 | block_header／detail／overhead／insurance／subtotal／legal_welfare／block_total |
| `block_no` | 内訳№ | 数値 | 必須 | 並替後に詰め直し |
| `block_sort_order` / `row_sort_order` | ブロック順／行順 | 数値 | 必須 | — |
| `block_status` | ブロック状態 | ドロップダウン | 必須 | active／retired（P-39） |
| `retired_at_version_id` | 廃止時予算版ID | 文字列(1行) | 任意 | 実績ありブロックの論理廃止監査 |
| `cost_category_key` | 費用区分 | ドロップダウン | 任意 | 施工／保安（見出し値を同ブロックへ複写） |
| `work_type_code` / `work_type_name` | 工種番号／名称 | 文字列 | 任意 | — |
| `vendor_name` | 取引先 | 文字列(1行) | 任意 | 候補＋手入力 |
| `name_1` / `name_2` / `name_3` | 名称・規格1〜3 | 文字列(1行) | 任意 | 3列フラット |
| `name_spec_group` | 名称規格グループ | 文字列(1行) | 任意 | 内部継承 |
| `unit` | 単位 | ドロップダウン | 任意 | 共通＋缶／枚／％ |
| `quantity` / `unit_price` | 数量／単価 | 数値 | 任意 | 両方ありで計算 |
| `amount` | 金額（税抜） | 数値 | 任意 | 明細ROUND、フッタ手入力、小計/計は自動 |
| `note` | 備考 | 文字列(1行) | 任意 | — |
| `calc_basis` | 計算基準 | 文字列(1行) | 任意 | — |
| `parent_lock_snapshot` | 親ロック派生状態 | ドロップダウン | 必須 | editable／locked。P-35レコード権限用。正は① |
| `write_channel` | 書込経路 | ドロップダウン | 必須 | 初回app1_custom_ui。監査用 |

`row_kind`ごとに使わないフィールドは空。レコード種別を分けた複数アプリにはせず、ブロック全体を`stable_block_id`で束ねる。

## 3. アプリ③「実行予算ver02_実績」

| コード | ラベル | 型 | 必須/一意 | 備考 |
|---|---|---|---|---|
| `actual_record_key` | 予実レコードキー | 文字列(1行) | 必須／**一意** | 月別=`project_id|block_id|category|monthly|YYYY-MM`、最終=`project_id|block_id|category|final` |
| `project_id` | 工事ID | 文字列(1行) | 必須 | 帰属・JOINの正 |
| `project_business_key` | 工事業務キー | 文字列(1行) | 必須 | 検索表示用 |
| `record_kind` | レコード種別 | ドロップダウン | 必須 | monthly_consumption／final_budget |
| `stable_block_id` | 工種キー | 文字列(1行) | 必須 | ①②と対応 |
| `cost_category_key` | 費用区分キー | ドロップダウン | 必須 | 施工／保安 |
| `target_month` | 対象月 | 日付 | 月別のみ必須 | 月初日で保存し年月として表示 |
| `amount` | 金額（税抜） | 数値 | 必須 | 月別消化または最終予算額 |
| `note` | 内容 | 文字列(複数行) | 任意 | 摘要 |
| `source_kind` | 取込元種別 | ドロップダウン | 必須 | 初回は手入力 |
| `registered_version_id` | 登録時予算版ID | 文字列(1行) | 月別で必須 | 監査専用。表示・ロック判定に使わない |
| `last_changed_version_id` | 最終変更時予算版ID | 文字列(1行) | 最終予算で必須 | 最終予算を最後に変更した現行版 |
| `write_channel` | 書込経路 | ドロップダウン | 必須 | 初回app1_custom_ui。監査用 |

### 3.1 実績日と月次粒度

P-30は月別消化を「1原価行×1月=1レコード」と確定した。したがって§9.4の「実績日」は初回試作では`target_month`（対象月）として扱い、日別伝票は保持しない。将来、日別取込が必要になった場合は別の取込明細層を追加する。これは依頼者検証対象として試験計画に明記する。

### 3.2 予実で保存しない値

現行予算、実績合計、残予算、消化率、今後必要額、対①率は保存しない。①②③から表示時に計算し、二重更新を防ぐ。

## 4. 必須制約・競合対策

1. ①`budget_version_id`・`series_guard_key`・`version_record_key`、②`detail_record_key`、③`actual_record_key`は各アプリで一意。
2. 新規版・次版・月別消化保存時は、画面表示時ではなく保存直前に既存キーを再検索。
3. 一意制約エラー時は再読込し、「他の利用者が先に保存しました」と説明して既存レコードへ誘導。
4. ②③保存時は①の現行版・ロック状態を再取得し、古い画面からの保存を拒否。
5. 内訳金額は整数円。請負・給与はP-36によりROUNDなし十進値を保存し、表示のみ整数。
6. ②③の直接編集画面は保存拒否。②旧版は`parent_lock_snapshot=locked`を条件にレコード権限でも更新不可。
7. P-35の初回方式は通常利用者の誤操作防止を対象とし、意図的なREST直実行の完全遮断は本番移行前ゲートとする。
8. 既存レコード更新・削除は全件`revision`必須。不一致時は自動上書きせず全体を中止。
9. 通常予算保存は①②を1回の`bulkRequest`で原子処理。③保存は①`actual_write_seq`のrevision付き更新と③書込みを同一`bulkRequest`にする（P-44）。

## 5. ACL最低条件

| 条件 | 一般利用者 | 実行予算管理者 |
|---|---|---|
| ②`parent_lock_snapshot=editable` | 正規①UI経由の追加・更新・削除可。②直接画面保存は拒否 | 修復可 |
| ②`parent_lock_snapshot=locked` | 閲覧のみ。更新・削除不可 | 監査記録付き修復のみ |
| ③ | 正規①UI経由の追加・更新可。③直接画面保存は拒否 | 障害調査・修復可 |

一般利用者へ`実行予算管理者`グループを付与しない。

## 6. 実装判断前の未作成物

本カタログは設計成果物であり、次はまだ作らない。

- kintone API投入用フィールドJSON
- アプリ作成・設定スクリプト
- JavaScriptカスタマイズ
- kintoneアプリ／レコード／ビュー／ACL
