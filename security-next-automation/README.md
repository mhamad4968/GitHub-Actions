# Security NEXT → kintone 自動収集・週次要約

ブラウザ不要の Node.js（TypeScript）スクリプトと GitHub Actions で、[Security NEXT](https://www.security-next.com/) の RSS（既定: `https://www.security-next.com/feed`）を **Security NEXT ニュース** アプリに登録し、週次ジョブで LLM がまとめた **今週の傾向と対策** を **ニュース週次要約** アプリ（週次レポート専用）へ投稿します。  
フロントエンド（React 等）は使いません（React 19 以降の UI 要件は別プロジェクト向け）。

**設計図（CSV）・手順**  
- ニュース保存: [`docs/security-next-news-app-design.csv`](docs/security-next-news-app-design.csv) / [`docs/kintone-app-creation-steps.md`](docs/kintone-app-creation-steps.md)  
- **ニュース週次要約（週次レポート）**: [`docs/security-next-weekly-report-app-design.csv`](docs/security-next-weekly-report-app-design.csv) / [`docs/kintone-weekly-report-app-creation-steps.md`](docs/kintone-weekly-report-app-creation-steps.md)

### 運用スケジュールと内容（確定・2026-03）

| タイミング | 内容 |
|------------|------|
| **毎日 10:00 / 17:00（JST）** | `daily-collect.yml` → `collect.ts`。RSS から未登録候補を **高度キーワード**で選別（Gemini 不使用）。事件性（国内・重大）＋世界的重大警告語を含み、**予防・管理**語（パッチ・アドバイザリ・**リリース**等）を含まないものを、公開日の新しい順に最大 **3 件**をアプリ **631** へ保存。 |
| **毎週金曜 17:00（JST）** | `main.yml` の `security-next-kintone` → `analyze.ts`（`cron: 0 8 * * 5` = 金曜 08:00 UTC）。その週の **631** のニュースを振り返り、傾向と対策を **632**（`weekly_trend`）へ投稿。 |

**動作確認の目安**: 日次実行後、**631** にキーワードに合致した記事が追加されていれば意図どおり（完全一致ではないため、必要に応じてキーワード一覧を `collect.ts` で調整）。重要事故の**即時**通知が必要なら、kintone の通知設定や Webhook 連係（`NOTIFY_WEBHOOK_URL` / `NOTIFY_SUMMARY_WEBHOOK_URL`）の拡張を検討。

## kintone アプリの作り方（フィールド具体設定）

**スペース 48 に自動作成**（管理者 `.env` が必要。**API トークンだけではアプリ新規作成はできません**）:

- **ニュース＋レポートをまとめて作る**場合:

```bash
cd /path/to/kintone-ai-lab
npm run setup:security-next-apps
```

- **週次要約用レポートアプリだけ足す**場合（ニュースは既存 630/631 を使う運用向け）:

```bash
cd /path/to/kintone-ai-lab
npm run setup:security-next-report-app
```

いずれも既定スペース ID は **48**。変えるときは `KINTONE_SECURITY_NEXT_SPACE_ID`。

完了後、ターミナルに出た ID を `security-next-automation/.env` / GitHub Secrets の `KINTONE_APP_ID` / `KINTONE_REPORT_APP_ID` にコピーし、API トークンに **参照中のニュースアプリ＋レポートアプリ** の権限を付与する。

---

**手動作成する場合**: スペース `https://jbis-kintone.cybozu.com/k/#/space/48` 内に次の 2 アプリを作成し、**フィールドコードを下表どおり**にしてください（REST API ではフィールドコードのみが鍵です）。

### アプリ A: Security NEXT ニュース

| 画面のフィールド名 | フィールドコード（必須・この名前） | 種類 | 必須 | その他 |
|-------------------|-----------------------------------|------|------|--------|
| タイトル | `title` | 文字列（1行） | 推奨 | — |
| URL | `article_url` | 文字列（1行） | 推奨 | **重複禁止**推奨（重複判定に使用） |
| 公開日 | `published_date` | **日付** | 任意 | RSS の公開日を JST で日付のみ投入 |
| 概要 | `summary` | 文字列（複数行） | 任意 | RSS 抜粋を `collect` が投入 |
| 要約 | `digest` | 文字列（複数行） | 任意 | `collect` は概要と同じ RSS 抜粋を投入。手入力で上書き可 |

設計CSV: [`docs/security-next-news-app-design.csv`](docs/security-next-news-app-design.csv)。`collect` は **`article_url`** の重複を問い合わせてスキップしたうえで、**キーワード**（事件性あり・パッチ系除外）に合う未登録候補を公開日の新しい順に最大 **3 件**選びます（実装は `collect.ts` の定数一覧）。

### アプリ B: ニュース週次要約（ニュース本体とは別アプリ）

| 画面のフィールド名 | フィールドコード（このコード名で固定） | 種類 |
|-------------------|----------------------------------------|------|
| 対象週 | `target_week` | **日付**（その週の月曜日を 1 件 1 日で格納） |
| 今週の傾向と対策 | `weekly_trend` | **リッチエディタ**（`analyze.ts` が HTML で投入） |

設計 CSV: [`docs/security-next-weekly-report-app-design.csv`](docs/security-next-weekly-report-app-design.csv)。手順: [`docs/kintone-weekly-report-app-creation-steps.md`](docs/kintone-weekly-report-app-creation-steps.md)。

## API トークンに付与する権限

次のどちらかが使えます。

- **おすすめ（管理が楽）**: 1 トークンに両アプリ権限を付け、GitHub Secrets の **`KINTONE_API_TOKEN`** だけに保存する（または kintone 公式どおり **カンマ区切り**で複数トークンを 1 Secret にまとめる）。
- **2 Secret に分ける**: **`KINTONE_API_TOKEN_COLLECT`**（ニュース保存用）+ **`KINTONE_API_TOKEN_ANALYZE`**（週次要約用）。`analyze` はニュースを読んでレポートに書くため **両方が必要**（`ANALYZE` だけでは足りません）。`collect` は `COLLECT` があればそれだけ、無ければ従来どおり `KINTONE_API_TOKEN` を使います。

### このリポジトリのスクリプトが実際に使う権限（最低限）

| 処理 | 必要な権限 |
|------|------------|
| `collect` | **レコードの閲覧**（`article_url` 重複チェック）、**レコードの追加** |
| `analyze` | ニュース側の **閲覧**、週次要約側の **閲覧**（任意）＋ **追加** |

**編集・削除・アプリ管理**は `collect` / `analyze` では呼びません。

### フル権限のトークンについて

次の **すべて**を付与していても、上記スクリプトは問題なく動きます（不足権限によるエラーは起きにくい）。

- レコードの閲覧 / 追加 / 編集 / 削除  
- アプリ管理  

運用上は問題ありません。ただしトークンが漏れたときの影響が大きくなるため、安定稼働後は **閲覧＋追加だけ**に絞ると安全側です（GitHub Secrets の[漏えい対策](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)もあわせて確認）。

アプリの「アプリの設定」→「API トークン」で作成します（[公式: APIトークン](https://cybozu.dev/ja/kintone/docs/overview/api-token/)）。

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `KINTONE_DOMAIN` | ○ | 例 `jbis-kintone.cybozu.com`（`https://` なし） |
| `KINTONE_APP_ID` | ○ | Security NEXT ニュースのアプリ ID |
| `KINTONE_REPORT_APP_ID` | ○ | **ニュース週次要約**アプリの ID（`analyze` 専用） |
| `KINTONE_API_TOKEN` | △ | 従来どおり 1 Secret 運用のとき。`collect` では `COLLECT` が無ければ必須 |
| `KINTONE_API_TOKEN_COLLECT` | △ | ニュースアプリ専用トークン（あれば `collect` はこれを優先） |
| `KINTONE_API_TOKEN_ANALYZE` | △ | 週次要約アプリ専用。`analyze` で 2 トークン運用する場合に `COLLECT` とセット |
| `GEMINI_API_KEY` | △ | **`analyze` の週次要約に必須**。`collect` はキーワード選別のため不要 |
| `OPENAI_API_KEY` | — | 未使用（将来の拡張用。現行 `analyze` は Gemini） |
| `OPENAI_MODEL` | — | 同上 |
| `SECURITY_NEXT_RSS_URL` | — | 既定 `https://www.security-next.com/feed` |
| `NOTIFY_WEBHOOK_URL` | — | **失敗時**に POST する Slack 等の URL（`{"text":"..."}` 互換） |
| `NOTIFY_SUMMARY_WEBHOOK_URL` | — | **成功時**サマリー（候補数・追加件数必須）。Slack/Teams 向けも同形式なら可。未設定なら送信しない |

## ローカル実行

**注意**: `cd` と次のコマンドは**別行**にしてください。`cd .../security-next-automationcp` のようにつなげると `cd: too many arguments` になります。

```bash
cd security-next-automation
cp .env.example .env
# .env を編集して保存
npm ci
npm run collect
npm run analyze
```

リポジトリ直下（`kintone-ai-lab/`）にいる場合は、次でも同じです（作業ディレクトリは npm が `security-next-automation` に切り替えます）。

```bash
npm ci --prefix security-next-automation
npm run collect --prefix security-next-automation
npm run analyze --prefix security-next-automation
```

（`.env` は `security-next-automation/.env` に置くこと。起動時に `dotenv` で読み込みます。）

**`collect` をローカルで完走させる最低限**

- `.env.example` にはドメイン・アプリ ID の例を入れ済み。`cp .env.example .env` 後、次を **GitHub Environment「kintone-collect」と同じ値**で埋める。  
  - `KINTONE_API_TOKEN_COLLECT`（または 1 本運用なら `KINTONE_API_TOKEN`）  
  - （`collect` のみなら `GEMINI_API_KEY` は不要。`analyze` を回すときは必要）  
- ドメインは `KINTONE_DOMAIN=ホスト名` か `KINTONE_BASE_URL=https://…` のどちらか。  
- ニュースアプリ ID は `KINTONE_APP_ID` か、Actions の Secret 名に合わせた `KINTONE_APP`。

## GitHub Actions

リポジトリ直下の `.github/workflows/main.yml` を利用します。

- **collect**: `cron: 0 1,8 * * *`（UTC）＝ **JST 10:00 と 17:00**
- **analyze**: `cron: 0 11 * * 5`（UTC）＝ **金曜 JST 20:00**

金曜 **17:00 JST** に変える場合は analyze 用 cron を `0 8 * * 5` に変更してください。

### Secrets 一覧（Repository secrets）

- `KINTONE_DOMAIN`
- `KINTONE_APP_ID`
- `KINTONE_REPORT_APP_ID`
- **`KINTONE_API_TOKEN`** または **`KINTONE_API_TOKEN_COLLECT` + `KINTONE_API_TOKEN_ANALYZE`**（後者は `analyze` で両方必須）
- `OPENAI_API_KEY`
- （任意）`OPENAI_MODEL` / `SECURITY_NEXT_RSS_URL` / `NOTIFY_WEBHOOK_URL`

ワークフロー手動実行では `collect` / `analyze` / `both` を選べます。

## 補足

- **トークン節約**: `analyze` は各記事の `summary` を約 320 文字に切り詰め、最大 45 件まで LLM に渡します。
- **稼働条件**: Node.js **20.19+ または 22.12+** 推奨（Vite 8 と同水準の記述）。
- **REST API クライアント**: [`@kintone/rest-api-client`](https://www.npmjs.com/package/@kintone/rest-api-client)（公式）。
