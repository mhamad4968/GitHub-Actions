# 最新ICT情報掲示板 — 仕様正本

> **CEO GO**: 2026-05-16（v1）／**v2 本番**: 2026-05-17  
> **最終更新**: 2026-05-17（CIO）— **収集・カテゴリ・セキュリティの正本は §2.3**  
> **Space**: [Space 48](https://jbis-kintone.cybozu.com/k/#/space/48)  
> **台帳**: `kintone-apps.md`  
> **コード正本**: `ict-tech-digest-automation/`・`customize/686/desktop.js`

---

## 0. 目的（業務で何ができるか）

**20本以上の RSS を横断**し、Gemini が **「今日、自社のインフラ・PC 管理において最重要」** なニュースを **1日最大5件** だけ選び、kintone に要約して蓄積する。

| 利用者のメリット |
|------------------|
| 朝・夕に掲示板を開くだけで、パッチ判断・確認タスクの優先度が分かる |
| 各記事が **【事象】【影響】【推奨】** の3行で整理され、社内周知・対応検討にそのまま使える |
| 過去分はカテゴリ・日付・キーワードで検索可能 |

**Security NEXT（631）とは別ライン**。631＝セキュリティインシデント専用。本掲示板＝インフラ・PC・ネットワーク・Microsoft 系の **日次ダイジェスト**。

---

## 1. アーキテクチャ（682/683 分離型）

| 役割 | アプリ名 | アプリ ID | URL | 利用者 |
|------|----------|-----------|-----|--------|
| 正本（蓄積・自動登録） | 最新ICT情報掲示板（収集用） | **685** | https://jbis-kintone.cybozu.com/k/685/ | GHA / CIO のみ（部員は非掲載） |
| ダッシュ（閲覧・過去検索） | 最新ICT情報掲示板 | **686** | https://jbis-kintone.cybozu.com/k/686/ | 部員（Space 48 入口） |

- データ連携: **レコードコピーなし**。686 の JavaScript が **685 を REST 読取**（`kintone.api`・ログインユーザー権限）。
- 686 利用者は **685 のレコード閲覧権限** が必要（未付与だと「取得に失敗」表示）。

---

## 2. 自動収集の流れ

```
[RSS 20本+] → 重複URL排除・直近記事に絞り込み
    → Gemini 厳選（重要度スコア・最大5件）
    → kintone 685 登録（overview 3行・カテゴリ付き）
    → 686 ダッシュで表示
```

| 項目 | 内容 |
|------|------|
| **実行** | 1日2回 **10:00 / 20:00 JST**（GHA cron UTC 1:00 / 11:00） |
| **手動実行** | GitHub Actions `ict-tech-digest-collect` → `workflow_dispatch` |
| **1日上限** | `published_at` = **JST 当日** の件数 ≤ **5**（超過時はログのみで終了） |
| **URL** | 全期間で一意（同一 URL は再登録しない） |
| **厳選** | 未登録 URL → 直近7日（不足時14日）の候補 → Gemini 重要度 → 残枠ぶん登録 |
| **AI** | **Gemini**（`GEMINI_API_KEY`）。モデルは `GEMINI_MODEL` または flash 系フォールバック |

### 2.1 Gemini 選定・要約ルール

**選ぶもの（スコアを上げる）**

- Windows / Office 月例パッチ・緊急 CVE（MSRC Update Guide 等）
- 社内 PC・サーバー・ネットワーク機器（ルーター / UTM / VPN）への実害リスク
- 大規模障害・ゼロデイ・ベンダー必須対応

**下げるもの**

- 開発トレンドのみで運用影響が薄い記事

**overview（概要欄）の必須フォーマット**

```
【事象】（1文）
【影響】自社のインフラ・PC・セキュリティ運用への影響（1文）
【推奨】情シスが今日取るべきアクション（1文）
```

英語記事も日本語要約。CVE 番号・製品名・バージョンは原文表記可。

> **注意（v2）**: 上記 §2.1 は v1 時代の記述。**2026-05-17 以降の選定・セキュリティ・類似除外は §2.3 が正本**。

### 2.3 v2 収集仕様（2026-05-17 正本・本番稼働）

| 項目 | 内容 |
|------|------|
| **類似除外** | URL 完全一致に加え、**過去12ヶ月**の `title` を kintone から取得（最新 **150件**）→ Gemini プロンプトで酷似テーマを除外。OpenAI は不使用（Gemini 一本） |
| **1日上限** | JST 当日 `published_at` で **最大5件**（`ICT_DAILY_MAX_RECORDS` で 1〜20 に変更可） |
| **ドライラン** | `ICT_DRY_RUN=true` のとき **kintone POST なし**（登録予定をログ出力して正常終了）。Gemini / kintone 失敗時は **登録せず exit 1** |
| **AI** | `@google/generative-ai`・既定モデル **`gemini-2.5-flash`**・`responseSchema` 構造化 JSON |
| **ログ・データ** | コメント・ログ・登録データは **日本語**（CVE ID・製品名の英数字は可） |
| **GHA** | `.github/workflows/ict-tech-digest-collect.yml`（`cron.yml` は作らない）10:00/20:00 JST・`workflow_dispatch` |

**セキュリティ・パッチ（運用ノイズ抑制）**

- **除外**: JPCERT/IPA 型の注意喚起・攻撃速報・脆弱性アラート単体
- **可**: セキュリティ製品リリース・技術動向ニュース
- **MSRC 月次まとめ**: 同月 **最大1本**
- **個別 CVE**: **Critical** / **野外悪用** / **CVSS 9.0+** のみ
- **不可**: Important のみ・情報提供レベルのパッチ単体  
- 実装: `gemini-curate.ts` の `PATCH_AND_CVE_POLICY`

**RSS（v2・コード正本 `config.ts`）**

- **約27本**（`ICT_RSS_FEED_URLS` 未設定時）。v1 から **除外**: `jpcert.or.jp` 統合・`ipa.go.jp/security/rss/alert`
- **追加**: `https://scan.netsecurity.ne.jp/rss/index.rdf`（`www.netsecurity.ne.jp` 直 RSS は不可）
- 11 ドメイン意図は既存フィードでカバー（CEO 合意 A）

**カテゴリ（新7種）**

`AI・LLM` / `インフラ・通信・端末` / `開発トレンド` / `Box・SaaS・文書管理` / `DX人材・IT資格・組織` / `セキュリティ製品・技術` / `その他`

- **685**: ドロップダウンは上記7種（`scripts/update-685-category-dropdown.mjs` で更新可）
- **686**: 旧17種レコードは **表示・フィルタのみ** 新7種へマッピング（`field-codes.ts` の `LEGACY_CATEGORY_TO_NEW`・`desktop.js`）
- **686 BUILD**: `2026-05-17-686-ict-digest-board-v9`

**本番切替（2026-05-17 実施済）**

1. 685 カテゴリ7種 deploy  
2. `ICT_DRY_RUN=true` でローカル/GHA 検証  
3. git push（`84c4f77` 以降）  
4. GHA `ICT_DRY_RUN=false`・本番 dispatch  
5. CEO 目視 OK  

### 2.2 デフォルト RSS 一覧（コード正本: `config.ts` の `DEFAULT_RSS`）

| # | 区分 | ソース | RSS URL |
|---|------|--------|---------|
| 1 | 開発 | Qiita 人気 | `https://qiita.com/popular-items/feed` |
| 2 | 開発 | Zenn | `https://zenn.dev/feed` |
| 3 | 開発 | はてな IT | `https://b.hatena.ne.jp/hotentry/it.rss` |
| 4 | 開発 | ITmedia @IT 全フォーラム | `https://rss.itmedia.co.jp/rss/2.0/ait.xml` |
| 4b | 開発 | @IT Coding Edge | `https://rss.itmedia.co.jp/rss/2.0/ait_coding.xml` |
| 4c | 開発 | CodeZine | `https://codezine.jp/rss/new/index.xml` |
| 4d | ITベンダー | CNET Japan | `https://feeds.japan.cnet.com/rss/cnet/all.rdf` |
| 5 | Microsoft | MSRC Blog | `https://msrc.microsoft.com/feed/`（旧 `/blog/rss/` は HTML のため廃止） |
| 6 | Microsoft | **MSRC Update Guide（パッチ・CVE）** | `https://api.msrc.microsoft.com/update-guide/rss` |
| 7 | Microsoft | Windows Blog | `https://blogs.windows.com/feed/` |
| 8 | Microsoft | Microsoft Security Blog | `https://www.microsoft.com/en-us/security/blog/feed/` |
| 9 | セキュリティ公式 | IPA 注意喚起 | `https://www.ipa.go.jp/security/rss/alert.rdf` |
| 10 | セキュリティ公式 | JPCERT/CC 統合 | `https://www.jpcert.or.jp/rss/jpcert.rdf` |
| 11 | PC・製品 | PC Watch | `https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf` |
| 12 | PC・製品 | INTERNET Watch | `https://internet.watch.impress.co.jp/data/rss/1.0/iw/feed.rdf` |
| 13 | PC・製品 | Forest Watch | `https://forest.watch.impress.co.jp/data/rss/1.0/wf/feed.rdf` |
| 14 | エンタープライズ | ASCII.jp TECH | `https://ascii.jp/tech/rss.xml` |
| 15 | サーバー・DC | ZDNet Japan | `https://feeds.japan.zdnet.com/rss/zdnet/all.rdf` |
| 16 | 法人 PC | ITmedia PC USER | `https://rss.itmedia.co.jp/rss/2.0/pcuser.xml` |
| 17 | ネットワーク | @IT Master of IP Network | `https://rss.itmedia.co.jp/rss/2.0/ait_network.xml` |
| 18 | サーバー | @IT Server & Storage | `https://rss.itmedia.co.jp/rss/2.0/ait_server.xml` |
| 19 | ネットワーク | ITmedia ネットトピックス | `https://rss.itmedia.co.jp/rss/2.0/news_nettopics.xml`（旧 `nw.xml` は 404 HTML） |
| 20 | エンタープライズ | 日経クロステック IT | `https://xtech.nikkei.com/rss/xtech-it.rdf` |
| 21 | 経営・資格 | 日経クロステック 全記事 | `https://xtech.nikkei.com/rss/index.rdf` |
| 22 | 公式 | IPA 新着（DX・人材等） | `https://www.ipa.go.jp/about/newsonly-rss.rdf` |
| 23 | 情シス | ITmedia エンタープライズ | `https://rss.itmedia.co.jp/rss/2.0/enterprise.xml` |
| 24 | DX事例 | ITmedia EP 事例 | `https://rss.itmedia.co.jp/rss/2.0/ep_casestudy.xml` |
| 25 | 情シス速報 | ITmedia EP ショートニュース | `https://rss.itmedia.co.jp/rss/2.0/ep_snews.xml` |

**ZDNet Japan（SaaS・コラボ）**: カテゴリ別 RSS は公開されていないため、既存の `feeds.japan.zdnet.com/rss/zdnet/all.rdf` で Box / Teams / クラウド文書管理記事を取り込む。

**RSS 取得の耐障害（2026-05-16）**

- `src/lib/rss-fetch.ts`: **4回リトライ**・**HTML 誤応答検知**・**XML サニタイズ**・旧 URL エイリアス
- `src/lib/overview-format.ts`: 登録時に **【事象】【影響】【推奨】** へ正規化
- `config.ts`: リポルート `.env` 読込・**685 専用トークン**（631 用 COLLECT 誤流用防止）
- 686 v7: 検索条件を **今日の厳選** にも反映
- 検証: `npm run ict-digest:rss:verify`

**RSS の追加・変更**

- リポの `ict-tech-digest-automation/src/lib/config.ts` の `DEFAULT_RSS` を編集して push
- または GitHub Environment `kintone-collect` の Variable **`ICT_RSS_FEED_URLS`**（カンマ区切り）で上書き（設定時はこちらが優先）

**注意**

- メディアのトップページ URL ではなく **RSS 配信 URL** を登録すること
- 日経クロステックにネットワーク単独 RSS は無いため **IT 分野 RSS**（`xtech-it.rdf`）を使用

---

## 3. 正本アプリ（685）フィールド

| フィールドコード | 型 | ラベル | 備考 |
|------------------|-----|--------|------|
| `title` | 文字列1行 | タイトル | |
| `url` | リンク | URL | 最大512文字。重複はアプリ側ロジックで排除（kintone unique はオフ）。**MSRC Update Guide の個別 CVE URL（`…/vulnerability/CVE-…`）は Microsoft 製品のみ**（PostgreSQL / NGINX 等は **NVD** `https://nvd.nist.gov/vuln/detail/CVE-…`）。実装: `ict-tech-digest-automation/src/lib/article-url.ts` の `resolveArticleUrl()` |
| `published_at` | 日付 | 公開日 | **掲載日（JST 当日）**。厳選ダイジェストの「本日」枠 |
| `overview` | 文字列複数行 | 概要 | 【事象】【影響】【推奨】 |
| `category` | ドロップダウン | カテゴリ | **v2: 下記7択**（`field-codes.ts` と同期） |

### カテゴリ（API 値 = 表示名）— v2（2026-05-17）

`AI・LLM` / `インフラ・通信・端末` / `開発トレンド` / `Box・SaaS・文書管理` / `DX人材・IT資格・組織` / `セキュリティ製品・技術` / `その他`

**旧17種の既存レコード**: kintone 上は旧値のまま。686 は `LEGACY_CATEGORY_TO_NEW` で表示・フィルタを新7種に読み替え（§2.3）。

<details><summary>v1 カテゴリ（参照・2026-05-17 以前のレコード）</summary>

Microsoft・Windows / PC・端末 / サーバー・インフラ / ネットワーク・通信 / セキュリティ・脆弱性 / プログラム・開発 / ITベンダー・DX / SaaS・文書管理 / 資格・リスキリング / DX人材・組織 / 情シス・IT部門 / IPA・政策調査 / AI・LLM / インフラ・クラウド / 開発トレンド / ITツール・ガジェット / その他

</details>

---

## 4. ダッシュ（686）— 部員向け操作

| 画面要素 | 内容 |
|----------|------|
| ヘッダー | サービス説明（横断厳選・最大5件） |
| **今日の厳選（最大5件）** | 当日 `published_at` の記事（無ければ直近7日から最大6件表示） |
| 検索パネル（上部） | キーワード・カテゴリ・公開日 From–To |
| 記事一覧 | 全期間・ページング（50件/ページ） |
| BUILD 表示 | フッター（正: `2026-05-17-686-ict-digest-board-v9`） |
| 本日上限の注記 | 「本日の新着は最大5件まで（厳選）」 |

**カスタマイズ**

- ファイル: `customize/686/desktop.js`
- 正本アプリ ID: 定数 `685` または `window.ICT_DIGEST_STORE_APP`

---

## 5. 環境変数・シークレット

### GitHub Actions（Environment: `kintone-collect`）

| 変数 / Secret | 必須 | 説明 |
|---------------|------|------|
| `KINTONE_DOMAIN` | ○ | 例 `jbis-kintone.cybozu.com` |
| `ICT_DIGEST_STORE_APP_ID` または `KINTONE_APP_ID` | ○ | **685** |
| `KINTONE_API_TOKEN_ICT_COLLECT` | ○ | 685 **書込**トークン |
| `GEMINI_API_KEY` | ○ | Gemini（Security NEXT と共有可能） |
| `GEMINI_MODEL` | — | 未設定時 **`gemini-2.5-flash`** |
| `ICT_DRY_RUN` | — | **`true`** で kintone 登録なし（検証用）。本番は **`false`** または未設定 |
| `ICT_DAILY_MAX_RECORDS` | — | 既定 **5**（1〜20） |
| `ICT_RSS_FEED_URLS` / `RSS_FEED_URLS` | — | **未設定時は `config.ts` の DEFAULT（v2 約27本）**。Variable 設定時のみ上書き |
| `ICT_DIGEST_BOARD_APP_ID` | — | 686（ログ用・任意） |
| `NOTIFY_WEBHOOK_URL` | — | 失敗時通知（任意） |

**触らないもの**: `KINTONE_APP=631`（Security NEXT）、631/632 用トークン

### ローカル実行

```bash
cd ict-tech-digest-automation
cp .env.example .env
# .env を編集
npm ci
npm run collect
```

---

## 6. 運用・デプロイ（CIO 実施）

| 操作 | コマンド |
|------|----------|
| 収集（手動） | `npm run ict-digest:collect`（ローカルは **`ICT_DIGEST_STORE_APP_ID=685`** 推奨） |
| ドライラン | `ICT_DRY_RUN=true` + 上記 collect |
| 685 カテゴリ7種 | `npx dotenv -e ../.env -e ../.env.proxy -- node scripts/update-685-category-dropdown.mjs`（`ict-tech-digest-automation/` 内） |
| 掲示板デプロイ | `npm run cio:preflight:686 -- --note "…"` → `npm run deploy:686` |
| GHA ワークフロー | `.github/workflows/ict-tech-digest-collect.yml` |
| リポ | `https://github.com/mhamad4968/GitHub-Actions`（`kintone-ai-lab` と同期） |

---

## 7. トラブルシュート

| 症状 | 確認 |
|------|------|
| GHA が `GEMINI_API_KEY` で失敗 | `kintone-collect` Environment に Secret 設定 |
| GHA が kintone `CB_VA01` | 685 の `url` **unique オフ・最大 512**（MSRC 長 URL は **NVD 差し替え**）。ログに **index / urlLen / category**。一括失敗時は **1 件ずつ切り分け**（`kintone-store.ts`） |
| 掲示板が「データがありません」とカード二重 | 686 customize 未デプロイ or 旧 BUILD。Ctrl+F5 |
| 掲示板「取得に失敗」 | ログインユーザーに **685 閲覧権限** があるか |
| 本日5件あるのに追加されない | 仕様どおりスキップ。翌日 10:00 まで待つか翌枠を待つ |
| RSS 取得失敗（ログ） | 該当 URL が 404 の場合は `config.ts` から差し替え |

---

## 8. 変更・相談時の参照

| 変更したい内容 | 主な編集先 |
|----------------|------------|
| RSS ソース追加 | `ict-tech-digest-automation/src/lib/config.ts` |
| 厳選基準・要約形式 | `ict-tech-digest-automation/src/lib/gemini-curate.ts` |
| 1日件数・日付ロジック | `ict-tech-digest-automation/src/index.ts`・`kintone-store.ts` |
| 掲示板 UI | `customize/686/desktop.js` |
| スケジュール | `.github/workflows/ict-tech-digest-collect.yml` |

追加のメディア・選定基準の変更は、本書を更新したうえで CIO に相談。

---

## 9. 将来課題（バックログ）

| ID | 課題 | 優先度 | 備考 |
|----|------|--------|------|
| ICT-BL-01 | 部員フィードバックの収集ループ（運用改善） | 中 | 別チケット可 |
| ICT-BL-02 | 685/686 閲覧権限・Space 48 権限の定期確認 | 低 | 今後検討 |
| ICT-BL-03 | 12ヶ月超の類似記事再登録（URL 別） | 低 | 当面は 12ヶ月+150件で許容 |

---

## 10. 変更履歴（抜粋）

| 日付 | 内容 |
|------|------|
| 2026-05-16 | 初版・CEO GO。685/686 分離、Gemini 厳選、GHA 2回/日 |
| 2026-05-16 | OpenAI → Gemini。URL 64文字制限対応（685 url unique オフ） |
| 2026-05-16 | 掲示板 v2–v4（全幅UI・検索上部・業務向け文言） |
| 2026-05-16 | RSS 20本化（MSRC Update Guide・ASCII・ZDNet・日経 xTECH 等） |
| 2026-05-16 | 厳選プロンプト【事象】【影響】【推奨】・「今日のインフラ・PC最重要」 |
| 2026-05-16 | **完了**: 686 v7（検索↔今日の厳選連動）・`overview-format`・685 専用トークンガード・RSS 耐障害・`1ef78c1` push |
| 2026-05-16 | GHA Secrets: `KINTONE_API_TOKEN_ICT_COLLECT` / `ICT_DIGEST_STORE_APP_ID` 設定済。`ICT_RSS_FEED_URLS` は未設定＝DEFAULT 28 本 |
| 2026-05-17 | CEO 仕様合意 #1〜#10 完了。686 v8 deploy（本日最大5件注記）。GO 前3点は AI チーム確定。netsecurity RSS 候補: `scan.netsecurity.ne.jp/rss/index.rdf` |
| 2026-05-17 | 実装・本番切替完了（`84c4f77`）。685 7種・GHA dry-run/本番 SUCCESS・686 v9・**§2.3 追記** |
| 2026-05-17 | CEO 目視 OK — **v2 レーンクローズ** |
