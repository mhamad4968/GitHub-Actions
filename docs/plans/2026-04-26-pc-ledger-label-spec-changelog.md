# 新・PC台帳 ver.1 — 表示ラベル・正本突合の変更履歴（2026-04-26）

> **最新の正**: リポジトリの `HEAD`（**画面用短文** `scripts/data/pc-ledger-v1-ui-display-labels.json` → `pc-ledger-v1-labels.mjs` + `pc-ledger-spec-4222-ui-labels.json` + `pc-ledger-spec-field-extensions.json`）を `npm run pc-ledger:verify-labels-spec` で検証した状態。**意味の正本**は `2026-04-21-new-pc-ledger-spec.md` §4.2。  
> **役割の正本（変更禁止）**: **開発は AI・確認は浜田**（`AGENTS.md` **§35-1** / **§56-1a**）。  
> **仕様の正本**（フィールド定義・説明文）: `docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.2。付録の **§C アカウント生成ロジック**（同ファイル後半の Q&A 表）は §4.2.2 と同趣旨の要約。**表示名**で §4.2.2 に語が無い行は JSON の `ui_label` が正（マトリクス指紋で正本変更を検知）。

---

## 1. コミットごと — 何が「追加」か「変わった」か

### `ad9e842` — 初回: kintone 674 向け日本語ラベル（短文）

| 種別 | 内容 |
|---|---|
| **追加** | `scripts/pc-ledger-v1-labels.mjs`（短文マップ）／`scripts/kintone-pc-ledger-apply-labels.mjs`／`npm run pc-ledger:apply-labels`（`package.json`）／`field-spec-diff.mjs` の generate が当マップ参照、等 |
| **変更** | アプリ 674 のフォーム上の **表示ラベル**（kintone へ API 反映）。文言は Day4 手順書寄りの **短い日本語** で、**正本 §4.2 の「説明」列とは文字一致しない**意図だった |

### `0ac0c63` — 正本 §4.2 と機械突合ゲート

| 種別 | 内容 |
|---|---|
| **追加** | `scripts/pc-ledger-spec-42-parser.mjs`（§4.2.1 / 4.2.2 / 4.2.3 / 4.2.4 を MD からパース）／`scripts/pc-ledger-verify-labels-vs-spec.mjs`／`scripts/data/pc-ledger-spec-4222-ui-labels.json`（§4.2.2 用 UI 短文 + マトリクス指紋）／`scripts/data/pc-ledger-spec-field-extensions.json`（正本 §4.2 表に無い hidden 4 件）／`npm run pc-ledger:verify-labels-spec` |
| **変更** | `scripts/pc-ledger-v1-labels.mjs` の **多数の値**を、§4.2.1・4.2.3・4.2.4 の **説明・内容列の原文**に合わせて置換。§4.2.2 は JSON の `ui_label` と同期。`docs/plans/2026-04-26-pc-ledger-day4-action.md` §7 に検証コマンド 1 行追記 |

### `963c593` — セッション切替後も迷わないよう文書に固定

| 種別 | 内容 |
|---|---|
| **追加** | `chat-sessions/checkpoint-latest.md` の **「正本主義（PC 台帳 ver.1 フィールド・表示ラベル）」**節／自律復元 Read 順への **§4.2 + verify** の明記／`RULES-INDEX.md` の「セッション切替・文脈復元」表に **2 行**／`chat-sessions/NEW-SESSION-STARTER.md` **v3.13**／`.cursor/rules/session-handoff.mdc` 手順 6 への **ラベル検証**一文 |
| **変更** | `checkpoint-latest.md` の **最終更新** 1 行を、上記方針に合わせて書き換え（旧 Day4 の revision 記述は履歴ブロック側に残り得る旨を注記） |

### `699043b` — 付録 §C の用語に合わせる（gb / sb の表示名のみ）

| 種別 | 内容 |
|---|---|
| **追加** | なし |
| **変更** | `gb_id` / `gb_pw` / `sb_id` / `sb_pw` の **表示ラベル**のみ: 「Google（Business）」「SmartHR」→ **「サイボウズ」「ガリバー」**（`pc-ledger-v1-labels.mjs` と `pc-ledger-spec-4222-ui-labels.json` の `ui_label` / `spec_anchor`）。**生成ロジック（=mail_acct / =logon_name）は元から §4.2.2 と一致しており未変更** |

### 2026-04-26 夕 — kintone 674 実機の再整合（Step1〜3 後のラベル抜け）

| 種別 | 内容 |
|---|---|
| **事実** | 旧スナップショット上、**22 フィールド**の `label` が `PC_LEDGER_V1_LABELS` と不一致（短文のまま） |
| **実施** | **`npm run pc-ledger:apply-labels`**（PUT + deploy SUCCESS、revision 4→5）後、`674-labels-spec-realign-*.json` で **全 35 ラベル一致**を確認 |
| **リポ** | `field-spec-diff.mjs` の `--diff` が **`revision-snapshot` の `form_fields_live` 形式**を読めるよう拡張（Step4 機械検証の取り回し改善） |

### 2026-04-26 夜 — 表示ラベルを「短文」に戻す（仕様全文をラベルに載せない）

| 種別 | 内容 |
|---|---|
| **背景** | §4.2 の説明文をそのまま kintone の `label` に載せたため、**画面上に仕様書のような長文**が出て運用しづらい |
| **方針** | **画面** = `scripts/data/pc-ledger-v1-ui-display-labels.json`（短文のみ）。**意味・ルールの正本** = `2026-04-21-new-pc-ledger-spec.md` §4.2（変更なし） |
| **実装** | `pc-ledger-v1-labels.mjs` は JSON を読み込み export のみ。検証は `pc-ledger-verify-labels-vs-spec.mjs` を「短文 + マトリクス指紋」方式に変更 |
| **kintone** | **`npm run pc-ledger:apply-labels`** で 674 を短文に更新（スナップショット `674-labels-short-ui-*.json`） |

### 2026-04-26 — 表示名を「決定済みのフィールド名」に戻す

| 種別 | 内容 |
|---|---|
| **背景** | 短文化の際に `mailの@前` 等の **説明寄りの文言**が混ざり、浜田が既に決めていた **PC名 / メールアカウント** 等と不一致 |
| **正本** | `pc-ledger-v1-ui-display-labels.json` を **ad9e842 初版（短文）列**に揃える（例: `mail_acct`→**メールアカウント**、`account_type`→**アカウント種別**、`mail`→**メール（595）**）。`logon_name` は仕様上 **WindowsID** のまま。`pc-ledger-spec-4222-ui-labels.json` の `ui_label` も同一文字列に同期 |

### 2026-04-28（追記）— 内部メタは標準 GROUP「内部処理用」+ レイアウトスクリプト

| 種別 | 内容 |
|---|---|
| **正本** | §4.2.1 に `internal_system_meta`（`GROUP`）を追加。§4.2.1a を **非表示方針からグループ収容 + 初期閉 + 子 disabled** に変更 |
| **表示** | `internal_system_meta` の短文ラベル **内部処理用** |
| **npm** | `pc-ledger:674:layout-internal-group`（プレビュー layout PUT + deploy）／断片 JSON `pc-ledger-674-add-internal-group-properties.json` |
| **customize** | `setGroupFieldOpen(..., false)` + 子 5 件 `disabled`（`BUILD=2026-04-28-internal-group-ui-v0.2`） |

### 2026-04-28（追記）— SKYSEA 4 件を標準 GROUP「SKYSEA処理用」

| 種別 | 内容 |
|---|---|
| **正本** | §4.2.3a 新設。`skysea_system_meta`（`GROUP`）で `skysea_*` 4 件を収容 |
| **表示** | `skysea_system_meta` の短文ラベル **SKYSEA処理用**（`pc-ledger-v1-ui-display-labels.json`／拡張 JSON に code 追加） |
| **npm** | `pc-ledger:674:add-skysea-group-preview` → `pc-ledger:674:layout-skysea-group` |

### 2026-04-28（追記2）— SKYSEA ブロックは周知ベース（全員表示・編集可）

| 種別 | 内容 |
|---|---|
| **方針** | アカウント部寄りの項目のため **権限のあるユーザーは編集可能**とし、**運用で触るのは浜田のみ**は **周知**で担保（customize のログイン非表示を撤廃） |
| **正本** | §4.2.3a の UI 方針を上記に合わせて更新 |
| **customize** | `BUILD=2026-04-28-skysea-group-ui-v0.2` — 全員 `setFieldShown` 表示、初期閉、新規・編集で子は編集可 |

### 2026-04-28 — 594 相当 HW 属性 7 項目 + `pc_serial_no` / `serial` ラベル明確化

| 種別 | 内容 |
|---|---|
| **正本** | §4.2.1 に `manufacturer` / `model_name` / `manufacturing_no` / `fixed_ip_1` / `fixed_ip_2` / `extra_info_1` / `extra_info_2` を追加（旧 594 のメーカー・型式・製造番号・シリアル・固定 IP×2・その他×2）。合計 **42 フィールド**（Day4 手順書 §2 を同期） |
| **表示** | 上記 7 コードの短文ラベルを `pc-ledger-v1-ui-display-labels.json` に追加。`pc_serial_no`→**PC連番（PC名4桁用）**、`serial`→**シリアルナンバー**（594 のシリアル列と同趣旨） |
| **kintone** | 既存 674 フォームへの **フィールド API 追加は未実施**（浜田 Tier B GO 後に `add-form-fields` → deploy → `apply-labels`） |

### 2026-04-27 — 表示名の言い換え + PC名/種別/ステータスは説明付き + `pc_serial_no` 注釈

| 種別 | 内容 |
|---|---|
| **表示** | `mail`→**メールアドレス**、`mail_pw`→**メールパスワード**、`skysea_status`→**SKYSEAインストール種別**（選択肢の並びは従来どおり）。`pc_name` / `account_type` / `pc_status` は §4.2 と同じ **説明付きラベル**に戻す |
| **仕様書** | `pc_serial_no` の「説明」列を短文化し、§4.2.1 直下に **v2.1 で追加した内部連番であること**と用途（§4.3.1）を追記 |

### 2026-04-27 — §4.2.0 浜田認識（コア * vs SKYSEA 別枠）

| 種別 | 内容 |
|---|---|
| **追加** | `2026-04-21-new-pc-ledger-spec.md` に **§4.2.0**（* コア＝PC 名〜VPN の採番・ID 連動、**SKYSEA 4 フィールドは SKYSEA 計画の管理用で別枠**、595・運用メタの位置づけ）と **`code` 対応表** |

### 2026-04-27 夜 — §4.5 共有/JR の mail 系 UI

| 種別 | 内容 |
|---|---|
| **追加** | §4.5 直前に箇条書き: 共有・JR では `mail`/`mail_acct` 等は **フィールドは kintone に存在**しつつ **アカウント情報セクションでは非表示**（§4.2.2「不要」＝入力不要・表示も出さない） |

### 2026-04-27 夜 — メールは個人のみ・共有/JR は Windows+M365（浜田）

| 種別 | 内容 |
|---|---|
| **変更** | §4.2.0（595 箇条書き）・§4.2.2（冒頭方針 + `windows_name` 共有列を `=logon_name`）・§4.5 箇条書き・付録 §C の **Windows アカウント名**行を、**メールは個人用 PC のみ／JR は共有 PC 扱いで Windows+M365 のみ**に整合 |
| **検証** | `windows_name` の §4.2.2 マトリクス指紋を `pc-ledger-spec-4222-ui-labels.json` で更新 |

### 2026-04-26 夜 — 正本の誤記修正（L2・5/13・採番テスト）

| 種別 | 内容 |
|---|---|
| **変更** | `2026-04-21-new-pc-ledger-spec.md` §10.1 マスタ枯渇チェックを **L2（自動次連番なし・中断）**に合わせる／§11.H 書込ロックを **5/13** に統一／§10.1 採番テストを **新個人・新共有採番マスタ**表記に |

### 2026-04-26 夜 — 共有 vs JR の自動化範囲（浜田確定）

| 種別 | 内容 |
|---|---|
| **追加** | §4.1 直下: **共有＝Windows+M365 両方採番**／**JR＝M365 のみ自動・Windows 系はすべて手入力**・サイボウズ・ガリバーなし。§4.2.0 の「共有 PC 扱い」をメール/gb/sb の話に限定し、§4.4「共有用 自動生成」の表示条件に **JR**、§5.3 手順 1 に同趣旨 |

### 2026-04-26 夜 — 正本深読突合（内部整合）

| 種別 | 内容 |
|---|---|
| **変更** | §4.2.2 浜田方針を §4.1 と矛盾しない文言に／`logon_name` 行・§4.2.0 コア表を **新採番マスタ（§2）**表記に（626/667 は5/13以降閲覧のみ）／§11.I・§11.C の採番の「正」を v2.1 に合わせる／§5.2 の `jbs` 誤記を **sjm** 系に／§10.2 見出しを **5/7-5/12** に §9 へ整合 |
| **検証** | `logon_name` の §4.2.2 マトリクス指紋を `pc-ledger-spec-4222-ui-labels.json` で更新 |

---

## 2. 全フィールド — 表示ラベルの対照（短文初版 → 現在）

| code | `ad9e842` 初版（短文） | 現在 `HEAD`（短文 JSON） | 備考 |
|---|---|---|---|
| `pc_name` | PC名 | PC 名（個人=JBIS****-YYYYMM / 共有=S-JBIS****-YYYYMM / JR=手入力） | §4.2.1 原文 |
| `pc_serial_no` | PC連番 | PC連番（PC名4桁用） | 2026-04-28 用途明確化 |
| `serial` | PCシリアル番号 | シリアルナンバー | 2026-04-28 594 表記に寄せる |
| `manufacturer` | （なし） | メーカー | 2026-04-28 新規 |
| `model_name` | （なし） | モデル名／型式 | 2026-04-28 新規 |
| `manufacturing_no` | （なし） | 製造番号 | 2026-04-28 新規 |
| `fixed_ip_1` | （なし） | 固定IPアドレス1 | 2026-04-28 新規 |
| `fixed_ip_2` | （なし） | 固定IPアドレス2 | 2026-04-28 新規 |
| `extra_info_1` | （なし） | その他情報1 | 2026-04-28 新規 |
| `extra_info_2` | （なし） | その他情報2 | 2026-04-28 新規 |
| `internal_system_meta` | （なし） | 内部処理用 | 2026-04-28 GROUP |
| `skysea_system_meta` | （なし） | SKYSEA処理用 | 2026-04-28 GROUP §4.2.3a |
| `account_type` | アカウント種別 | 種別 (個人 / 共有 / JR端末 / サーバーNAS / その他) | 同上 |
| `pc_status` | PCステータス | ステータス (利用中 / 保管 / 廃棄) | 同上 |
| `user_name` | 利用者名 | 利用者名（595 ルックアップ） | 同上 |
| `dept_name` | 所属名 | 所属名（595 から自動引用） | 同上 |
| `group_name` | 所属グループ | 所属グループ（595 から自動引用） | 同上 |
| `shared_terminal_name` | 共有端末名 | 共有端末名（共有/JR で必須・手入力） | 同上 |
| `purchase_date` | 購入日 | 購入日 | 変更なし |
| `latest_inventory_date` | 最新棚卸日 | 最新棚卸日 | 変更なし |
| `note` | 備考 | 備考 | 変更なし |
| `logon_name` | ログオン名 | WindowsID | §4.2.2 マトリクス + §4.3.2 用語（JSON 管理） |
| `logon_pw` | ログオン初期PW | ログオン初期PW | JSON（§C では「WindowsPW」表記） |
| `windows_name` | Windows名 | Windows名 | 変更なし |
| `mail` | メール | メール（595 から） | JSON |
| `mail_acct` | メールアカウント | mailの@前 | JSON（§4.2.2 個人列の表現に合わせた短文） |
| `mail_pw` | メールPW | メール初期PW | JSON |
| `m365_id` | M365 ID | M365 ID | 変更なし |
| `m365_pw` | M365 PW | M365 PW | 変更なし |
| `gb_id` | Google（Business）ID | **サイボウズ ID** | `699043b` で §C に整合 |
| `gb_pw` | Google（Business）PW | **サイボウズ PW** | 同上 |
| `sb_id` | SmartHR ID | **ガリバー ID** | 同上 |
| `sb_pw` | SmartHR PW | **ガリバー PW** | 同上 |
| `vpn_id` | VPN ID | VPN ID | 変更なし |
| `vpn_pw` | VPN PW | VPN PW | 変更なし |
| `skysea_status` | SKYSEA状態 | 未確認 / インストール済 / 未インストール / インストール対象外 | §4.2.3「内容」原文 |
| `skysea_checked_at` | SKYSEA確認日時 | SKYSEA 最終確認日時 | 同上 |
| `skysea_install_log` | SKYSEAインストール履歴 | SKYSEA インストール履歴 | 同上 |
| `skysea_target_flag` | SKYSEA配信対象 | 配信対象フラグ | 同上 |
| `m365_master_record_id` | M365管理マスタ レコード番号 | 紐付き M365管理マスタ レコード番号（共有/JR のみ） | §4.2.4 原文 |
| `import_source` | 取込元 | 取込元 | 変更なし（拡張 JSON 管理） |
| `created_at_jst` | 作成日時（JST） | 作成日時（JST） | 同上 |

---

## 3. 運用メモ

- **674 の画面上のラベル**をリポと一致させる操作は、従来どおり **`npm run pc-ledger:apply-labels` を AI がターミナルで実行**する（**Tier B = 浜田 GO 後**に実行。GO は人、**コマンド実行は従来どおり AI**）。コミットだけでは kintone 側は自動では変わらない。
- **正本の §4.2.2 マトリクス**の「個人/共有/JR」列の文言が変わった場合は、`npm run pc-ledger:verify-labels-spec` が指紋不一致で落ちる → `node scripts/pc-ledger-verify-labels-vs-spec.mjs --update-4222-fingerprints` で JSON の指紋更新後、必要なら `ui_label` を見直す。

---

## 4. 関連コミット（git）

`ad9e842` → `0ac0c63` → `963c593` → `699043b`（時系列）。詳細は `git show <hash>`。
