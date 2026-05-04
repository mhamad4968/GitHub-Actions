# Security NEXT → kintone 自動収集・週次要約

## 🗺️ 運用の地図 (Navigating This Project)

Claude Code やエージェントが仕様・トラブル・開発作法を見失わないためのナビです。**人間の運用**でも同じ表を起点にしてください。

| 項目 | 参照先 | 役割 |
| :--- | :--- | :--- |
| **収集ロジック・429 / Gemini 判定** | 本 README（`security-next-automation/README.md`） | 収集フロー、`登録直前` の **`gemini=Y`（全文）/ `I`（見解のみ）/ `N`**、429 とモデル切替 |
| **アプリ定義・型・開発作法** | ルートの [CLAUDE.md](../CLAUDE.md) | `app:fields` / `app:types`、`kintone-apps.md` による履歴管理 |
| **プロジェクト全体の索引** | ルートの [RULES-INDEX.md](../RULES-INDEX.md) | 全体構造から 631 collect（本 README）へのクイックアクセス |

**クォータ回復後**の初回 `gemini=Y` で要約の密度を上げたり、選別キーワードを増やしたりする要望が出たら、マスク済みの **`[ニュース収集]` / `[Gemini体裁]` / `登録直前:`** のログ断片を共有してください。その実ログを基に、`collect.ts` の条件や `format-news-gemini.ts` のプロンプト・後処理を検討できます。

---

