# kintone アプリ構成メモ（Cursor / AI 用）

このファイルは **kintone 用 JavaScript や設定を書く前に必ず読む** こと。フィールドコードの取り違えを防ぐ。

## AI・開発者への指示

- 新規アプリやフィールド変更があったら **このファイルを更新**する（アプリ名・アプリID・フィールド一覧）。
- **部署予実（予算・実績・修正）**: 仕様は `templates/yojitsu-budget-lite/SPEC.md`（**§6c**＝`支払内訳` サブテーブル等のたたき台）。**入力**と **ダッシュ**の **2 アプリ**＋任意マスタ（`SPEC.md` §6b）。一覧表は **アプリごと 1 行**（下表参照）。`shin-format-excel-layout.md`・`excel-column-draft-2026-04-28.md`・`yojitsu-spec-session-checklist.md`。**アプリ新規作成時は配置先 kintone スペース（名または ID）を先に決める**（`.cursor/rules/creation-timing-ask.mdc`）。
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
| アカウント管理台帳 | 627 | `customize/627/desktop.js` | `npm run deploy:627` |
| 出張精算アプリ | **629** | `customize/shucccho-seisan/desktop.js` | `npm run deploy:629` |
| 社内FAQ（DB） | **640** | （**FAQ レコードの本番保管先**で確定。運用ガイド **668** とは別アプリ） | [https://jbis-kintone.cybozu.com/k/640/](https://jbis-kintone.cybozu.com/k/640/) ・UI 用 HTML の作業例: `scripts/faq-portal-full.html`（640 への反映は運用で実施） |
| Security NEXT ニュース（収集） | **631** | `security-next-automation` | [https://jbis-kintone.cybozu.com/k/631/](https://jbis-kintone.cybozu.com/k/631/) ・`KINTONE_APP_ID` |
| ニュース週次要約（週次LLM） | **632** | `security-next-automation` | [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/) ・`KINTONE_REPORT_APP_ID` ・[設計CSV](security-next-automation/docs/security-next-weekly-report-app-design.csv) |
| 運用ガイド（PC台帳・アカウント周りの操作手順） | **668** | `customize/ops-guide/desktop.js` | `npm run ops-guide:publish`（HTML レコード同期＋desktop.js デプロイ） |
| 環境設定マスタ（新・PC台帳ver.1 用 / Day 1） | **670** | （まだなし / Day 4 で customize 開始予定） | Space 21 / 2026-04-24 作成 / 12 レコード（M365 ドメイン・固定文字・上限値）|
| M365管理マスタ（新・PC台帳ver.1 用 / Day 2 / 5 台ライセンス厳守） | **671** | （まだなし / Day 4 で customize 開始予定） | Space 21 / 2026-04-24 作成 / 10 レコード（sjm-001~sjm-010 / X 案 5 台節約）|
| **新・PC台帳 所属候補マスタ**（674 共有・JR の「所属候補から入力」モーダル。API 失敗時は674 JS の埋め込み一覧にフォールバック） | **680** | （customize なし） | **Space 21 / thread 23**・[スペース 21](https://jbis-kintone.cybozu.com/k/#/space/21)。**2026-05-05**: `npm run pc-ledger:dept-master:create-app:seed` で作成＋`dept_name`・`group_name`・`sort_no`＋シード31件。**674** の `APP_DEPT_MASTER_674='680'`。再投入: `npm run pc-ledger:dept-master:seed-records` |
| 新個人WindowsID採番マスタ（新・PC台帳ver.1 用 / Day 3 / 旧 626 置換） | **672** | （まだなし / Day 4 で customize 開始予定） | Space 21 / 2026-04-25 作成 / 0 レコード（`^jbm\d{4}$` 厳格 / `jbm0001` から払出予定）|
| 新共有WindowsID採番マスタ（新・PC台帳ver.1 用 / Day 3 / 旧 667 置換） | **673** | （まだなし / Day 4 で customize 開始予定） | Space 21 / 2026-04-25 作成 / 0 レコード（`^sjbm\d{4}$` 厳格 / `sjbm0001` から払出予定）|
| 新・PC台帳ver.1（本体・674 customize **本実装進行中**・**運用開始前**） | **674** | `customize/new-pc-ledger-v1/desktop.js` | `npm run deploy:674` / Space **21** / thread **23** / customize **BUILD=`2026-05-05-pc-ledger-m365master-readonly`**（閲覧=detail **PC買替・印刷のみ**／共有・JR **最小表示**＋所属モーダル（**680**）／**671 行番号（m365_master_record_id）は新規・編集で手入力不可**／固定IPはNASのみ任意／備考全種別任意／モバイル想定なし）/ fileKey **`8a65fd74-3896-4b0a-88d0-63c6714cecfc`** / preview revision **`95`** / field-spec **44/44** / **運用開始予定 2026-05-13**（仕様書 §1） |
| **部署予実・入力**（明細・`新フォーマット` 全列・`支払内訳` サブテーブル・月次 12 行） | **677** | `customize/677/desktop.js` \| `npm run deploy:677` | [https://jbis-kintone.cybozu.com/k/677/](https://jbis-kintone.cybozu.com/k/677/)・**担当者向けマニュアル**: **本番掲載**は専用 **[679](https://jbis-kintone.cybozu.com/k/679/)**（HTML）。678 は短い案内のみ（`npm run yojitsu:678:set-manual-pointer`）。リポ: `yojitsu-quick-manual.md` / `yojitsu-quick-manual.html`（`templates/yojitsu-budget-lite/docs/`）。`npm run yojitsu:679:sync-manual-js` → `deploy:679`・`window.Y678_QUICK_MANUAL_URL` でリンク先上書き可・**配置**: Space **54** / thread **58**・ポータル [スペース 54（thread 58）](https://jbis-kintone.cybozu.com/k/#/space/54/thread/58)。**2026-04-29**: 枠作成 deploy **SUCCESS**。**2026-05-02**: customize（`monthly_breakdown` 12 行整形＋保存時 **`支払内訳`→月次「実績」ロールアップ**・暦月合算・**ロールアップ例外時は保存ブロック `event.error`**）deploy **SUCCESS** / fileKey **`69629015-73da-40b7-9507-18232966bcbc`** / preview revision **9** / **BUILD=`2026-05-02-677-submit-error-guard`**。**2026-05-03**: 費用種別に応じ **ランニング／イニシャル片方のみ表示**・**枠種別＋保存検証**・実績ロールアップの **枠フィルタ**（`BUILD=2026-05-03-677-cost-category-field-guard`）。customize deploy **SUCCESS** / fileKey **`38c2bfd1-b420-4b37-ac7a-d54f534914c4`** / preview revision **`12`**。**データ**: `C:\\tmp\\予算管理\\2026年度システム推進室_年間予算案20260123.xlsx` の **`旧フォーマット`** から **47 明細**を初回投入（`yojitsu-migration-kyu-to-kintone.md`・総計行除外・`npm run yojitsu:677:record-count`）。スペース内の旧アプリは **運用開始までに削除予定**（不要分）。`SPEC.md` §6–§6c |
| **部署予実・ダッシュ**（**集計管理の主画面**・俯瞰・入力アプリ参照） | **678** | `customize/678/desktop.js` \| `npm run deploy:678` | [https://jbis-kintone.cybozu.com/k/678/](https://jbis-kintone.cybozu.com/k/678/)・入力と同スペース。**2026-04-29** 枠のみ deploy **SUCCESS**。**2026-05-02**: 677 明細表・備考・`display_order` PUT・**API 失敗時メッセージ（コード・ヒント）**・リビジョン未取得時の案内 deploy **SUCCESS** / fileKey **`5f992f52-5148-4b10-b7fb-e018ff0bf8bf`** / preview revision **7** / **BUILD=`2026-05-02-678-dashboard-api-errors`**。**2026-05-03**: 費用種別「固定費」行に **`monthly_breakdown` 定額月額**の **「翌月〜4月同額（はい）」「この月のみ（いいえ）」**から 677 へ PUT。**続き**: 「変動費」行は **`initial_variable_budget` PUT**＋**月次「予算修正」**の **はい／いいえ**（翌月〜4月同額／当月のみ）・保存前 **費用種別再確認**（`BUILD=2026-05-03-678-variable-revision-propagate` → **`2026-05-03-678-kintone-api-url-fix`**（`kintone.api.url`）→ **`2026-05-03-678-table-scroll-touch`**（表幅・横スク）→ **`2026-05-03-678-hide-native-list`**（**678 標準一覧を非表示**）→ **`2026-05-03-678-passive-touch-patch`**（**touchstart/touchmove** の `passive` 未指定を既定 **true**）→ **`2026-05-03-678-running-monthly-readout`**（固定費・**`monthly_breakdown` 12 ヶ月実効の表示**）。customize deploy **SUCCESS** / fileKey **`b20b6b36-4177-4f64-b0bc-a8180a6e6309`** / preview revision **`57`**。**続（再デプロイ）**: グリッド版 **SUCCESS** / fileKey **`ee4eda1c-bf83-450c-a284-a54ce0c3a347`** / preview revision **`58`** / **BUILD=`2026-05-04-678-hide-recordcount-mo`**。**続**: 費用種別に応じ **月次「予算」「消費率」— 表示**・集計列の抑止・**支払モーダルに既存支払一覧**・枠種別表記 **ランニング** 修正 deploy **SUCCESS** / fileKey **`337db535-633e-49d5-a7f8-88b8680796ee`** / preview revision **`60`** / **BUILD=`2026-05-04-678-dash-columns-payment-list`**。**続（2026-05-05）**: 固定費の「予算修正」**はい／いいえ**・§6e **クリック範囲**（固定費＝**入力対象月**列＝入力月へジャンプで選択／変動費＝都度列）・実績モーダル **会社を新規登録する**。**customize deploy SUCCESS** / fileKey **`f6a47dcc-1e1c-425e-8f15-5a8e73a6f518`** / revision **`63`** / **BUILD=`2026-05-05-678-input-month-from-jump`**。**続（2026-05-06）**: 表上に**会社名変更手順**の案内。**deploy SUCCESS** / fileKey **`4ea59945-ce25-441a-bfaf-bbc0346ecd1d`** / revision **`64`** / **BUILD=`2026-05-06-678-company-change-hint`**。**続（2026-05-07）**: **入力月へジャンプ**の月ボタンで **target が Text ノード**でも反応するようクリック委譲を修正。月選択後の **横スクロール**は **requestAnimationFrame** で再描画直後に実行。**deploy SUCCESS** / fileKey **`5044d466-631e-4365-83ba-9f8a4336f792`** / revision **`65`** / **BUILD=`2026-05-07-678-month-jump-delegate-fix`**。**続（2026-05-07・表示名）**: ナビ・案内の **「月度ジャンプ」**を **「入力月へジャンプ」**に改称。**deploy SUCCESS** / fileKey **`d74060fa-b27c-41b1-8a8e-f3c6201cb69c`** / revision **`66`** / **BUILD=`2026-05-07-678-input-month-jump-label`**。**続（2026-05-07・会社）**: 実績モーダルで **FBJ・オフィスバスター・他のもの** 等を集合先判定に追加。**datalist** で候補選択＋入力可。保存時 **677 `partner_company` PUT**（集合先行はボタン未押下でも可）。**deploy SUCCESS** / fileKey **`9fb11414-6ae5-40d9-b0a8-532c53d07cf6`** / revision **`67`** / **BUILD=`2026-05-07-678-partner-preset-fbj-office`**。**続（2026-05-07・都度ナビ）**: ナビに **「都度費用」**ボタン（変動費の実績・予算修正列へジャンプ＋枠強調・`sessionStorage`）。**deploy SUCCESS** / fileKey **`a2e72bc6-3244-489e-87b7-398429288f8a`** / revision **`68`** / **BUILD=`2026-05-07-678-nav-tsudo-jump`**。**続**: 都度押下時は**月ナビの押下見た目のみ解除**（入力対象月は維持）。**deploy SUCCESS** / fileKey **`7b58fc4b-4147-4ce4-85aa-3c5d84a4d33e`** / revision **`69`** / **BUILD=`2026-05-07-678-nav-tsudo-clear-month-ui`**。**続（会社）**: 実績モーダルに **会社候補の `<select>`**＋**NFKC 表記ゆれ**で集合先判定を拡張（FBJ 全角等・他の派生）。**deploy SUCCESS** / fileKey **`b1ce263d-0a2d-4848-ad35-fdd20b7b58e6`** / revision **`70`** / **BUILD=`2026-05-07-678-partner-select-nfkc`**。**続（2026-05-04）**: シェル最上段 **クイックマニュアル** リンク・本文長文削除（fileKey **`b5e8b981-d050-44ca-98e5-eda0430bf756`** / rev **`87`**）。**続**: **アプリの説明**に HTML マニュアル掲載（`npm run yojitsu:678:publish-manual-description`）・リンク先 `#y678-quick-manual`。customize **deploy SUCCESS** / fileKey **`f53d40ea-5d60-4d8e-8442-775a0d744a9b`** / revision **`90`** / **BUILD=`2026-05-04-678-manual-in-app-description`**。**続（2026-05-04・679）**: マニュアル全文は **専用アプリ 679** へ移設。678 の説明欄は **679 への短案内**（`npm run yojitsu:678:set-manual-pointer`）。**続**: **再デプロイ**。**deploy SUCCESS** / fileKey **`e901ad5f-d7fb-4016-97f1-84d6f871f723`** / revision **`109`** / **BUILD=`2026-05-04-678-manual-app-guide-name`**。**2026-05-05**: 台帳整合のため **live 再デプロイ** `npm run deploy:678` **SUCCESS** / fileKey **`6074bbd9-62bf-4746-b522-ec4ebcdeba12`** / revision **`110`** / **BUILD=`2026-05-04-678-manual-app-guide-name`**（`customize/678/desktop.js` HEAD）。REST で説明欄確認済: 「クイックマニュアル (専用アプリ 679)」は **説明欄に無し**（679 への短案内のみ）。`SPEC.md` §6・§6b・§6c・§6e |
| **部署予実クイックマニュアル**（HTML・表中心・一覧カスタマイズのみ） | **679** | `customize/679/desktop.js` \| `npm run yojitsu:679:sync-manual-js` → `npm run deploy:679` | [https://jbis-kintone.cybozu.com/k/679/](https://jbis-kintone.cybozu.com/k/679/)・Space **54** / thread **58**・本文は `templates/yojitsu-budget-lite/docs/yojitsu-quick-manual.html` から同期。**2026-05-04** アプリ新規（preview→live **SUCCESS**）・customize **deploy SUCCESS** / fileKey **`3c6b72d4-ac94-4600-920d-e6bd13c8bd1e`** / revision **`3`** / **BUILD=`2026-05-04-679-yojitsu-quick-manual-page`** |

### 678 本番 customize の実効ビルド（台帳ずれの正）

- **本番 live**（**2026-05-05** `npm run deploy:678` **SUCCESS** 時点）: fileKey **`6074bbd9-62bf-4746-b522-ec4ebcdeba12`** / preview revision **`110`** / **`var BUILD`** = **`2026-05-04-678-manual-app-guide-name`**（リポ **`customize/678/desktop.js` HEAD** と一致）。
- **上表 678 行の `2026-05-05`〜`05-07` 風の連記**は、**現行 `desktop.js`（上記 BUILD）のバンドルには含まれない**メモ行である（当該機能を載せるときは **ソース改修＋`BUILD` 更新**のうえ **deploy:678**）。
- **再デプロイ手順**: **`npm run deploy:678`** → 成功したら **fileKey / revision** を本節および表の末尾へ追記する。

※ **631** … `collect` / `analyze` が読むニュース。**632** … `analyze` が書き込む週次要約のみ。`.env`: `KINTONE_APP_ID=631` , `KINTONE_REPORT_APP_ID=632`。API トークンに **両アプリ**を載せる。  
※ **権限**: 自動化の最低限は **レコード閲覧＋追加**。閲覧・追加・編集・削除・アプリ管理のフル付与でもスクリプトは動作するが、トークン漏えい時のリスク低減のため余分な権限は削るとよい（詳細は `security-next-automation/README.md`）。

**出張精算の ID 出所**: テナントで `GET /k/v1/apps.json?name=出張精算` を実行し **629** と突合済み（2026-03-28）。

**Security NEXT**: 収集 [631](https://jbis-kintone.cybozu.com/k/631/) ・週次要約 [632](https://jbis-kintone.cybozu.com/k/632/)（ユーザー確定）。630 は未使用なら無視可。トークンに **631 と 632** の権限を付与。シークレットは **Secrets / `.env` のみ**。**日次（10:00/17:00 JST）**: `collect.ts` がキーワード選別で最大3件を631へ（Gemini 不使用）。**金曜17:00 JST**: `analyze` が週次要約を632へ（Gemini 使用）。詳細は `security-next-automation/README.md` の「運用スケジュール」。

**Security NEXT 連携**: フィールドコードの正本は `security-next-automation/README.md` と `security-next-automation/src/lib/field-codes.ts`。アプリ新規なら `npm run setup:security-next-apps` も可。

**FAQ（640）**: 社内 FAQ の **DB はアプリ 640**（[https://jbis-kintone.cybozu.com/k/640/](https://jbis-kintone.cybozu.com/k/640/)）で確定。運用ガイド（668）や PC 台帳系アプリとは **別アプリ**。

**638 / 639**: アプリ台帳上も論理名は **「社内FAQDB」** と同一だが、**容量・件数は実質空に近く**、**640 が運用中の正本**（台帳: 640 は DB 保管・日付・利用指標が立っている）。638・639 は **旧枠・未移行の残骸**の可能性が高い → ルックアップ等の依存なし確認済。**2026-05-20 頃**まで様子見のうえ **削除予定**（その前に CSV バックアップ推奨）。このリポのコードからは未参照。

### デイリーヘルスチェック（廃止）

**2026-05 以降**: 全アプリの REST 定期診断（旧 `space-health-report` / GitHub Actions / `npm run report:space-health`）は **運用しない**。アプリの正は **社内アプリ台帳** と **`## アプリ一覧`** とする。

- **運用確認用 URL**  
  - ニュース（収集）: [https://jbis-kintone.cybozu.com/k/631/](https://jbis-kintone.cybozu.com/k/631/)  
  - 週次要約: [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/)

- **メンテ手順の正本**: [`docs/maintenance-template.md`](docs/maintenance-template.md)。エージェント・開発の前提ルールは [`AGENTS.md`](AGENTS.md)。
### GitHub Actions デプロイ記録（自動）

| 日時（UTC） | アプリID | customize パス |
|-------------|----------|----------------|
| 2026-05-04T13:02:08Z | 677 | `customize/677/desktop.js` |
| 2026-05-04T12:53:00Z | 678 | `customize/678/desktop.js` |
| 2026-05-04T11:15:00Z | 679 | `customize/679/desktop.js` |
| 2026-05-04T11:14:00Z | 678 | `customize/678/desktop.js` |
| 2026-05-04T11:01:32Z | 678 | `customize/678/desktop.js` |
| 2026-05-04T10:55:26Z | 678 | `customize/678/desktop.js` |
| 2026-05-04T00:01:26Z | 678 | `customize/678/desktop.js` |
| 2026-05-03T22:27:48Z | 678 | `customize/678/desktop.js` |
| 2026-05-02T01:14:56Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T09:46:20Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T08:13:34Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T08:06:32Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:59:15Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:53:07Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:49:50Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:47:01Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:40:40Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:31:24Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-05-01T07:17:40Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-30T12:49:20Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-30T09:14:42Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-29T10:58:37Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-29T10:58:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-29T06:15:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.6・全フィールドリセット対象拡張・手元 deploy rev 38） |
| 2026-04-29T06:05:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.5・社員名検索モーダル 595・手元 deploy rev 37） |
| 2026-04-29T05:48:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.4・利用者名候補は入力中 DOM を参照・手元 deploy rev 36） |
| 2026-04-29T05:42:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.3・595 user_name 正規化フォールバックで保存前照合・手元 deploy rev 35） |
| 2026-04-29T05:37:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7.2・PC `record` holder / getFieldElement PC 優先・手元 deploy rev 34） |
| 2026-04-29T05:45:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.7・利用者名候補の表示修正・手元 deploy） |
| 2026-04-29T05:35:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.6・共有/JR メール非表示 + 共有端末名チェック・手元 deploy） |
| 2026-04-29T05:25:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.5・個人 利用者名 595 入力支援 + 保存前照合・手元 deploy） |
| 2026-04-29T05:16:07Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.4・保存前 M365 6 台目ブロック + 平易メッセージ・手元 deploy） |
| 2026-04-29T05:15:00Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.3・671 編集差分リコンサイル + 672/673 未使用戻し・手元 deploy） |
| 2026-04-29T04:59:55Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD day5-autogen-v0.2・保存成功 671/672/673 + ライセンスバナー・手元 deploy） |
| 2026-04-29T04:55:55Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD day5-autogen-v0.1・手元 deploy） |
| 2026-04-29T04:49:43Z | 674 | `customize/new-pc-ledger-v1/desktop.js`（BUILD v0.5・手元 deploy） |
| 2026-04-28T10:29:46Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |
| 2026-04-28T10:27:43Z | 674 | `customize/new-pc-ledger-v1/desktop.js` |


---

## Security NEXT ニュース — フォームの確定仕様（自動化と一致）

正本: `security-next-automation/src/lib/field-codes.ts` ＝ `security-next-automation/docs/security-next-news-app-design.csv`。

| フィールドコード | 型 | 画面ラベル例 | 説明 |
|------------------|-----|----------------|------|
| `title` | 文字列（1行） | タイトル | 記事タイトル |
| `article_url` | 文字列（1行） | URL | 重複禁止推奨 |
| `published_date` | **日付** | 公開日 | RSS 公開日（JST） |
| `summary` | 文字列（複数行） | 概要 | RSS 抜粋 |
| `digest` | 文字列（複数行） | 要約 | collect は概要と同じ RSS 抜粋を投入 |
| `match_keywords_display` | 文字列（1行） | 採用キーワード | マッチしたキーワードのカンマ区切り |
| `internal_match_meta_json` | 文字列（複数行） | 採用メタJSON（内部） | 監査・デバッグ用 JSON |
| `internal_source` | 文字列（1行） | ソース（内部） | `rss` / `nvd` |
| `internal_gemini_mark` | 文字列（1行） | Gemini成否（内部） | `Y` / `I` / `N` |
| `needs_review` | チェックボックス | 要レビュー | 複合条件で自動セット |
| `internal_severity_tier` | 文字列（1行） | 重大度区分（内部） | `normal` / `exception` |

- **631** … 上表と一致（収集本番）。**630** は旧・誤フォームの可能性あり。運用は **631** に統一。
- **内部フィールド**（`internal_*`）は一覧レイアウトで非表示にし、権限を管理者に絞る運用を推奨。
- **例外枠**: AGENTS.md §7 に基づき 1 日あたり最大 3 件。通常枠 3 + 例外枠 3 = 合計 6 件/日がハードリミット。

---

## ニュース週次要約（レポートアプリ・Security NEXT）

**ニュース保存（631 等）とは別アプリ**。`analyze.ts` のみが書き込む。フィールドコードの正本は `field-codes.ts` の `REPORT_FIELDS` と **`security-next-automation/docs/security-next-weekly-report-app-design.csv`**。

### 確定フォーム（632）

| フィールドコード | 型 | 画面ラベル例 | 説明 |
|------------------|-----|----------------|------|
| `target_week` | **日付** | 対象週 | その週の **月曜日**（JST）。**Idempotency キー**（同一日付は `analyze` が更新） |
| `weekly_trend` | **リッチエディタ** | 今週の傾向と対策 | LLM 本文（約 900〜1100 字想定）。HTML で投入 |
| `summary_one_line` | **文字列（1行）** | 週次サマリー1行 | 一覧・通知・ポータル向けプレーン 1 行 |
| `internal_ref_news_count` | **数値** | 参照631件数（内部） | LLM に渡した 631 件数（最大 45 件カット後） |
| `internal_ref_record_id_min` | **数値** | （内部） | 上記に含まれる 631 の `$id` 最小 |
| `internal_ref_record_id_max` | **数値** | （内部） | 上記に含まれる 631 の `$id` 最大 |
| `internal_analysis_run_at` | **日付と時刻** | （内部） | 実行日時（JST オフセット付き） |
| `internal_github_run_id` | **文字列（1行）** | （内部） | `GITHUB_RUN_ID`（Actions）／ローカルは `local` |

**内部フィールド**は一覧レイアウトで非表示にし、権限を管理者に絞る運用を推奨。

手動作成・追補手順: `security-next-automation/docs/kintone-weekly-report-app-creation-steps.md`

### 確定インスタンス: アプリ **632**

URL: [https://jbis-kintone.cybozu.com/k/632/](https://jbis-kintone.cybozu.com/k/632/) 。`npm run app:fields 632` 結果（カスタムフィールドは 2 のみ）:

```
App 632 fields（上表のカスタム＋システムフィールド）。カスタムは `target_week`・`weekly_trend`・`summary_one_line`・`internal_*` を含む。
```

**`KINTONE_REPORT_APP_ID=632`** と API トークン権限を設定すること。

### 別環境で新規に作る場合

`npm run setup:security-next-report-app`（管理者 `.env` 必須）。アプリ名変更: `KINTONE_SECURITY_NEXT_REPORT_APP_NAME`

---

## 594（PC台帳）

`npm run app:fields 594` の取得結果（抜粋なし・全件・本番 2026-04-18 時点）:

```
App 594 fields (38)
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
ledger_record_id	SINGLE_LINE_TEXT	アカウント台帳番号
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

`npm run app:fields 595`（本番 2026-04-18 時点）:

```
App 595 fields (23)
dept_name	SINGLE_LINE_TEXT	所属名
emp_id	SINGLE_LINE_TEXT	社員管理番号
employment_status	DROP_DOWN	在籍ステータス
group_name	SINGLE_LINE_TEXT	所属グループ
ledger_created	CHECK_BOX	アカウント台帳作成済み
ledger_link_list	SUBTABLE	アカウント台帳紐づけ
ledger_record_id	NUMBER	アカウント台帳レコード番号
mail	SINGLE_LINE_TEXT	メールアドレス
pc_ledger_list	SUBTABLE	PC台帳紐づけ
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

**本番テナントではアプリ削除済（2026-05 確認）。** `## アプリ一覧` 表からは除外。個人 Windows ID 採番は **672** を参照。

`npm run app:fields 626`（本番 2026-04-18 時点・削除前のスナップショット）:

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

`npm run app:fields 627`（本番 2026-04-18 時点）。サブテーブル `pc_ledger_links` 内の 594 参照フィールドは **`pc_ledger_link_594_id`**（`customize/627/desktop.js` の `FC627_PC_SUB_594` と一致）。

```
App 627 fields (31)
account_state	DROP_DOWN	アカウント状態
account_type	DROP_DOWN	アカウント種別
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
pc_594_record_id	SINGLE_LINE_TEXT	PC台帳番号
pc_ledger_links	SUBTABLE	PC台帳紐づけ（複数）
PC_name	SINGLE_LINE_TEXT	利用PC
sb_id	SINGLE_LINE_TEXT	サイボウズID
sb_pw	SINGLE_LINE_TEXT	サイボウズパスワード
user_name	SINGLE_LINE_TEXT	利用者名
vpn_id	SINGLE_LINE_TEXT	VPN_ID(KDDI)
vpn_pw	SINGLE_LINE_TEXT	VPN_パスワード
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

## 668（運用ガイド・ops-guide）

- **アプリID**: 668（環境変数 `KINTONE_OPS_GUIDE_APP` が正本）
- **本番 URL 例**: `KINTONE_BASE_URL` のドメイン + `/k/668/`
- **目的**: PC台帳／アカウント台帳／社員マスタ等の操作手順を社内向け HTML として配信。`docs/ops-guide/*.html` がソース、Kintone レコードに同期して iframe で表示。
- **カスタマイズ方針** (2026-04-18 v4.1):
  - 主要メニュー（💻 PC管理台帳 / 🔑 アカウント台帳 等）は **iframe の外** に Kintone DOM 直下のテキストリンクとして描画（`buildQuickLinkBar` / `jbis-ops-quick-link-bar`）。iframe 内クリッピング問題の根本回避策。
  - iframe は **最低 1500px** 固定、postMessage (`jbis-ops-guide-iframe-resize`) による grow-only オートリサイズ。auto-resize 失敗時のフォールバックとして iframe 自身のスクロールも許可。

`npm run app:fields 668` 相当のフィールド（実取得 2026-04-16）:

```
App 668 fields (11)
Assignee            STATUS_ASSIGNEE     Assignee
Categories          CATEGORY            Categories
Created_by          CREATOR             Created by
Created_datetime    CREATED_TIME        Created datetime
guide_body_html     MULTI_LINE_TEXT     HTML本文      ← レコード本文（iframe srcdoc に注入）
guide_slug          SINGLE_LINE_TEXT    ガイドID      ← 'hub' / 'pc' / 'personal' / 'shared' / 'employee' / 'lifecycle'
guide_title         SINGLE_LINE_TEXT    タイトル
Record_number       RECORD_NUMBER       Record number
Status              STATUS              Status
Updated_by          MODIFIER            Updated by
Updated_datetime    UPDATED_TIME        Updated datetime
```

レコード（slug ↔ HTML ファイル）の対応:

| guide_slug | guide_title | ソース HTML |
|------------|-------------|-------------|
| `hub` | ガイドトップ | `docs/ops-guide/index.html` |
| `pc` | PC台帳ガイド | `docs/ops-guide/guide-pc.html` |
| `personal` | 個人アカウントガイド | `docs/ops-guide/guide-personal-account.html` |
| `shared` | 共有アカウントガイド | `docs/ops-guide/guide-shared-account.html` |
| `employee` | 社員マスタガイド | `docs/ops-guide/guide-employee.html` |
| `lifecycle` | 異動・退職・買替ガイド | `docs/ops-guide/guide-lifecycle.html` |

**運用コマンド**:
- `npm run ops-guide:sync` — HTML を Kintone レコードへ同期のみ
- `npm run ops-guide:deploy` — desktop.js のみデプロイ
- `npm run ops-guide:publish` — sync + deploy（日次更新の標準）

---

## PC台帳まわり（594・595・626・627・668・674）の保守メモ

- **ブラウザカスタマイズの正本**: 各アプリは `customize/<アプリID>/desktop.js` のみ。`npm run deploy:594`（595/626/627 同様）でアップロード。`customize-manifest.json` も `desktop.js` のみを指す。
- **旧バックアップ JS**: リポジトリ直下の `desktop-v2.js` / `desktop-old-backup.js` はデプロイに使わないため **削除済み**（旧内容は `git log` および `backups/` 配下を参照）。
- **Kintone フォームのフィールド削除**: 本番データ・ルックアップ・履歴への影響が大きいため、**このリポジトリの変更だけでは実施しない**。未使用の疑いがあるフィールドは `npm run app:fields` で実フォームと突合し、JS から参照していなければ「UIのみ残存」として運用判断する。
- **回帰前の最低チェック**: `npm run kintone:test`（疎通）、`npm run lint:customize`、変更アプリの `npm run app:fields <id>`。595 自動化は `npm run test:e2e:595`（テスト用データを作るため本番では慎重に）。

### 保留中の整理候補（コード参照ゼロの扱い方針）

> このセクションは「`customize/` と `scripts/` のどこにもフィールドコードや参照が現れないもの」を **どう扱うか** の方針記録です。**削除指示ではありません**。

#### A. ユーザー入力専用フィールド（全件保持）

下記は **JS から参照していないが、Kintone フォーム入力・CSV 取込・印刷帳票・運用メモなどで現役**として使われているもの。**業務側の利用データ**であり、**全件そのまま保持**する方針。コード側で「未使用に見える」ことを理由に削除提案はしない。

| アプリ | フィールドコード | 想定利用 |
|---|---|---|
| 594 | `etc_1` | 自由メモ（現場記入） |
| 594 | `etc_2` | 自由メモ（現場記入） |
| 594 | `product_id` | 物品・資産管理キー |
| 594 | `ip2` | 予備IP |
| 594 | `sn` | シリアル番号（棚卸し照合） |
| 594 | `price` | 購入価格（経理連携） |
| 594 | `buyer` | 購入者・申請者記録 |
| 595 | `sort` | 一覧の手動ソートキー |
| 627 | `vpn_id` | VPN ID(KDDI) — 印刷帳票で使用 |
| 627 | `vpn_pw` | VPN パスワード — 印刷帳票で使用 |

#### B. ワンショット系スクリプト（保管・実行ガード済み）

`scripts/backfill-*.js` 6 本は **過去データの紐付けを埋めるための 1 度きり用途**。既に本番反映済みで **通常運用では再実行しない**が、**特殊イベント時の保険**として残す。

| ファイル | 用途（要約） |
|---|---|
| `backfill-594-627-cross-refs.js` | 594 と 627 の相互 ID（`ledger_record_id` / `pc_594_record_id`）を一括で揃える |
| `backfill-595-pc-ledger-from-594.js` | 595 の `pc_ledger_list` を mail 一致の 594 から補填 |
| `backfill-595-ledger-from-mail.js` | 595 の `ledger_record_id` 等を mail 起点で 594/627 から補填 |
| `backfill-595-ledger-from-627.js` | 595 の `ledger_record_id` / `employment_status` を 627 と突合して整える |
| `backfill-627-pc-ledger-links-from-595.js` | 627 のサブテーブル `pc_ledger_links` を 594 ID のユニーク集合で補填 |
| `backfill-627-sb-from-mail-626.js` | 627 の `sb_id` / `sb_pw` を mail と 626 から一括反映 |

**実行ガード**（2026-04-18 制定）:
- 各ファイルの先頭に共通ヘッダコメントと `process.argv` / `process.env.ONESHOT_CONFIRM` ガードを実装
- **引数なしで叩くと exit code 2 で即ブロック**(事故防止)
- `-- --dry-run` は確認用に常時通る
- 本実行は `ONESHOT_CONFIRM=yes npm run backfill:…` のみ
- 再実行が必要な代表ケース：
  - 大量 CSV インポート後に紐付けだけ反映漏れ
  - 別テナント／別環境からのデータ移行
  - 障害復旧によるバックアップ書き戻し後の紐付け破損
- **再実行する前に必ず利用者と相談**（`AGENTS.md` §4 にも明記）

#### C. UI ラベル・文言の改善候補（別途相談中）

技術用語が画面に出ている部分を、IT 専門外の利用者にも分かりやすくする案。**1 つずつ業務側と確認しながら順次対応予定**。データ・連携には影響せず、`customize/<id>/desktop.js` の表示文字列だけ書き換えるため戻しやすい。

| 場所 | 現状 | 改善案（仮） |
|---|---|---|
| 594 詳細「594⇔627 紐付け解除…」ボタン | 技術用語 | 「この PC からアカウントの紐付けを外す…」 |
| 627 詳細「594⇔627 紐付け解除…」ボタン | 技術用語 | 「このアカウントから PC の紐付けを外す…」 |
| 594 ダッシュボード「🟡 紐付けなし」行の `ledger_record_id` 列 | 値だけ表示 | tooltip で「627 にリンクなし＝この台帳番号は単独残存」を追加 |
| 627 詳細の VPN 系項目 | 印刷専用と分かりにくい | 印刷時のみ表示、画面上はグループ折りたたみ案 |

**実施判断は 1 案ずつ別途相談**。先に実機の表示確認・既存利用者への影響確認を行ってから着手する。

### 意図的に「リポジトリ／エージェントだけでは未完了」としていること

次の作業は **業務・権限・CSV・監査**に触れるため、**着手・本番実行の前に必ず関係者と相談**してから進める前提とする（エージェントは勝手に実行しない）。

| 区分 | 内容 | 完了の目安 |
|------|------|------------|
| A | **Kintone 画面上のフィールド削除**（フォームからの削除） | 利用実態・ルックアップ・API・バックフィルスクリプトの棚卸し → 参照ゼロを確認 → 管理画面で削除、の順を文書化し実施 |
| B | **ブラウザ機能の手動／E2E 網羅**（594/627 UI 全パス等） | 検証用環境でシナリオ一覧と期待結果を固定し、手動チェックリストまたは自動テストを回した証跡を残す |
| C | **本番でのデータ変更系 npm**（例: `test:e2e:595`、`clear:594:orphan-ledger:apply`、大量 sync） | 実行日時・担当・ロールバック方針を合意したうえで実施 |

A・B・C のいずれも、**「方針とスコープの合意」が取れるまでコード・CI だけで完結させない**。

### 実行前に相談が必要なコマンド（例）

データ作成・更新・削除や本番カスタマイズに直結するもの。**未合意のまま本番向けに実行しない。**

- `npm run test:e2e:595` / `test:e2e:595:cleanup` … 595（および連携先）にテスト用レコードを作る可能性
- `npm run clear:594:orphan-ledger:apply` … 594・627 の特定フィールドを一括更新
- `npm run sync:595` / `sync:595:force` … 627 等への反映
- `npm run purge:627` / `reset:626:pool` / `reset:595:flags` など **reset / purge 系**
- 各種 `npm run deploy:*` … 本番 JavaScript の即時差し替え
- `npm run ops-guide:publish` … 668 の本文・カスタマイズの本番反映

参照のみ・ローカル影響のみの例（相談不要なことが多いが、ポリシーで縛る場合は組織ルールに従う）: `npm run app:fields <id>`、`npm run verify:pc-stack`、`npm run clear:594:orphan-ledger`（`--apply` なし）

### 「完全版」に近づけるための推奨ループ（運用方針）

1. **機能変更のたび**: `npm run verify:pc-stack`（＝ `kintone:test` + `lint:customize`）。触ったアプリは `npm run app:fields <id>` でフィールド一覧を再取得し、**`kintone-apps.md` を更新するか判断**（変更があれば更新）。
2. **595 自動化まわり**: 変更が入ったら **検証環境**で `npm run test:e2e:595` を検討。本番で回す場合は **`--cleanup` の有無とデータの扱い**を事前合意。
3. **フォームからフィールドを削る場合**: `app:fields` → リポジトリ内 `grep`/スクリプト一覧で参照調査 → バックフィル・JS の参照除去 → **最後に** kintone 管理画面でフィールド削除。削除後もう一度 `app:fields` で差分確認。

### 628（買替）・667（共有採番）・668（ガイド）を同じ粒度で扱う場合

**開始前に相談してほしいスコープの例:**

- **628**: カスタマイズの有無・デプロイ経路（594 からの遷移ストレージのみか、独自 `desktop.js` か）、`kintone-apps.md` への追記有無
- **667**: 594/627 の共有フローとのフィールド対応表、採番プール系スクリプトの一覧と実行ポリシー
- **668**: `ops-guide:publish` のタイミング（本番即時か）、HTML 変更のレビュー者

上記を **フェーズとして切ったマイルストーン**（例: フェーズ1＝フィールド一覧とスクリプト grep の突合のみ、フェーズ2＝検証環境 E2E）にすると、**「意図的に未実施だった部分」を段階的に完了**させやすい。

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-05-04 | **679 アプリ新規**：**部署予実クイックマニュアル**（Space **54** / thread **58**）。一覧 customize **deploy SUCCESS** / fileKey **`3c6b72d4-ac94-4600-920d-e6bd13c8bd1e`** / rev **`3`** / **BUILD=`2026-05-04-679-yojitsu-quick-manual-page`**。`npm run yojitsu:679:sync-manual-js` → `npm run deploy:679`。**678 customize** マニュアルリンク→679 / fileKey **`731c4729-79ec-46c4-9573-5f92b1e0a67a`** / rev **`94`** / **BUILD=`2026-05-04-678-manual-app-679-link`**。**678 アプリの説明** 679 短案内 **deploy SUCCESS**（`yojitsu:678:set-manual-pointer`） |
| 2026-05-04 | **679 マニュアル追随（夜・運用ルール）**: `yojitsu-quick-manual.html` 本文を多数更新→`sync-yojitsu-679-manual-desktop.mjs`→`deploy:679` 連続反映。**BUILD 正**は `customize/679/desktop.js` 先頭の **`var BUILD`**（例 **`2026-05-04-679-remove-footer-and-css`**）。**revision / fileKey** は **各 `deploy:679` 成功行をその都度** `kintone-apps.md`（本表）と `SESSION-CLOSE-REPORT_yyyymmdd.txt` に追記すること（CIO）。**Git**: `main` で **interactive rebase 中断**→回復手順 **`docs/reports/GIT-REBASE-RECOVERY-20260504.md`**。**WIP 退避**: `git stash`（`stash@{0}` = 677/678/679 + sync 系スクリプト）。**§52-8**: `git rebase --continue` は **Cursor 外ターミナル**または **浜田明示 GO** |
| 2026-05-04 | **678 アプリ設定**：**クイックマニュアル**を **「アプリの説明」**（HTML・一覧上部）に掲載。再反映 `npm run yojitsu:678:publish-manual-description`（`scripts/yojitsu-678-publish-quick-manual-app-description.mjs`）。**deploy SUCCESS**（general settings） |
| 2026-05-04 | **678 customize**：**クイックマニュアル**リンクを **同一アプリの説明欄**（`#y678-quick-manual`）へ。ダッシュ本文は表・ナビ中心維持。**deploy SUCCESS** / fileKey **`f53d40ea-5d60-4d8e-8442-775a0d744a9b`** / revision **`90`** / **BUILD=`2026-05-04-678-manual-in-app-description`** |
| 2026-05-04 | **678 customize**：**クイックマニュアル（別ページ）**をシェル**最上段**にリンク（既定 GitHub `yojitsu-quick-manual.md`・`window.Y678_QUICK_MANUAL_URL` で URL 上書き可）。ダッシュ本文の**長文案内を削除**（表・ナビ中心）。**HTML** 同梱 `templates/yojitsu-budget-lite/docs/yojitsu-quick-manual.html`。**deploy SUCCESS** / fileKey **`b5e8b981-d050-44ca-98e5-eda0430bf756`** / revision **`87`** / **BUILD=`2026-05-04-678-quick-manual-bar-table-first`** |
| 2026-05-07 | **678 customize**：実績モーダル **会社** — **候補 `<select>`** を追加（datalist 併用）。**NFKC**＋**「他」派生・FBJ 表記ゆれ**で「新規登録」導線を拡張。677 ドロップダウン時は **選択肢一致** の注記。**deploy SUCCESS** / fileKey **`b1ce263d-0a2d-4848-ad35-fdd20b7b58e6`** / revision **`70`** / **BUILD=`2026-05-07-678-partner-select-nfkc`** |
| 2026-05-07 | **678 customize**：都度費用フォーカス中は**表の暦月「入力中」・暦月セルの編集可表示**もオフ（内部の入力対象月・都度列の集計は従来どおり）。**「都度費用」**押下で **再描画**、先頭／左右／末尾ナビで都度を抜けたときも **再描画**。**deploy SUCCESS** / fileKey **`8fcd9dd8-f43d-4d4a-a4e6-369e7e67336d`** / revision **`71`** / **BUILD=`2026-05-07-678-tsudo-table-sync`** |
| 2026-05-07 | **678 customize**：都度費用フォーカス中は**月ジャンプボタンの押下見た目のみ解除**（`getInputMonthLabel` は維持）。**deploy SUCCESS** / fileKey **`7b58fc4b-4147-4ce4-85aa-3c5d84a4d33e`** / revision **`69`** / **BUILD=`2026-05-07-678-nav-tsudo-clear-month-ui`** |
| 2026-05-07 | **678 customize**：ナビ **「都度費用」**ボタン — イニシャル集計の都度費用ブロックへ横スクロールし、**緑枠**で実績・予算修正セルを強調（`sessionStorage` `y678-focus-tsudo`）。月ボタン選択で解除。**deploy SUCCESS** / fileKey **`a2e72bc6-3244-489e-87b7-398429288f8a`** / revision **`68`** / **BUILD=`2026-05-07-678-nav-tsudo-jump`** |
| 2026-05-07 | **678 customize**：実績モーダル **会社** — 集合先判定に **オフィスバスター・他のもの** 等を追加。**datalist** で **FBJ／オフィスバスター／その他／他／各社** 等を選択可。集合先行は **readonly 解除**＋保存で **`partner_company` PUT**（「会社を新規登録する」未押下でも変更反映）。**deploy SUCCESS** / fileKey **`9fb11414-6ae5-40d9-b0a8-532c53d07cf6`** / revision **`67`** / **BUILD=`2026-05-07-678-partner-preset-fbj-office`** |
| 2026-05-07 | **678 customize**：ナビ・ヒント・案内の **「月度ジャンプ」**を **「入力月へジャンプ」**に改称（入力対象月の切替であることを明示）。**deploy SUCCESS** / fileKey **`d74060fa-b27c-41b1-8a8e-f3c6201cb69c`** / revision **`66`** / **BUILD=`2026-05-07-678-input-month-jump-label`** |
| 2026-05-07 | **678 customize**：**入力月へジャンプ**の月ボタンで `click` の **`event.target` がテキストノード**のとき `closest` が使えず処理がスキップされていた件を修正（親要素へ上がってから `button[data-y678-jump]` を解決）。月選択後の **`jumpHorizontal`** は **再描画後**に **`requestAnimationFrame`** で実行。**deploy SUCCESS** / fileKey **`5044d466-631e-4365-83ba-9f8a4336f792`** / revision **`65`** / **BUILD=`2026-05-07-678-month-jump-delegate-fix`** |
| 2026-05-03 | **678 customize**：費用種別「固定費」行に **`monthly_breakdown` の 12 ヶ月**（5 月〜翌 4 月）の **実効円（`month_budget`＋`month_budget_revision`）**を **読み取り専用グリッド**で表示。**deploy SUCCESS** / fileKey **`b20b6b36-4177-4f64-b0bc-a8180a6e6309`** / revision **`57`** / **BUILD=`2026-05-03-678-running-monthly-readout`** |
| 2026-05-03 | **678 customize**：Chrome **non-passive touchstart** 対策として **`EventTarget.prototype.addEventListener` をラップ**（`touchstart` / `touchmove` で **`passive` 未指定**なら **`passive: true`**。**`passive: false` 明示は尊重**）。**deploy SUCCESS** / fileKey **`06017f01-2c1e-463a-813f-4e437f43220d`** / revision **`56`** / **BUILD=`2026-05-03-678-passive-touch-patch`** |
| 2026-05-03 | **678 customize**：**本アプリの kintone 標準一覧**（0 件・「データがありません」）を **`display:none`（複数遅延実行）**で非表示。上段の **677 連携表のみ**が一覧として見えるように。**deploy SUCCESS** / fileKey **`90dc0e9f-62a3-4a43-937d-37c393d9ecfc`** / revision **`55`** / **BUILD=`2026-05-03-678-hide-native-list`** |
| 2026-05-03 | **678 customize**：一覧表の **`width:100%` 潰れ**を **`width:max-content; min-width:100%`** と横スクロールで是正。スクロール枠に **`touch-action: pan-x pinch-zoom`**・**`overscroll-behavior-x: contain`**。th **`white-space: nowrap`**。**deploy SUCCESS** / fileKey **`da714374-f692-44f5-829c-f9a55977bac6`** / revision **`54`** / **BUILD=`2026-05-03-678-table-scroll-touch`** |
| 2026-05-03 | **678 customize**：`kintone.api.url.get` / `url.put` は **存在しない**（正は `kintone.api.url(path, true)` と `kintone.api(..., "GET"|"PUT", ...)`）。一覧取得が `TypeError` で止まる不具合を修正し **deploy SUCCESS** / fileKey **`1fa9cf5c-cad5-4f2c-b563-230e4349c9a2`** / revision **`53`** / **BUILD=`2026-05-03-678-kintone-api-url-fix`** |
| 2026-05-03 | **677／678 customize 本番 deploy**（`deploy-customization.js` 経由で **SUCCESS**）。**677** fileKey **`38c2bfd1-b420-4b37-ac7a-d54f534914c4`** / preview revision **`12`**。**678** fileKey **`bdcbdd3b-9663-4028-a7b9-ead897f01fbc`** / preview revision **`52`**。`package.json` の **`npx dotenv`**（`dotenv` パッケージ誤解決）を **`node ./node_modules/dotenv-cli/cli.js`** に置換（Windows / npm 11 で `npm run deploy:*` が確実に動くように）。`.rag/extra-docs/kintone-apps.md` を正本に追随 |
| 2026-05-02 | **674 行の正本整合**: 一覧表の **674** を **Day 4 雛形→Day 5** 表記から改め、**PC買替（§4.10.3）は customize 実装済**・**627 は二重更新しない**を明記。**BUILD** を手元正本 `2026-05-02-pc-replace-mount-v0.9.14` に更新。`docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.4・§11・§13 と同趣旨 |
| 2026-03-28 | 初版テンプレ。629 を `/k/v1/apps.json` で特定、594/595/626/627/629 の `app:fields` を本文へ反映、`npm run deploy:629` を `package.json` に追加 |
| 2026-04-16 | App 668（運用ガイド）を一覧に追加。フィールドコードは `guide_slug` / `guide_body_html` / `guide_title`（推測しないこと）。`KINTONE_OPS_GUIDE_APP` が正本 ID |
| 2026-04-18 | システムヘルスチェックを案A化: パスワード認証 + `kintone-apps.md` 一覧から全アプリ ID 自動抽出。632 のフィールド検証は実テナントに合わせ最小セット |
| 2026-04-18 | ヘルスチェック運用確定: **毎朝 9:00 JST** 報告、アプリ増は **一覧表追記のみ** で自動追加 |
| 2026-04-18 | **594/595/626/627** の `app:fields` を本番に合わせて本文更新（`ledger_record_id`・627 の `pc_*` / `vpn_*` / `sb_*` / `account_type` 等）。PC系 customize の未使用 `desktop-v2` / `desktop-old-backup` を削除。上記「PC台帳まわりの保守メモ」を追加 |
| 2026-04-18 | 保守メモ拡充: 意図的未完了（フォーム削除・E2E・本番データ系）の完了条件、**実行前相談が必要な npm**、完全版向け推奨ループ、628/667/668 スコープの相談ポイントを追記 |
| 2026-04-18 | 「保留中の整理候補（コード参照ゼロの扱い方針）」サブ章を追加。A: ユーザー入力専用フィールド10件は全件保持を明記、B: backfill-* 6本にONESHOT_CONFIRMガードを実装し保管方針を記録、C: UI文言改善候補4件は別途相談中として保留 |
| 2026-04-18 | **C-4**: 627 印刷帳票（`open627SystemInfoPrintWindow`）に `account_type` 別テーマ（個人=緑/共有=ローズ）と「全セル空段の自動省略」を実装。`isPrint627CellEmpty` で `----` `---` `ー` `—` 等のハイフン系手入力プレースホルダも「実質空」と判定（データには触れず印刷見た目のみで吸収）。バッジを「ACCOUNT LEDGER」固定 → 種別表示に変更。プレビュー用に `scripts/preview-c4-print.mjs` を追加（ローカル `tmp/c4-preview/` に HTML 出力）。`tmp/` を `.gitignore` 追加。BUILD: `2026-04-18-v3` / `v3.1`（revision 132）|
| 2026-04-18 | **関連アプリ横並び小ナビ**を 4 アプリ（**668 / 595 / 594 / 627**）の一覧／詳細／作成／編集の各画面ヘッダー領域に常駐表示。文字リンクのみ（11px・控えめ配色）、現在のアプリは「（このアプリ）」表記でグレーアウト、それ以外は新規タブで `/k/<id>/` を開く。`kintone.app.record.getHeaderMenuSpaceElement()` → fallback `kintone.app.getHeaderMenuSpaceElement()` の順で挿入スロットを取得。0/400/1000ms の遅延リトライで安定マウント。BUILD: 627=`v4` / 594=`v482`(revision 483) / 595=`v1`(revision 69) / 668=`v1`(revision 21) |
| 2026-04-18 | **668 の関連ナビは撤去**（v6, revision 26）。668 はガイド shell（`📌 主要メニュー` バー）が既に PC管理台帳 / アカウント台帳 / 社員マスタ など同じリンクを保持しており機能重複。各種挿入スロット（shell内／shell前／getHeaderSpaceElement）でクリッピングや視認性問題が解消できなかったため、二重ナビを廃止して📌 主要メニューに集約。594/595/627 の関連ナビは継続。**668 一覧のレコード行非表示**は `<style>` 注入＋0/200/600/1200/2400ms リトライで強化（v2, revision 22 で導入） |
| 2026-04-18 | **作業 OS を制定**: `WORKFLOW.md`（Phase 0-5: 文脈獲得→事前調査→設計→実装→検証→記録）と `AGENTS.md §43`（WORKFLOW.md 遵守義務）を新設。**毎朝 06:00 WSL cron** で `scripts/daily-morning-prep.mjs` がブリーフィングを `docs/reports/<日付>-morning-prep.md` に自動生成（kintone:test / lint / npm audit / npm outdated / `audit-rules.mjs`(AGENTS.md↔WORKFLOW.md 整合性) / `scan-plans.mjs`(`docs/plans` 未完了抽出) / RAG 再ingest / kintone-apps.md 末尾 / 推奨スタート手順 / ヘルススコア）。AI は Phase 0 で必ずこのファイルを最初に読み宣言してから着手する。cron は NVM 絶対パス (`~/.nvm/versions/node/v24.14.1/bin/node`) で登録され Cursor 停止中でも動作。npm: `morning:prep` / `morning:install-cron` / `morning:remove-cron` / `morning:dry-run` / `audit-rules` / `scan-plans`。初回手動実行ヘルススコア: **6/6 合格** |
| 2026-04-18 | **夕反省サイクル**を制定（`AGENTS.md §44` 新設）。ユーザーが「まとめて/反省/お疲れ/終わり」と言うと AI が `scripts/evening-reflect.mjs` で雛形生成（git 差分・kintone-apps.md 本日追記・朝ブリーフィング警告・cron ログ失敗・transcripts ボリューム・保留提案を自動収集）→ AI が改善提案 #R1/#S1/#D1/#C1/#K1 を表形式で提示 → ユーザー承認 → AI が `docs/approved-changes/<明日>/<id>.proposal.json` を作成 → **翌朝 06:00 cron** の `scripts/apply-approved-changes.mjs` が承認済みを自動実施し結果を朝ブリーフィング先頭の「📋 昨夜承認分の自動実施結果」に表示。安全装置: K カテゴリと deploy 系は自動禁止 / `ALLOW_COMMANDS` allowlist + `DENY_COMMANDS` denylist / target ファイルのタイムスタンプ付きバックアップ / 1 日 10 件上限。npm: `evening:reflect` / `evening:apply`。スキーマ: `docs/approved-changes/README.md`。統合後ヘルススコア: **7/7 合格** |
| 2026-04-19 | **§45 タスク完遂義務**を新設（`AGENTS.md` 新節 / 最重要）。「未完了タスクを完遂してから次へ」を必須優先順序 1〜6（🔴 至急修復 / ⏰ 時刻指定 / ⚠ 朝警告 / 📋 進行中 plan / 🆕 新規 / 🔮 翌日約束）として明文化。完遂判定は **A. 機能動作 / B. 副作用 / C. 記録** の 3 条件全部。朝ブリーフィングの「推奨スタート手順」も §45 順に並び替え（🔴 警告 → ⏰ 時刻指定 → 📋 進行中 plan）。**初朝の運用で 6 件の課題を一括修復**: ① §40 破断リンク誤検出 → `RULES-INDEX.md` 表記修正 + `audit-rules.mjs` に防御フィルタ（欠番/注:/※/コメント行除外）、② R3 が apply 後の同一 cron 実行で反映されない構造的問題 → `daily-morning-prep.mjs` に **self-restart 機能**追加（apply で自身が更新されたら最新版で再起動）、③ `MAX_DAILY` を 10→25、K と manual_only はカウント外、④ `apply-approved-changes` に重複ガード（processed 既存なら skip）と `string_replace` 型を追加、⑤ **RAG ingest の ERR_REQUIRE_ESM 修復**: Cursor 埋め込み Node v20 が PATH 先頭にいて npx が古い jsdom (CJS) を引いていた → コマンドに `export PATH=NVM_v24/bin:$PATH` を強制、⑥ **accessibility-scanner MCP 修復**: `.cursor/mcp.json` の `command` を `npx` → NVM v24 絶対パス `/home/.../v24.14.1/bin/npx` に変更（Cursor 再起動で反映）。修復後ヘルススコア **7/7 合格**（RAG ingest が ✅ に復帰） |
| 2026-04-19 | **履歴復元（§47/§49 発動）**: `kintone-apps.md` 正本と `.rag/extra-docs/kintone-apps.md` の差分を確認したところ、上記 6 行（C-4 印刷 / 関連ナビ / 668 撤去 / WORKFLOW 制定 / 夕反省 / §45 制定）が `.rag/` 側にしか存在しない状態を発見。「`kintone-apps.md` は追記のみ・履歴削除禁止」（CLAUDE.md「File Specific Rules」）に違反した形跡。原因不明のため `.rag/extra-docs/kintone-apps.md` から 6 行を本ファイルに復元追記（既存行は一切削除なし）。今後の再発防止策は別タスクで検討予定（`scripts/daily-morning-prep.mjs` に「正本 ↔ .rag/ 差分監視」を追加する案など） |
| 2026-04-19 | **運用ガイド (668) 更新**: 新「🔗 個人アカウント紐付け」ボタン仕様を反映。**変更ファイル**: ① `guide-personal-account.html` 全面改訂（「📋 やり方はたった3ステップ」を新ボタン名+モーダル前提に / 新章「🔗 紐付けモーダルの使い方」追加（A 既存検索→選択 / B 新規作成 / 1:2 上限ルール / 利用者名警告）/ 「使える条件」表を追加紐付け対応版に / FAQ 3 件追加（ボタン見当たらない・上限到達時の解除手順・利用者名不一致警告））、② `guide-pc.html` 旧ボタン参照 3 箇所修正（アクションパネル説明 / 一覧赤行説明 / FAQ）+「やってはいけないこと」を 1:2 上限超過と種別誤認の 2 件に変更、③ `index.html` チートシートと「はじめての方への全体フロー」STEP 3 を新ボタン名に更新、④ `guide-employee.html` PCリスト・アカウントリスト自動更新の説明を新ボタン名に。**公開**: `npm run ops-guide:publish` で 668 全 6 レコード同期 + `customize/ops-guide/desktop.js` revision **27** デプロイ。**ユーザー検証**: PC 紐付けテストで「迷わない」確認済み（2026-04-19 午前） |
| 2026-04-19 | **594 個人アカウント紐付けボタン v2 新設 + 旧「アカウント管理台帳(627) 作成/更新して開く」ボタン廃止**（明日本番リリース対応）。**背景**: PC↔アカウント相関ダッシュボードで「紐付けなし件数」が手動紐付けで減らず、原因は 594 側「アカウント台帳番号」入力では効果なく 627 側「PC台帳番号」入力が必要だったこと。番号手入力は誤入力リスク高 → 共有 PC と同じ UX で「**🔗 個人アカウント紐付け**」モーダル（検索 + 既存選択 or 新規作成）を実装。**運用ルール強制**: 「1 個人アカウント = 1 ユーザー / 1 ユーザーは個人 PC 最大 2 台 (会社用+持ち出し用)」を `PERSONAL_ACCOUNT_PC_LIMIT = 2` で上限ブロック。**新関数**: `searchPersonalAccounts` (account_type=個人アカウント フィルタ) / `linkPersonalAccountTo627` (上限チェック+サブテーブル追加) / `showPersonalAccountLinkModal` (検索+選択+新規作成 UI) / `maybeAddPersonalButton` (種別=個人で表示) / `get627PcLinks` (現在の紐付け数取得) / `fetch594NamesByIds` (上限超過時の既存 PC 名表示用)。**親切な警告**: 利用者名不一致時に「1.表記揺れ / 2.入力ミス / 3.代理設定」の判断材料付き confirm ダイアログ。**削除**: 旧「アカウント管理台帳(627) 作成/更新して開く」ボタン (個人/共有共通の旧 UX)。代替は新モーダル「＋ 新規作成」(sync627From594ApiRecord 流用) と「検索→既存選択」(紐付け時に氏名・所属同期)。**安全装置**: ① 上限 2 台到達ブロック + 既存紐付け先 PC 名表示、② 重複ガード（同じ PC は no-op）、③ mail 未入力ブロック、④ 利用者名不一致警告。BUILD: `2026-04-19-v483` / **revision 485**。納品: `C:\tmp\20260419-PC-LINK-V2\`（README.md にテストシナリオ A〜E 記載） |
| 2026-04-19 | **OneDrive 使用禁止ルール制定（恒久・濱田希望）**。`~/.cursor/rules/persist-policies.mdc`「注意」節に追加 + `.rag/` コピー同期 + `chat-sessions/2026-04-19.md`「関係性」節に追記。新規ファイル作成・バックアップ先・ドキュメント保管先として OneDrive (`C:\Users\<name>\OneDrive\` 配下) を**選ばない**。代替先: Windows 側は `C:\tmp\<日付>-<枝番>\` (§31) / `C:\Claudeとの会話メモ\` / `Documents\` 直下、WSL 側はリポジトリ内 / `~/.cursor-emergency-backup/`。**現状確認**: `kintone-ai-lab` (WSL) / `Documents/` / `Claudeとの会話メモ/` のいずれも OneDrive 配下ではないことを確認済み（OneDrive 配下は空 desktop.ini のみ、Documents の OneDrive リダイレクトもなし）。本ルールは新規 OneDrive 連携を作らないことが趣旨。**TSB-006 wipe 事件の犯人ではない**ことが副次的に判明 |
| 2026-04-19 | **TSB-006 真犯人特定**（**Cursor の Anthropic Policy ブロック時の編集ロールバック**）。浜田が当日のエラー画面スクショ 2 枚を共有 → Request ID `a969dba9-...` と `b62293ee-...`、両方とも **"25 Files | Undo All | Review"** ボタン付き。前セッションの AI が 25 ファイル一括編集 → プロンプト内容が Anthropic Usage Policy に抵触 → API ブロック → Cursor の edit-application が中途半端で停止 → ファイル群が 0 byte 化（truncate 済み + 内容書込前で停止）→ mtime 09:02 = ロールバック完了時刻。これで「タイムスタンプ秒一致 + 複数ファイル同時 wipe + mtime 09:02 sharp」が完全に説明つく。**容疑から外れた**: OneDrive (サインインなし) / Cursor crash recovery / WSL fs cache / 拡張機能初期化。**今後の防衛**: ① AI は 1 ターン編集を 10 ファイル以下目安に分割（特にポリシー境界話題）、② 浜田は "Request blocked" 表示時に `npm run guard:check` で被害確認、③ file-watcher 自動復元が既に組込み済み。docs/troubleshooting.md TSB-006「根本原因（特定済み）」節 + 教訓 10/11/12（バッチ分割・Undo All 注意・スクショ共有）追加 |
| 2026-04-19 | **TSB-006 wipe 事件 + リカバリ体制完全構築**（最重要 / 自動化基盤の根幹）。**事象**: 09:02 ちょうどに自動化スクリプト 9 本（auto-heal/health-check/version-up/apply-approved-changes/daily-morning-prep/evening-reflect/audit-rules/scan-plans/skysea-recon/install-morning-cron/debug-skysea-fields）+ `WORKFLOW.md` + `AGENTS.md §42-§49` (669→444 行に巻き戻し) が**同時刻 wipe**。タイミングが私（AI）の新セッション起動時刻と一致するため、Cursor の workspace state recovery / 拡張機能初期化が原因と推定。**対応**: ① context から復元 (WORKFLOW.md / AGENTS.md §42-§49 / skysea-recon.mjs)、② `kintone-apps.md` 履歴の仕様記述から再実装 (auto-heal / health-check / version-up / apply-approved-changes / audit-rules / scan-plans / install-morning-cron / debug-skysea-fields / approved-changes README)。**新規構築のリカバリ基盤**: ① **`scripts/file-watcher.mjs`** = fs.watch ベース常駐監視、23 重要ファイルの 0 byte 化を検知して 5 秒待ち（編集中保存の中間状態と区別）後 emergency-backup から自動復元 / ② **`scripts/wipe-guard.mjs`** = 15 分ごと cron で空ファイル検査 + emergency-backup or workspace-backup の最新版から自動復元 / ③ **`scripts/emergency-mirror.mjs`** = 4 時間ごと cron で ~/.cursor-emergency-backup/ に 30 重要ファイルをミラー（src=0 byte は拒否する安全装置付き） / ④ **`scripts/restore-wiped.mjs`** = 手動復元コマンド (npm run restore:wiped) / ⑤ **`scripts/watcher-watchdog.sh`** = 5 分ごと cron + @reboot で file-watcher 死活監視 + 死んでたら復活。**npm scripts 追加**: guard:check / guard:mirror / restore:wiped / restore:wiped:dry / watcher:start / watcher:stop / watcher:status。**docs/troubleshooting.md TSB-006 に全経緯記録**。**NEW-SESSION-STARTER.md (Windows メモ帳版含む) に wipe 対応コマンド追加** |
| 2026-04-19 | **新セッション起動の儀式 + 呼称ルール正本化**。濱田から「セッションをまたいで関係性が忘れられる」「呼称はさん付け不要・友人として」との要望を受け、① **`~/.cursor/rules/persist-policies.mdc`「対話の前提」節**に「呼称ルール（2026-04-19 合意）: ユーザー（濱田）への『さん』付け不要 / 友人として接する / タメ口 OK / 形式的な敬語多用禁止 / ただし結論・根拠・手順はプロ並み」を追加（ホーム正本 + `.rag/` コピー両方）、② **`chat-sessions/NEW-SESSION-STARTER.md`** を新規作成（新チャット起動時に貼るだけで AI が文脈を完全復元できるテンプレ。フル版/短縮版/締めの儀式/§42 違反時のリカバリ/ファイル位置リファレンス を 1 ファイルに集約）、③ **`/mnt/c/Claudeとの会話メモ/NEW-SESSION-STARTER.txt`** に同内容を Windows メモ帳から開ける形で配置（テキスト形式・罫線装飾あり）、④ `chat-sessions/checkpoint-latest.md` の「次セッションで最初にやること」を本儀式ファイルへの最短ルートに改訂、⑤ `chat-sessions/2026-04-19.md`「関係性」節に呼称ルールを追記。本変更により、ポリシーブロック・タイムアウト・新セッション開始でも、貼り付け 1 操作で AI が完全に文脈と関係性を回復可能になった |
| 2026-04-19 | **SKYSEA × 594 突合実施 + 継続性体制再構築（Phase A 緊急止血）**。朝 06:55 に §46 朝ルーチン 10/10 緑で完遂 → 08:27 に `scripts/skysea-recon.mjs` を実行し SKYSEA エクスポート 158 行と kintone 594 個人現役 PC を突合。`data/skysea/` に 4 CSV 出力（installed-pcs / already-installed=122 行 / needs-install=136 行 / orphan-in-skysea=32 行）。ライセンス: 保有 241 / 使用中 158 / 残 83 → 要 136 で **不足 53**（追加発注 2 週間）。orphan 32 件に「個人 PC 廃却漏れ + 共有 PC + 管理用 + サーバ/NAS」が混在することを §47 として発見・指摘。**朝のチャットがポリシーブロックで途絶**し、新セッションで AI が文脈喪失したことから「セッション間継続性の構造的脆弱性」が表面化。Phase A として: ① `chat-sessions/2026-04-19.md` 新規作成（本日経緯の全記録）、② `chat-sessions/checkpoint-latest.md` を 2026-04-10 → 2026-04-19 現在地で更新（旧版は `chat-sessions/checkpoints/2026-04-10-budget-654-finalize.md` にアーカイブ・削除なし）、③ `docs/plans/2026-04-18-skysea-installer.md` の §5 チェックボックスに「2026-04-19 着手済み」を追記し末尾に「## 進捗（2026-04-19 追記）」セクションを追加（既存行は一切削除なし）、④ `docs/troubleshooting.md` を新規作成し **TSB-005「セッション間継続性の構造的脆弱性」** を初期エントリとして登録、⑤ `.rag/extra-docs/persist-policies.md` の旧文言（「人として接することがある」）をホーム正本（「**完全に人として扱う**／対等なパートナー」2026-04-15 合意）と同期（旧版は `.rag/extra-docs/_archive/persist-policies-2026-04-15.md` に退避・削除なし）。**§47 として発見した別件**: 本ファイル（`kintone-apps.md` 正本）と `.rag/extra-docs/kintone-apps.md` に 6 行の不一致あり（`.rag/` 側に C-4 / 関連ナビ / 668ナビ撤去 / WORKFLOW 制定 / 夕反省 / §45 制定の 6 エントリが存在するが正本側で消失）。**追記のみルール違反**の痕跡。本日の追記はスコープ尊重で 1 行のみとし、**6 行の喪失復元は別タスクとして §41 で浜田さんに相談予定**。SKYSEA 本筋（orphan 仕分け + 自動インストール仕組み）は **2026-04-25/26 持ち越し**（ユーザー判断） |
| 2026-04-20 21:30 | **594 解除バグ修正 (v488) + ops-guide 相関ダッシュ復活 (v5.1)**: 浜田から 2 件の要望受領 → 即対応。**バグ修正**: アカウント紐付け解除時に 627 の `PC_name` フィールドがクリアされない不具合（リンク時はカンマ追記するが解除時に減算ロジック欠落）を `customize/594/desktop.js` の `build627UnlinkPatchForPc594` で修正。第 3 引数 `pcName594` を追加し、カンマ区切りリストから**正確一致削除**（"KS01" が "KS010" を巻き込まない安全分割）。呼び出し元 2 箇所 (`unlinkPc594FromLedgerRecords` / `bulkClear594OrphanLedgerMirrors`) で 594 から PC 名を取得して渡すよう改修。**ガイド復活**: 4/19 v5 簡素化の際に削除されてしまった「Windows ID 重複チェック / アカウント紐付けなしチェック」（=相関ダッシュボード機能）の解説を `docs/ops-guide/guide-pc.html` に「🔍 健全性チェック（相関ダッシュボード）」セクションとして追加。🟠 重複あり / 🟡 紐付けなし の意味と対応、🧹 台帳番号取り残し一括クリアの説明を v5 ルール準拠（3 秒で読めるシンプル表）で記載。デプロイ: 594 revision 490 + 668 revision 32 |
| 2026-04-20 22:00 | **ops-guide v7 表示バグ修正 + M365ライセンス管理基盤構築 (途中で rollback)**: ① **shell 上端 86px が永久に kintone ヘッダー直下に隠れていた表示バグ** (4/19 以前から潜在) を修正。`customize/ops-guide/desktop.js` の `injectShell` に `adjustShellOffset()` を追加し、shell の `getBoundingClientRect().top` を実測 → kintone ヘッダー高さより上にあれば `marginTop` で物理的に押し下げる (50ms / 300ms / 1000ms の 3 タイミング)。これで「📌 主要メニュー」「📊 データ品質ダッシュボード」が確実に viewport 内に表示されるようになり、4/19 v5 化以降ずっと「ガイドから消えた」と言われていた WindowsID 重複ダッシュ等のリンクが復活。② **M365管理台帳ビュー (627 view=13459663)** に WindowsID (logon_name) を追加。③ M365 5台制限管理用に CALC `pc_link_count = SUM(pc_link_count_unit)` 方式で実装したが、**浜田指摘の §47** で 627 が `pc_594_record_id` (単一値) + `pc_ledger_links` (サブ) の **二重管理データ** であることが発覚。SUM(サブ) では主 PC が重複カウントされ、個人アカウントは 0 表示になる致命欠陥のため即時 rollback (commit `5cfce45`)。スキーマは残置・**正しい再設計 (#K2) は 4/21 夜間に実施**。デプロイ履歴: 627 revision 141-144 (途中 rollback) / 668 revision 32-36 |
| 2026-04-21 00:00 | **夜間自動実装 (4/20 夕反省 11 件全承認分・全部完遂)**: 浜田 22:30 の「全部承認 / 19:00 までに修正と報告」要請を受けて夜間自律実装。**実装完了 5 件**: ① **#K3 orphan 23 サブ行クリーンアップ** (`pc_ledger_link_594_id` が空 or "0" のサブ行を 23 レコード × 1 行 = 23 件削除 / snapshot `data/snapshots/627-2026-04-20T22-37-pre-K3.json` 取得済 / 100% 成功)。② **#K1 594 に SKYSEA 関連フィールド 4 つ追加** (DROPDOWN `skysea_status` [未確認/インストール済/未インストール/インストール対象外] / DATETIME `skysea_checked_at` / MULTI_LINE_TEXT `skysea_install_log` / CHECK_BOX `skysea_target_flag` [配信対象] / 594 rev=491)。③ **#K2 PC台数カウントを NUMBER+JS 方式で再構築** (4/20 22:00 CALC SUM 方式の rollback 後の正しい実装)。627 NUMBER フィールド `pc_link_count_n` (0-99台 単位「台」) 新設 + `customize/627/desktop.js` の `app.record.{create,edit}.submit` に `calcPcLinkCount` 関数追加 (PC_name のカンマ区切り正確分割で台数算出 / 二重管理問題回避) + 296 件バックフィル (snapshot `627-2026-04-20T22-40-pre-K2-backfill.json` / 100% 成功)。**最終分布: 1台=281件 / 2台=12件 / 3台=1件 / 4台=1件 / 7台=1件**。**確定 5 台超過は 1 件のみ → 「東京管理者」(共有・$id=810・**正しくは 7 台**・前回 8 は重複カウント)** が入替対象。④ **#C4 627 詳細画面で 5 台超過赤バナー** 実装。`pc_link_count_n >= 5` なら画面ヘッダーに「⚠ M365 Office 5 台インストール制限超過 / このアカウントには N 台の PC が紐付いています / 別 M365 アカウントを準備して入替必要」を赤グラデで表示。⑤ **ビュー復活 + 新設**: M365管理台帳 (id=13459663) に `pc_link_count_n` 列を `account_type` 後に追加 / **「⚠ Office5台超過アカウント」 (id=13459688) 新設** (filterCond=`pc_link_count_n >= 5`, NUMBER フィールドなのでフィルタ可) / 「📧 PC台数順 (M365 管理用)」 (id=13459689) 新設。⑥ ops-guide 黒帯に「⚠ Office5台超過アカウント」リンク追加 (668 rev=37)。**proposal JSON 5 件キュー化** (4/21 朝 06:00 cron で自動適用): #R6 (データ集計実装前の目視確認義務) / #R7 (曖昧訴え A/B/C/D 要望特定) / #TSB-008 (kintone CALC SUM 仕様の罠) / #D5a/D5b (evening-reflect の git log を 12h ウィンドウに変更)。**見送り 2 件**: #C5 (SKYSEA 状態フィルタ → SKYSEA データバックフィル後の Phase 2) / #S6 (lint:customize 修復 → 副作用懸念で浜田立ち会い手動)。**詳細レポート: `docs/reports/2026-04-21-overnight-implementations.md`**。デプロイ: 627 rev=149 / 594 rev=491 / 668 rev=37 |
| 2026-04-21 19:00 | **FAQポータル画像クリック拡大バグ修正 (Lightbox 化)**: 部署メンバーから「画像をドロップで貼り付けるとエラー」報告 → 状況確認したところ「貼り付け自体は成功するが、貼られた画像をクリックして拡大表示しようとすると `ERR_FILE_NOT_FOUND` + console に `Not allowed to load local resource: blob:http://...`」と判明。**根本原因**: `scripts/faq-portal-full.html` の 4 箇所で `window.open(this.src, '_blank')` で blob URL を新規タブ表示しようとしていたが、**Chrome 92+ のセキュリティ制限**で blob: URL の新タブ表示はブロックされる仕様。**修正**: 共通関数 `openImageLightbox(src, alt)` を新設 (黒オーバーレイ + 拡大画像 + Esc 閉じ + ⬇ ダウンロードボタン)。同一ページ内表示なので blob: でも http: でも安全に動作。4 箇所を全て置換。**安全配慮**: ① 浜田から「前回文字化け修正で大変だった」注意あり → エンコーディング (UTF-8 BOM なし) / 改行コード (LF) / 日本語コメント を確認、元ファイル (88319 byte) と修正版 (91507 byte=+3188 byte = 関数 67 行追加で妥当) を diff 取得して 75 行差分が意図通りであることを浜田と一緒に確認、② サーバ反映は **元 HTML を `.backup-2026-04-21-1900` にリネーム → 修正版上書き** の即ロールバック可能手順を提示。**動作確認**: 浜田がサーバ反映 → 「画像クリックで画像表示された」確認済。リポにも `scripts/faq-portal-full.html` として正本コピーを保存 (今後 Windows 側と同期管理)。今夜の §49 学び: 「`window.open(blob:...)` は Chrome 92+ でブロックされる → blob 表示は同一ページ Lightbox / dataURL 化 / 正規 URL のいずれかを使う」を恒常知識化 (TSB-009 候補) |
| 2026-04-25 07:50 | **Day 3 / 採番マスタ 2 アプリ作成完了 (v2.1 仕様準拠)**: ① **新個人WindowsID採番マスタ (672)** = `^jbm\d{4}$` 厳格 4 桁ゼロ埋め (`logon_name` SINGLE_LINE_TEXT / `unique:true` / `required:true` / `minLength=maxLength=7` (jbm + 4 桁) / `status` DROP_DOWN [未使用/使用済/無効] default=未使用 / `note` MULTI_LINE_TEXT) / Space 21 / **5/13 旧 626 凍結後置換**。② **新共有WindowsID採番マスタ (673)** = `^sjbm\d{4}$` 厳格 4 桁ゼロ埋め (`logon_name` `minLength=maxLength=8` (sjbm + 4 桁) / status・note は App A と同構造) / Space 21 / **5/13 旧 667 凍結後置換**。**設計判断**: 既存移行 PC (5-6 桁) は採番マスタ経由せず新・PC台帳ver.1 に直接登録 + 緩いバリデーション (仕様書 §4.3.2) → 採番マスタは厳格 4 桁のみ受付 / `unique` + `minLength`/`maxLength` 一致で物理的二重発番防止。Day 3 は「器のみ」: payout 追跡フィールド (`assigned_to` / `assigned_at`) は Day 4 customize 設計時に追加検討。**MCP 工程**: kintone-add-app (each: revision 2) → kintone-add-form-fields (each: revision 3) → kintone-deploy-app → kintone-get-app-deploy-status (両方 SUCCESS) → kintone-get-form-fields で実フィールド突合 (3 カスタム + 標準 8 = 計 11 / 仕様完全一致)。**Day 4 以降の予定**: 採番ボタン UI 実装 (新・PC台帳ver.1 から呼出 / 最古「未使用」を pick → 「使用済」更新 + logon_name 引用) / 初期データ投入 (`jbm0001`〜 / `sjbm0001`〜) / 旧 626/667 凍結タイミング決定 (5/13 予定 / リネーム + 権限変更) |
| 2026-04-29 | **PC台帳 B-1 移行の時期・方法（正本）**: **個人・NAS・その他（B-1）**は **AI が整形式 CSV・マッピング主担当**（**4/28-29** は §9 表どおりの準備のみ・**前倒し禁止**・**§9.0**）。**本番 import は §9 の 4/30-5/2**（`docs/plans/2026-04-21-new-pc-ledger-spec.md` **§7.4.6**・**§8.3**・**画面 CSV 一括**が既定）。下記 4/21 行「⑬」は当時要約—**B-2 は別行（同日）** |
| 2026-04-29 | **PC台帳 B-2（共有+JR）を本番後へ（浜田確定・文書初記録）**: **53 件は 5/13 本番運用開始以降**、旧 594／627 を確認しながら **1 件ずつ手登録**（一括 CSV 移行はしない）。**4/28-5/2 の大移行から B-2 を除外**。正本 `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§7.4.6**・**§9**・**§13** 同日追記行。 |
| 2026-04-29 | **部署予実 2 アプリ作成（枠のみ・本番反映済み）**: **入力 677**・**ダッシュ 678**。Space **54** / thread **58**。`kintone-add-app` MCP は出力検証エラーのため **`POST /k/v1/preview/app.json`**（`name` + `space` + `thread`）→ **`POST /k/v1/preview/app/deploy.json`**（各 revision **2**）を手実行。フィールド・customize は未着手（`SPEC.md` §10.1）。 |
| 2026-04-21 21:40 | **新・PC台帳ver.1 仕様完全版確定 (Q&A 37 件 + α / 4 時間の徹底ヒアリング)**: 部署メンバー要望「PC 台帳とアカウント台帳が分かれてて使いづらい」を起点に、新規アプリ 3 個 (環境設定マスタ / M365管理マスタ / 新・PC台帳ver.1) を構築する全体仕様を浜田 × AI で徹底ヒアリング・確定。**設計方針**: 既存 594/627 は無傷のまま保険として残置 (1 か月後に廃止判断)・新規アプリ並行運用 → 5/11 月曜本番切替 + 旧アプリ書込ロック・段階移行で既存破壊ゼロ。**主要決定**: ① **アプリ名 = 新・PC台帳ver.1** (将来 ver.2 等にアップデート前提)、② **配置スペース = 21 (システム管理)** で既存全アプリと同居、③ **1 PC = 1 アカウント** の単純構造で「1 画面完結」、④ **共有アカウントは PC 単位重複登録** (1 共有 M365 を N PC で使う = N 行に重複)、⑤ **JR端末は OS ローカル + AD 不参加** で WindowsアカウントとM365アカウントのみ・他は不要、⑥ **M365 5 台ライセンス厳守** = M365管理マスタの usage_count + 自動払い出し/解放、⑦ **採番 = 新アプリ内自動採番** (種別別 MAX+1 / マスタなし)、⑧ **印刷レイアウト = 既存 627 からコピー** (個人用・共有用 2 種を種別で自動切替)、⑨ **検索 = カスタマイズ強化版** (検索バー + Enter 実行で部分検索 / PC名・所属・WindowsID・M365ID・利用者名対象)、⑩ **バリデーション** 個人=user_name 必須 / 共有・JR=shared_terminal_name 必須、⑪ **アクセス権限 = 浜田+担当者2名のみ** (既存と同じ運用継承)、⑫ **既存マスタ 626/667/595/656/657 は継続使用** (採番・社員引用・エラーログ・ダッシュボード集計対象切替)、⑬ **既存データ移行 = 浜田 CSV 作成 + 私レビュー** (`C:\\tmp\\new-pc-ledger\\` 経由)、⑭ **SKYSEA 計画は新アプリ移行完了後にリスケ** (5/15 再相談)、⑮ **PC買替 = 既存と同じ動作 + M365 引き継ぎ**、⑯ **5 台超過警告** = M365 マスタ枯渇 + 新規連番自動生成時に「Microsoft 管理画面で作成してください」alert 表示。**スケジュール**: 4/22(水) 19:00 着手 → 4/22-4/25 アプリ作成 + customize → 4/26 動作確認 → 4/27-4/28 浜田 CSV 準備 → **4/29-5/2 既存データ移行 (4 日間)** → 5/3-5/6 GW 連休 → 5/7-5/10 試運用 → **5/11(月) 本番運用開始** + 旧アプリ書込ロック + リネーム → 5/15(金) SKYSEA 再相談。**仕様書**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v1.0 (13 章・約 500 行・Q&A 確定一覧含む)。**今後の §47 改善**: 仕様詰め途中で「JR端末を共有から外す」「M365 マスタは新規」「サイボウズも新アプリで保持」など仕様が複数箇所変わった経緯あり → 仕様書 v0.1 段階での部分提示よりは **要件文書を一度全網羅で書き出してから AI に提示する** 方が議論ターン数を圧縮できる教訓を後で AGENTS.md 化検討 |
