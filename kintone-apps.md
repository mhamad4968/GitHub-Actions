# kintone アプリ構成メモ（Cursor / AI 用）

このファイルは **kintone 用 JavaScript や設定を書く前に必ず読む** こと。フィールドコードの取り違えを防ぐ。

## AI・開発者への指示

- 新規アプリやフィールド変更があったら **このファイルを更新**する（アプリ名・アプリID・フィールド一覧）。
- 生成したアップロード前の JS などは、可能なら **`Documents/kintone-src`**（WSL: `/mnt/c/Users/mhamada202408224/Documents/kintone-src`）に置く。既存のデプロイ済みソースは `kintone-ai-lab/customize/<アプリIDまたは別名>/` を参照。
- フィールド一覧を最新化するときは、リポジトリ直下で次を実行し、出力を貼るか表に反映する。

```bash
cd /home/mhamada202408224/kintone-ai-lab
npm run app:fields <アプリID>
```

## アプリ一覧

| アプリ名（論理名） | アプリID | customize パス | デプロイ例（npm） |
|-------------------|---------|----------------|------------------|
| PC台帳 | 594 | `customize/594/desktop.js` | `npm run deploy:594` |
| 社員マスタ（台帳・627 連携用） | 595 | `customize/595/desktop.js` | `npm run deploy:595` |
| アカウント採番（プール） | 626 | `customize/626/desktop.js` | `npm run deploy:626` |
| アカウント管理台帳 | 627 | `customize/627/desktop.js` | `npm run deploy:627` |
| 出張精算アプリ | **629** | `customize/shucccho-seisan/desktop.js` | `npm run deploy:629` |
| Security NEXT ニュース（収集） | **631** | `security-next-automation` | [https://jbis-kintone.cybozu.com/k/631/](https://jbis-kintone.cybozu.com/k/631/) ・`KINTONE_APP_ID` |
| ニュース週次要約（週次LLM） | **632** | `security-next-automation` | [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/) ・`KINTONE_REPORT_APP_ID` ・[設計CSV](security-next-automation/docs/security-next-weekly-report-app-design.csv) |

※ **631** … `collect` / `analyze` が読むニュース。**632** … `analyze` が書き込む週次要約のみ。`.env`: `KINTONE_APP_ID=631` , `KINTONE_REPORT_APP_ID=632`。API トークンに **両アプリ**を載せる。  
※ **権限**: 自動化の最低限は **レコード閲覧＋追加**。閲覧・追加・編集・削除・アプリ管理のフル付与でもスクリプトは動作するが、トークン漏えい時のリスク低減のため余分な権限は削るとよい（詳細は `security-next-automation/README.md`）。

**出張精算の ID 出所**: テナントで `GET /k/v1/apps.json?name=出張精算` を実行し **629** と突合済み（2026-03-28）。

**Security NEXT**: 収集 [631](https://jbis-kintone.cybozu.com/k/631/) ・週次要約 [632](https://jbis-kintone.cybozu.com/k/632/)（ユーザー確定）。630 は未使用なら無視可。トークンに **631 と 632** の権限を付与。シークレットは **Secrets / `.env` のみ**。**日次（10:00/17:00 JST）**: `collect.ts` がキーワード選別で最大3件を631へ（Gemini 不使用）。**金曜17:00 JST**: `analyze` が週次要約を632へ（Gemini 使用）。詳細は `security-next-automation/README.md` の「運用スケジュール」。

**Security NEXT 連携**: フィールドコードの正本は `security-next-automation/README.md` と `security-next-automation/src/lib/field-codes.ts`。アプリ新規なら `npm run setup:security-next-apps` も可。

### システムヘルスチェックレポート（631 / 632）

- **ポータル URL（運用確認用）**  
  - ニュース（収集）: [https://jbis-kintone.cybozu.com/k/631/](https://jbis-kintone.cybozu.com/k/631/)  
  - 週次要約: [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/)
- **REST 診断**: ルートで `npm run report:space-health`（`.env` に `KINTONE_DOMAIN` と API トークン）。既定で **631 と 632** を検査。まず `app.json`、**アプリ設定の閲覧権限が無いトークン**では `records.json` の取得にフォールバックする。
- **GitHub Actions**: `.github/workflows/space-health-report.yml`（毎日 09:00 JST 前後・`workflow_dispatch` 可）。ジョブサマリーに Markdown 表が付く。
- **メンテ手順の正本**: [`docs/maintenance-template.md`](docs/maintenance-template.md) の「一気通貫メンテ・プレイブック」。エージェント・開発の前提ルールは [`AGENTS.md`](AGENTS.md)。

---

## Security NEXT ニュース — フォームの確定仕様（自動化と一致）

正本: `security-next-automation/src/lib/field-codes.ts` ＝ `security-next-automation/docs/security-next-news-app-design.csv`。

| フィールドコード | 型 | 画面ラベル例 |
|------------------|-----|----------------|
| `title` | 文字列（1行） | タイトル |
| `article_url` | 文字列（1行） | URL（重複禁止推奨） |
| `published_date` | **日付** | 公開日 |
| `summary` | 文字列（複数行） | 概要 |
| `digest` | 文字列（複数行） | 要約（collect は概要と同じ RSS 抜粋を投入） |

- **631** … 上表と一致（収集本番）。**630** は旧・誤フォームの可能性あり。運用は **631** に統一。

---

## ニュース週次要約（レポートアプリ・Security NEXT）

**ニュース保存（631 等）とは別アプリ**。`analyze.ts` のみが書き込む。フィールドコードの正本は `field-codes.ts` の `REPORT_FIELDS` と **`security-next-automation/docs/security-next-weekly-report-app-design.csv`**。

### 確定フォーム（この 2 つ以外は不要）

| フィールドコード | 型 | 画面ラベル例 | 説明 |
|------------------|-----|----------------|------|
| `target_week` | **日付** | 対象週 | その週の **月曜日**（JST・`YYYY-MM-DD`）。`analyze` が自動設定 |
| `weekly_trend` | **リッチエディタ** | 今週の傾向と対策 | LLM 要約（約 900〜1100 字想定）。`analyze` が HTML で投入 |

手動作成手順: `security-next-automation/docs/kintone-weekly-report-app-creation-steps.md`

### 確定インスタンス: アプリ **632**

URL: [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/) 。`npm run app:fields 632` 結果（カスタムフィールドは 2 のみ）:

```
App 632 fields (10)
target_week	DATE	対象週
weekly_trend	RICH_TEXT	今週の傾向と対策
（以下システム・カテゴリ等）
```

**`KINTONE_REPORT_APP_ID=632`** と API トークン権限を設定すること。

### 別環境で新規に作る場合

`npm run setup:security-next-report-app`（管理者 `.env` 必須）。アプリ名変更: `KINTONE_SECURITY_NEXT_REPORT_APP_NAME`

---

## 594（PC台帳）

`npm run app:fields 594` の取得結果（抜粋なし・全件）:

```
App 594 fields (37)
abolished_flag	CHECK_BOX	廃止フラグ
buyer	DROP_DOWN	購入先
category	DROP_DOWN	カテゴリ
dept_name	SINGLE_LINE_TEXT	所属名
dop	DATE	購入日
etc_1	SINGLE_LINE_TEXT	その他情報１
etc_2	SINGLE_LINE_TEXT	その他情報2
group_name	SINGLE_LINE_TEXT	所属グループ
inventory_count	CALC	棚卸回数
inventory_finish_date	DATE	今期棚卸完了日
inventory_history	SUBTABLE	棚卸履歴
ip1	SINGLE_LINE_TEXT	固定IPアドレス1
ip2	SINGLE_LINE_TEXT	固定IPアドレス2
last_inventory_date	DATE	最新棚卸日
location	SINGLE_LINE_TEXT	設置場所
mail	SINGLE_LINE_TEXT	メールアドレス
manufacturer	SINGLE_LINE_TEXT	メーカー
model_name	SINGLE_LINE_TEXT	モデル名 / 型式
note	MULTI_LINE_TEXT	記事欄
PC_name	SINGLE_LINE_TEXT	PC名
price	NUMBER	価格
product_id	SINGLE_LINE_TEXT	製造番号
record_id	SINGLE_LINE_TEXT	管理番号
shared_terminal_name	SINGLE_LINE_TEXT	共有端末名
sn	SINGLE_LINE_TEXT	シリアルナンバー
status	RADIO_BUTTON	状態ステータス
type	RADIO_BUTTON	種別
user_name	SINGLE_LINE_TEXT	利用者名
カテゴリー	CATEGORY	カテゴリー
グループ	GROUP	グループ
ステータス	STATUS	ステータス
レコード番号	RECORD_NUMBER	レコード番号
更新者	MODIFIER	更新者
更新日時	UPDATED_TIME	更新日時
作業者	STATUS_ASSIGNEE	作業者
作成者	CREATOR	作成者
作成日時	CREATED_TIME	作成日時
```

---

## 595（社員マスタ）

```
App 595 fields (20)
dept_name	SINGLE_LINE_TEXT	所属名
employment_status	DROP_DOWN	在籍ステータス
group_name	SINGLE_LINE_TEXT	所属グループ
ledger_created	CHECK_BOX	台帳作成済み
ledger_record_id	NUMBER	台帳レコード番号
mail	SINGLE_LINE_TEXT	メールアドレス
retired_date	DATE	退職日
retired_note	MULTI_LINE_TEXT	退職メモ
sort	NUMBER	表示順
transfer_date	DATE	所属異動日
transfer_note	MULTI_LINE_TEXT	所属異動メモ
user_name	SINGLE_LINE_TEXT	社員名
カテゴリー	CATEGORY	カテゴリー
ステータス	STATUS	ステータス
レコード番号	RECORD_NUMBER	レコード番号
更新者	MODIFIER	更新者
更新日時	UPDATED_TIME	更新日時
作業者	STATUS_ASSIGNEE	作業者
作成者	CREATOR	作成者
作成日時	CREATED_TIME	作成日時
```

---

## 626（アカウント採番）

```
App 626 fields (16)
gb_pw	SINGLE_LINE_TEXT	ガリバーパスワード
logon_name	SINGLE_LINE_TEXT	ADログオン名
logon_pw	SINGLE_LINE_TEXT	ADパスワード
M365_pw	SINGLE_LINE_TEXT	M365パスワード
mail	SINGLE_LINE_TEXT	メールアドレス
mail_pw	SINGLE_LINE_TEXT	メールアドレスパスワード
sb_pw	SINGLE_LINE_TEXT	サイボウズパスワード
used_count	DROP_DOWN	アカウント採番有無
カテゴリー	CATEGORY	カテゴリー
ステータス	STATUS	ステータス
レコード番号	RECORD_NUMBER	レコード番号
更新者	MODIFIER	更新者
更新日時	UPDATED_TIME	更新日時
作業者	STATUS_ASSIGNEE	作業者
作成者	CREATOR	作成者
作成日時	CREATED_TIME	作成日時
```

---

## 627（アカウント管理台帳）

```
App 627 fields (24)
account_state	DROP_DOWN	アカウント状態
dept_name	SINGLE_LINE_TEXT	所属名
employment_status	DROP_DOWN	在籍ステータス
gb_id	SINGLE_LINE_TEXT	ガリバーID
gb_pw	SINGLE_LINE_TEXT	ガリバーパスワード
group_name	SINGLE_LINE_TEXT	所属グループ
logon_name	SINGLE_LINE_TEXT	WindowsID
logon_pw	SINGLE_LINE_TEXT	Windowsパスワード
m365_id	SINGLE_LINE_TEXT	M365ID
m365_pw	SINGLE_LINE_TEXT	M365パスワード
mail	SINGLE_LINE_TEXT	メールアドレス
mail_acct	SINGLE_LINE_TEXT	メールアカウント
mail_pw	SINGLE_LINE_TEXT	メールパスワード
PC_name	SINGLE_LINE_TEXT	利用PC
user_name	SINGLE_LINE_TEXT	利用者名
windows_name	SINGLE_LINE_TEXT	Windowsアカウント名
カテゴリー	CATEGORY	カテゴリー
ステータス	STATUS	ステータス
レコード番号	RECORD_NUMBER	レコード番号
更新者	MODIFIER	更新者
更新日時	UPDATED_TIME	更新日時
作業者	STATUS_ASSIGNEE	作業者
作成者	CREATOR	作成者
作成日時	CREATED_TIME	作成日時
```

---

## 629（出張精算・shucccho-seisan）

- **アプリID**: 629
- **本番 URL 例**: `KINTONE_BASE_URL` のドメイン + `/k/629/`
- **メモ**: システム標準フィールドの **フィールドコードが英字**（`Record_number`, `Status` など）。カスタムは `kingaku`, `shimei`, `shounin_status`, `shutchousaki`。**コードをラベルから推測しないこと。**

`npm run app:fields 629` の結果:

```
App 629 fields (12)
Assignee	STATUS_ASSIGNEE	Assignee
Categories	CATEGORY	Categories
Created_by	CREATOR	Created by
Created_datetime	CREATED_TIME	Created datetime
kingaku	NUMBER	金額
Record_number	RECORD_NUMBER	Record number
shimei	SINGLE_LINE_TEXT	氏名
shounin_status	DROP_DOWN	承認ステータス
shutchousaki	SINGLE_LINE_TEXT	出張先
Status	STATUS	Status
Updated_by	MODIFIER	Updated by
Updated_datetime	UPDATED_TIME	Updated datetime
```

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-03-28 | 初版テンプレ。629 を `/k/v1/apps.json` で特定、594/595/626/627/629 の `app:fields` を本文へ反映、`npm run deploy:629` を `package.json` に追加 |