ブラウザ不要の Node.js（TypeScript）スクリプトと GitHub Actions で、[Security NEXT](https://www.security-next.com/) の RSS（既定: `https://www.security-next.com/feed`）を **Security NEXT ニュース** アプリに登録し、週次ジョブで LLM がまとめた **今週の傾向と対策** を **ニュース週次要約** アプリ（週次レポート専用）へ投稿します。  
フロントエンド（React 等）は使いません（React 19 以降の UI 要件は別プロジェクト向け）。

**設計図（CSV）・手順**  
- ニュース保存: [`docs/security-next-news-app-design.csv`](docs/security-next-news-app-design.csv) / [`docs/kintone-app-creation-steps.md`](docs/kintone-app-creation-steps.md)  
- **ニュース週次要約（週次レポート）**: [`docs/security-next-weekly-report-app-design.csv`](docs/security-next-weekly-report-app-design.csv) / [`docs/kintone-weekly-report-app-creation-steps.md`](docs/kintone-weekly-report-app-creation-steps.md)

### 正本とエージェント向けの役割分担

| 正本 | 扱う範囲 |
|------|----------|
| **本 README（`security-next-automation/README.md`）** | **`collect` / `analyze` の仕様・環変数・Actions・トラブルシュート**。実装の境界は **ロジック（`src/collect.ts` 等）** と **環境（Secrets / `.env`）** ここで切る。 |
| **`.cursor/rules/kintone-schema-trust.mdc` 等** | **画面カスタマイズ（フロント）**のフィールド信頼順位・`kintone.events.on` 前の確認。631 の **RSS 収集パイプ**とは別系統。 |

セッション全体の索引はルート **`CLAUDE.md`**（Security NEXT の collect は本 README を指す）。

### 運用スケジュールと内容（確定・2026-03）

| タイミング | 内容 |
|------------|------|
| **毎日 10:00 / 17:00（JST）** | `daily-collect.yml` → `collect.ts`。RSS から未登録候補を **高度キーワード**で選別。通常枠は最大 **3 件**、重大度例外枠（ランサム＋国内等）は **1 日最大 3 件**追加可能（合計上限 6 件/日）。各レコードに **採用キーワード・ソース・Gemini 成否・重大度区分** の内部メタデータと **要レビュー** 品質フラグを保存。 |
| **毎週金曜 17:00（JST）** | `main.yml` の `security-next-kintone` → `analyze.ts`（`cron: 0 8 * * 5` = 金曜 08:00 UTC）。その週の **631** を集約し **632** へ **新規追加または同一 `target_week` の更新**（Idempotency）。本文・1行サマリー・参照エビデンス・`GITHUB_RUN_ID` を保存。 |

**動作確認の目安**: 日次実行後、**631** にキーワードに合致した記事が追加されていれば意図どおり（完全一致ではないため、必要に応じてキーワード一覧を `collect.ts` で調整）。重要事故の**即時**通知が必要なら、kintone の通知設定や Webhook 連係（`NOTIFY_WEBHOOK_URL` / `NOTIFY_SUMMARY_WEBHOOK_URL`）の拡張を検討。

### 必要な情報収集（運用・初回セットアップ用チェックリスト）

自動収集を安定させるために、次を揃えておくと手戻りが減ります。**パスワード・APIトークンはリポジトリにコミットせず**、`.env` または GitHub Secrets にのみ保存してください。

| 種別 | 収集する内容 | メモ |
|------|----------------|------|
| **kintone 接続** | ドメイン（例: `xxx.cybozu.com`、`https` なし）、ニュースアプリ ID（631 等）、週次要約アプリ ID | Secret 名は README の「環境変数」を参照 |
| **API トークン** | `collect` 用（ニュースの閲覧・追加）、`analyze` 用（必要に応じてニュース閲覧＋レポート追加） | 権限の最小化は README の表どおり |
| **RSS** | 既定で `SECURITY_NEXT_RSS_URL` またはフィード URL の確認 | 変更時は `collect.ts` の到達確認 |
| **概要・要約の体裁（任意）** | `GEMINI_API_KEY`（未設定なら RSS トリムのみ。設定時は概要／要約の定義と [記載例](#概要と要約の定義) に従う） | `COLLECT_SKIP_GEMINI_FORMAT=1` で Gemini を抑止可能 |
| **失敗・成功通知（任意）** | `NOTIFY_WEBHOOK_URL`、`NOTIFY_SUMMARY_WEBHOOK_URL` | Slack 等の Incoming Webhook 互換 |
| **設計の正本** | フィールドコード一覧（`docs/security-next-news-app-design.csv`）、選別キーワード（`collect.ts` の `INCIDENT_KEYWORDS` / `EXCLUSION_KEYWORDS`） | ルール変更時はコードとドキュメントを揃える |

**制約（要約の精度）**: `collect` が参照できるのは **RSS 抜粋**が中心です。本文全体や CVE の詳細がフィードに無い場合、要約は **「記事・公式で確認」** 表現に留まることがあります。深い事実関係は **元記事・ベンダアドバイザリ**での確認が必要です。

### ニュース分析で使う MCP（Cursor 等・任意）

チャットやエディタから **記事の深掘り・CVE の裏取り** をするときの参考です。MCP は **CI の `collect` / `analyze` には不要**です（後述 5）。有効化は Cursor の **`mcp.json`**（例: `~/.cursor/mcp.json`）で行います。ワークスペース索引: リポジトリ直下 **`RULES-INDEX.md`** のチェックリスト。

| # | 用途 | MCP（識別子の例） | メモ |
|---|------|-------------------|------|
| **1** | **CVE・脆弱性の照会**（CVSS・説明・参照の確認） | **`cve-search`** | `.cursor/rules/security-news-response.mdc` とも整合。API 例: CIRCL 系。 |
| **2** | **公開 URL の本文取得**（アドバイザリ・記事の一次情報） | **`fetch`**（`mcp-server-fetch` / `uvx` 等） | HTML を Markdown 風に読みやすくする用途。 |
| **2（補）** | **PDF・Office** のアドバイザリをテキスト化 | **`markdownify`** | バイナリ添付の読み取り向け。 |
| **3** | **kintone ニュース（631 等）のレコード確認** | **kintone 向け MCP**（環境にあれば `user-kintone` 等） | `summary` / `digest` の突合・一覧取得。無ければブラウザや REST で可。 |
| **4** | **他ソースのニュース・トレンド把握（補助）** | **`cyber-news`** 等（環境にあれば） | 出典・鮮度を確認し、**断定は一次情報**で。 |
| **5** | **自動収集・週次レポート本体** | **（MCP 不要）** | `collect.ts` / `analyze.ts` は **環境変数＋kintone REST** で完結。MCP は人間／対話での分析補助用。 |

**注意**: **社内限定 URL・要認証ページ**を fetch 等で開くと**情報漏えい**のリスクがあります。対象ドメインとトークンを扱う MCP はポリシーに沿って制限してください。

### Security NEXT ニュース（collect）を本番稼働させる

| 手順 | 内容 |
|------|------|
| 1 | kintone **631** にフィールドコード `title` / `article_url` / `published_date` / `summary` / `digest` 等があること（[`docs/security-next-news-app-design.csv`](docs/security-next-news-app-design.csv)）。API トークンに **631 の閲覧・追加** を付与。 |
| 2 | GitHub リポジトリ → **Settings → Environments → `kintone-collect`**（無ければ作成）に **Environment secrets** を登録: **`KINTONE_DOMAIN`**、**`KINTONE_APP`**（値＝`631`）、**`KINTONE_API_TOKEN_COLLECT`**（631 用トークン）。 |
| 3 | 任意: **`GEMINI_API_KEY`**（概要・要約の体裁。未設定なら RSS トリムのみで登録可）。モデルは既定 **`gemini-2.0-flash`**。無料枠の **429（Quota exceeded）** が続くときは **`GEMINI_MODEL`** を別 Flash 系へ（Repository **Variables** または `.env`。例は `.env.example`）。`format-news-gemini.ts` は 429 時に数回だけ待機再試行する。**analyze** は別実装のため同様の再試行は未対応。 |
| 4 | ワークフロー **`.github/workflows/daily-collect.yml`** が **`on.schedule`** で 1 日 2 回（JST 10:00 / 17:00 相当）動くことを確認。手動は **Actions → security-next-daily-collect → Run workflow**。 |
| 5 | ルートから **`npm run security-next:collect`**（`security-next-automation/.env` 済み）でローカル試験可。 |

**トラブル**: Actions の Environment に Secret が無いと `KINTONE_APP_defined=false` のまま失敗します。**Repository secrets のみ**だと `environment: kintone-collect` では見えない場合があるため、**Environment `kintone-collect` に同じ名前で再登録**してください。

**概要と要約が画面上同じ長文に見えるとき**（想定と対処）:

1. **GitHub Actions の Environment `kintone-collect` に `GEMINI_API_KEY` が無い** → collect は 4 見出しの材料整形で登録するが、ログ先頭の `GEMINI_API_KEY あり/オフ` と各レコードの `登録直前: ... gemini=Y|I|N` で確認。**Secret を追加**すると Gemini 体裁で差が出やすい。
2. **`COLLECT_SKIP_GEMINI_FORMAT=1`** を誤って付けていないか確認。
3. **フィールドコード**が設計どおりか（概要＝`summary`、要約＝`digest`）。**画面ラベルだけ**一致していてもコードが違うと別フィールドに入る。
4. **公開日が「今日」に見える** → RSS の `pubDate` / `isoDate` が欠落していると **JST 当日**で補完し、ログに `RSS に有効な公開日時がありません` と出る。フィード側の問題の可能性あり。
5. **ログに `429` / `Quota exceeded`、`登録直前: gemini=N` または `I`** → 全文整形が失敗すると **RSS 材料＋見解のみ Gemini**（`gemini=I`）になることがあります。 **`gemini=N`** は見解 API も含め Gemini 未通過。`[Gemini体裁] … 再試行` の後も続くなら **`GEMINI_MODEL` 変更**や **課金枠**を検討。

`collect.ts` は、要約に **4 見出し**が無い／概要と全文一致するとき、**材料整形で要約を差し替え**ます（既存レコードは手修正か再取り込み）。フォールバック時は **事象＝抜粋・脆弱性関連＝技術寄りの文の抽出**。**`GEMINI_API_KEY` があるとき全文 Gemini が失敗しても `見解:` だけ `formatDigestInsightOnly` で再試行**します。ログは **`gemini=Y`（全文）/ `I`（見解のみ）/ `N`**。

### Claude Code / エージェント向け: 原因のコード追跡とログ共有

**よくある誤解**: 「`GEMINI_API_KEY` が無いと RSS 抜粋が **そのまま両フィールドにコピー**される」— **実装はそうなっていません**。常に `overview` と `digest` は **別変数**で、`addRecords` も **`summary` と `digest` で別キー**に載せています（同一変数の二重利用ではない）。

画面上で長文が同じに見えるときは、次をコード上で追うと早いです。

| 見る場所 | 内容 |
|----------|------|
| [`src/collect.ts`](src/collect.ts) `shouldUseGeminiFormat` | `GEMINI_API_KEY` と `COLLECT_SKIP_GEMINI_FORMAT` で Gemini 経路のオン/オフ。 |
| 同 `collect.ts` 登録ループ | `formatNewsForKintone`（Gemini）または `buildRssMaterialSummaryDigest`（RSS 材料）から `overview` / `digest` を生成。 |
| [`src/lib/text.ts`](src/lib/text.ts) `buildRssMaterialSummaryDigest` | **同じ抜粋**から、概要は **タイトル行＋短いリード**＋`Security NEXT`、要約は **事象に抜粋〜900字**＋他3見出しで **4 見出し**を組み立てる（Gemini 失敗時も構造差を出す）。 |
| [`src/lib/field-codes.ts`](src/lib/field-codes.ts) `NEWS_FIELDS` | REST のキーは `summary`（概要）と `digest`（要約）。アプリ側の**フィールドコード不一致**はここが正本。 |
| 同 `collect.ts` `records.push` 付近 | `[NEWS_FIELDS.summary]` と `[NEWS_FIELDS.digest]` にそれぞれ代入。 |

**公開日が当日に見える理由**: [`toKintonePublishedDate`](src/collect.ts) — RSS の `isoDate` / `pubDate` が無効だと **JST 当日**で補完し、**`RSS に有効な公開日時がありません`** とログに出る。

#### ログ共有チェックリスト（3点セット・機密は伏せる）

この 3 点が揃う断片があれば、**Gemini スキップか**、**RSS 由来の材料整形のみか**、**フィールドコード（`summary` / `digest`）の取り違えか**、**RSS 日付欠落による当日補完か**を切り分けやすい。

| # | 貼る内容 | 分かること |
|---|----------|------------|
| **1** | `GEMINI_API_KEY_defined=true` または `false`（Actions の「GitHub が secrets を認識しているか」ステップ） | **環境にキーが届いているか**（ロジック外の失敗の除外）。 |
| **2** | **`[ニュース収集]` で始まる行すべて**（`Gemini オフ` / `GEMINI_API_KEY あり`、`登録直前:` を含む） | **実際の登録直前のデータ**と **`gemini=Y|I|N`**。 |
| **3** | **日付まわりの警告**（例: `RSS に有効な公開日時がありません`） | **RSS の `pubDate` / `isoDate` 欠落**と当日補完の有無。 |

トークン・API キー・ドメインの**値そのものは貼らない**。マスク済みログやスクリーンショットで可。

**判定のイメージ**: (1) で Gemini がオフなら Secrets 側を疑う。(2) で `gemini=N` かつ要約が 4 見出しでないならフォールバック経路やフィールド不整合を疑う（`gemini=I` は見解のみ成功）。(3) があれば公開日のズレは **フィード／補完ロジック**寄り。

**`npm run collect` / Actions 再実行時の注目点**（クォータ回復後・堅牢化後の確認用）:

| 状況 | 確認すること |
|------|----------------|
| **API 制限（429）** | ログに **`[Gemini体裁] … 再試行`** が出るか（待機後に API を再試行している印）。 |
| **全文 (`gemini=Y`)** | **`digest` の 4 見出し**が概要より掘り下げられているか。 |
| **見解のみ (`gemini=I`)** | 事象などは材料整形でも **`見解:`** が Gemini（優先度・確認観点）になっているか。 |
| **非 Gemini (`gemini=N`)** | **`summary`** がタイトル＋短リード。**`見解:`** が「RSS 由来の自動登録…」定型ならキー未設定・`COLLECT_SKIP_GEMINI_FORMAT=1`・または見解 API も失敗。 |

**運用ヒント**: 既定の **`gemini-2.0-flash` で 429 が頻発**する場合は、ローカルの `.env` または GitHub の **Repository variables** で **`GEMINI_MODEL=gemini-1.5-flash`** へ切り替えることを推奨する。環境によっては 404 になることがあるため、そのときは [Google AI Studio](https://aistudio.google.com/) で当該プロジェクトに利用可能な Flash 系モデル ID を確認すること。

**次にやること（運用者）**: GitHub → **Actions** → **security-next-daily-collect** → 問題のあった **Run** を開く → ワークフロー図で **collect** ジョブ → 各ステップのログから上表の **1〜3** をコピー（**API キー・トークン・ドメインの値は含めない**）。Actions が使えない場合はリポジトリルートで **`npm run security-next:collect`** を実行し、ターミナルの `[ニュース収集]` 行をそのまま貼る。

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
| 概要 | `summary` | 文字列（複数行） | 任意 | **`GEMINI_API_KEY` あり**: 「何が起きたか」の**1〜2文**の全体像＋最終行 `Security NEXT`。**なし**: 抜粋から短いリード＋最終行 `Security NEXT`（`buildRssMaterialSummaryDigest`） |
| 要約 | `digest` | 文字列（複数行） | 任意 | **`GEMINI_API_KEY` あり**: 概要より掘り下げ、`事象:` `脆弱性関連:` `修正・対策:` `見解:` の4段（未達時は最大3回まで再生成）。**なし**: 同じ4見出しを抜粋から機械的に整形（材料用・Gemini 非依存）。手入力可 |

設計CSV: [`docs/security-next-news-app-design.csv`](docs/security-next-news-app-design.csv)。`collect` は **`article_url`** の重複を問い合わせてスキップしたうえで、**キーワード**（事件性あり・パッチ系除外）に合う未登録候補を公開日の新しい順に最大 **3 件**（通常枠）＋ **重大度例外枠最大 3 件/日**（AGENTS.md §7 準拠）を選びます。各レコードには `match_keywords_display`（マッチキーワード）、`internal_source`（rss/nvd）、`internal_gemini_mark`（Y/I/N）、`needs_review`（品質フラグ）、`internal_severity_tier`（normal/exception）が自動保存されます。

#### 概要と要約の定義

- **概要（`summary`）**: 「何が起きたか」を **1〜2 文**で短くまとめた**全体像**。最終行に `Security NEXT` を 1 行だけ付ける（体裁は `collect` の Gemini 指示が正本）。
- **要約（`digest`）**: 概要に加え、**具体的な被害・事象**、**脆弱性・CVE 等**、**修正や推奨対策**、**専門的な見解**など、内容を掘り下げて要点を整理したもの。Gemini 使用時は次の **4 見出し（半角コロン付き・この順）** を必須とする: `事象:` / `脆弱性関連:` / `修正・対策:` / `見解:`。

#### 記載例（体裁の目安・レコード番号は例）

以下は **Security NEXT 風のニュース 1 件**を、上記の定義どおりに分けた例です（実在レコード ID の指定ではありません）。

**2. タカカツグループ HD のランサムウェア被害（例: レコード 182652）**

**概要**

```text
タカカツホールディングスにおいて、サーバー内のデータが暗号化されるランサムウェア被害が発生。内部に保管されていた個人情報が流出した可能性があります。
Security NEXT
```

**要約**

```text
事象: サーバー攻撃により業務システムがダウン。攻撃者からデータの復元と引き換えに金銭を要求される事態となっている。
脆弱性関連: 直接の言及はないが、同時期に深刻な影響を及ぼしていた CVE-2024-45409 (CVSS 9.9) のような認証バイパスの脆弱性が悪用されたリスクも否定できない。
修正・対策: 修正バージョン（Ruby-SAML 1.17.0 / OmniAuth-SAML 2.2.1 以上）へのアップデートが強く推奨されている。
見解: CVSS 9.9 という極めて高い深刻度は、認証を完全に無視してシステムに侵入されるリスクを示しています。パッチ適用は「努力目標」ではなく、侵入を許さないための「必須要件」と捉えるべきです。
```

（抜粋に無い事実は断定しない・CVE は記事に基づく旨は Gemini 指示どおり。）

#### 閲覧のコツ（概要と要約の使い分け）

セキュリティ情報を効率よく追うとき、まず **概要（`summary`）** でざっくりした全体像（何が起きたか）だけを掴み、関心が高い・対応が必要な記事に絞ってから **要約（`digest`）** を開き、**具体的な数値・被害の程度・脆弱性・推奨される修正アクション・見解** を確認する、という流れがおすすめです。一覧や通知では概要だけ見れば十分なことが多く、深掘りが必要なときだけ要約に目を通せば読む量を抑えられます。

### アプリ B: ニュース週次要約（ニュース本体とは別アプリ）

| 画面のフィールド名 | フィールドコード（このコード名で固定） | 種類 |
|-------------------|----------------------------------------|------|
| 対象週 | `target_week` | **日付**（その週の月曜日。同一日付は更新） |
| 今週の傾向と対策 | `weekly_trend` | **リッチエディタ**（`analyze.ts` が HTML で投入） |
| 週次サマリー1行 | `summary_one_line` | **文字列（1行）**（一覧・通知向け） |
| （内部）参照件数・$id 範囲・実行日時・run_id | `internal_*` | **数値／日時／1行**（監査用。一覧では非表示推奨） |

設計 CSV: [`docs/security-next-weekly-report-app-design.csv`](docs/security-next-weekly-report-app-design.csv)。手順: [`docs/kintone-weekly-report-app-creation-steps.md`](docs/kintone-weekly-report-app-creation-steps.md)。

**632 を既に運用中の場合**: 不足している `summary_one_line` と `internal_*` をフォームに追加してから `analyze` を実行してください。

## API トークンに付与する権限

次のどちらかが使えます。

- **おすすめ（管理が楽）**: 1 トークンに両アプリ権限を付け、GitHub Secrets の **`KINTONE_API_TOKEN`** だけに保存する（または kintone 公式どおり **カンマ区切り**で複数トークンを 1 Secret にまとめる）。
- **2 Secret に分ける**: **`KINTONE_API_TOKEN_COLLECT`**（ニュース保存用）+ **`KINTONE_API_TOKEN_ANALYZE`**（週次要約用）。`analyze` はニュースを読んでレポートに書くため **両方が必要**（`ANALYZE` だけでは足りません）。`collect` は `COLLECT` があればそれだけ、無ければ従来どおり `KINTONE_API_TOKEN` を使います。

### このリポジトリのスクリプトが実際に使う権限（最低限）

| 処理 | 必要な権限 |
|------|------------|
| `collect` | **レコードの閲覧**（`article_url` 重複チェック）、**レコードの追加** |
| `analyze` | ニュース側の **閲覧**、週次要約側の **閲覧**（任意）＋ **追加** ＋ **編集**（同一 `target_week` の更新） |

`collect` は **編集・削除・アプリ管理**を呼びません。`analyze` は Idempotency のため週次要約アプリで **レコードの編集**を使います。

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
| `GEMINI_API_KEY` | △ | **`analyze` の週次要約に必須**。`collect` では**任意**（設定時は概要・要約をメディア体裁で整形） |
| `GEMINI_MODEL` | — | 省略時は **`gemini-2.0-flash`**（`format-news-gemini.ts` / `analyze.ts`）。GitHub では Repository **Variables** 推奨 |
| `COLLECT_SKIP_GEMINI_FORMAT` | — | `1` のとき `collect` は Gemini を使わず RSS トリムのみ（キーがあっても無効） |
| `OPENAI_API_KEY` | — | 未使用（将来の拡張用。現行 `analyze` は Gemini） |
| `OPENAI_MODEL` | — | 同上 |
| `SECURITY_NEXT_RSS_URL` | — | 既定 `https://www.security-next.com/feed` |
| `NOTIFY_WEBHOOK_URL` | — | **失敗時**に POST する Slack 等の URL（`{"text":"..."}` 互換） |
| `NOTIFY_SUMMARY_WEBHOOK_URL` | — | **成功時**サマリー（候補数・追加件数必須）。Slack/Teams 向けも同形式なら可。未設定なら送信しない |
| `GITHUB_RUN_ID` | — | GitHub Actions が自動設定。632 の `internal_github_run_id` に記録（ローカルは `local`） |
| `ANALYZE_EXISTING_WEEK_RECORD` | — | `update`（既定）＝同一週は上書き、`skip`＝既存があればスキップ。Repository variables でも可 |

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
- **稼働条件**: Node.js **22.13+（LTS）** 推奨（リポルート `package.json` の `engines` と整合）。
- **REST API クライアント**: [`@kintone/rest-api-client`](https://www.npmjs.com/package/@kintone/rest-api-client)（公式）。
