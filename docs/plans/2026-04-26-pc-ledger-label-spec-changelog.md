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

### 2026-04-27 — 表示名の言い換え + PC名/種別/ステータスは説明付き + `pc_serial_no` 注釈

| 種別 | 内容 |
|---|---|
| **表示** | `mail`→**メールアドレス**、`mail_pw`→**メールパスワード**、`skysea_status`→**SKYSEAインストール種別**（選択肢の並びは従来どおり）。`pc_name` / `account_type` / `pc_status` は §4.2 と同じ **説明付きラベル**に戻す |
| **仕様書** | `pc_serial_no` の「説明」列を短文化し、§4.2.1 直下に **v2.1 で追加した内部連番であること**と用途（§4.3.1）を追記 |

---

## 2. 全フィールド — 表示ラベルの対照（短文初版 → 現在）

| code | `ad9e842` 初版（短文） | 現在 `HEAD`（699043b） | 備考 |
|---|---|---|---|
| `pc_name` | PC名 | PC 名（個人=JBIS****-YYYYMM / 共有=S-JBIS****-YYYYMM / JR=手入力） | §4.2.1 原文 |
| `pc_serial_no` | PC連番 | PC 連番（種別別自動採番、新規発番分のみ） | 同上 |
| `serial` | PCシリアル番号 | シリアル番号 | 同上 |
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
| `legacy_pc_name_594` | 旧PC名（594） | 旧PC名（594） | 同上 |
| `legacy_record_id_594` | 旧レコードID（594） | 旧レコードID（594） | 同上 |
| `created_at_jst` | 作成日時（JST） | 作成日時（JST） | 同上 |

---

## 3. 運用メモ

- **674 の画面上のラベル**をリポと一致させる操作は、従来どおり **`npm run pc-ledger:apply-labels` を AI がターミナルで実行**する（**Tier B = 浜田 GO 後**に実行。GO は人、**コマンド実行は従来どおり AI**）。コミットだけでは kintone 側は自動では変わらない。
- **正本の §4.2.2 マトリクス**の「個人/共有/JR」列の文言が変わった場合は、`npm run pc-ledger:verify-labels-spec` が指紋不一致で落ちる → `node scripts/pc-ledger-verify-labels-vs-spec.mjs --update-4222-fingerprints` で JSON の指紋更新後、必要なら `ui_label` を見直す。

---

## 4. 関連コミット（git）

`ad9e842` → `0ac0c63` → `963c593` → `699043b`（時系列）。詳細は `git show <hash>`。
