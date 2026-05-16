# 最新ICT情報掲示板 — 仕様正本

> **CEO GO**: 2026-05-16  
> **Space**: [Space 48](https://jbis-kintone.cybozu.com/k/#/space/48)  
> **台帳**: `kintone-apps.md`

## 1. アーキテクチャ（682/683 分離型）

| 役割 | アプリ名 | アプリ ID | 利用者 |
|------|----------|-----------|--------|
| 正本（蓄積・自動登録） | 最新ICT情報掲示板（収集用） | **685** | GHA / CIO のみ |
| ダッシュ（閲覧・過去検索） | 最新ICT情報掲示板 | **686** | 部員（Space 48 入口） |

- データ連携: **レコードコピーなし**。686 の `customize` が **685 を REST 読取**。
- ポータル: **686 の URL のみ**掲載。685 は非掲載。

## 2. 自動収集

- **実行**: 1日2回（10:00 / 20:00 JST）= GitHub Actions cron `0 1 * * *` / `0 11 * * *` UTC
- **パッケージ**: `ict-tech-digest-automation/`
- **1日上限**: `published_at` = JST 当日 の件数 ≤ **5**。超過時はログのみで終了。
- **URL**: 全期間で一意（再登録しない）。
- **優先**: 未登録 URL → RSS 新しい順 → OpenAI 重要度スコア → 残枠ぶん登録。
- **AI**: **Gemini**（`GEMINI_API_KEY`・モデルは `GEMINI_MODEL` または flash 系フォールバック）、要約3行＋カテゴリ（日本語）。

### 2.1 デフォルト RSS

| ソース | URL |
|--------|-----|
| Qiita | `https://qiita.com/popular-items/feed` |
| Zenn | `https://zenn.dev/feed` |
| はてな IT 人気 | `https://b.hatena.ne.jp/hotentry/it.rss` |
| ITmedia AIT | `https://rss.itmedia.co.jp/rss/2.0/ait.xml` |

## 3. 正本アプリ（685）フィールド

| フィールドコード | 型 | ラベル |
|------------------|-----|--------|
| `title` | 文字列1行 | タイトル |
| `url` | リンク | URL（**アプリ側**で全期間一意。kintone の重複禁止は LINK 64 文字制限のためオフ） |
| `published_at` | 日付 | 公開日 |
| `overview` | 文字列複数行 | 概要 |
| `category` | ドロップダウン | カテゴリ |

### カテゴリ選択肢（API 値 = 表示名）

`AI・LLM` / `インフラ・クラウド` / `開発トレンド` / `ITツール・ガジェット` / `その他`

## 4. ダッシュ（686）閲覧要件

- 上部: 本日・直近7日のヒーロー
- 絞り込み: カテゴリ、公開日 From–To
- 検索: タイトル＋概要（部分一致）
- 一覧: `published_at` 降順、ページング（100件単位）
- 正本アプリ ID: `window.ICT_DIGEST_STORE_APP` または定数 **685**

## 5. 環境変数（collect）

| 変数 | 説明 |
|------|------|
| `KINTONE_DOMAIN` | 例 `jbis-kintone.cybozu.com` |
| `KINTONE_APP_ID` | **685** |
| `KINTONE_API_TOKEN_COLLECT` | 685 書込トークン |
| `GEMINI_API_KEY` | Gemini（Security NEXT と同じ Secret 名で可） |
| `GEMINI_MODEL` | 任意（未設定時は flash 系を順次試行） |
| `ICT_DIGEST_BOARD_APP_ID` | **686**（ダッシュ・任意・ログ用） |
| `RSS_FEED_URLS` | 複数 URL（改行・カンマ区切り） |

## 6. デプロイ

- collect: `npm --prefix ict-tech-digest-automation run collect`
- ダッシュ: `npm run cio:preflight:686 -- --note "…"` → `npm run deploy:686`
- GHA: `.github/workflows/ict-tech-digest-collect.yml`
