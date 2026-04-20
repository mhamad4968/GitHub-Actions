# 631（Security NEXT ニュース）日曜までに運用開始する — 実施チェックリスト

**ゴール**: [ニュースアプリ 631](https://jbis-kintone.cybozu.com/k/631/) に、自動収集（`collect`）でレコードが登録されること。  
**正本（設定の名前と値）**: [`security-next-automation/docs/collect-env-settings.md`](../security-next-automation/docs/collect-env-settings.md)  
**トラブル時**: [`security-news-app-troubleshoot.md`](security-news-app-troubleshoot.md)

---

## 前提（最初に確認）

- [ ] ブラウザで **631 にログイン**できる（[アプリ URL](https://jbis-kintone.cybozu.com/k/631/) はログイン後に開く）。
- [ ] 自動化用 API トークンを発行できる権限がある（**アプリの設定 → API トークン**）。

---

## Phase 1 — 必須（まずここまで＝「動く」）

### 1. kintone（631）側

- [ ] フィールドコードが設計どおりか粗く確認する（`title`・`article_url`・`published_date`・`summary`・`digest` 等）。  
  **参照**: [`security-next-automation/docs/security-next-news-app-design.csv`](../security-next-automation/docs/security-next-news-app-design.csv)
- [ ] **API トークン**を発行しコピーする。権限に **レコードの参照・追加** が含まれること。

### 2. ローカルで一度だけ成功させる（土曜昼まで推奨）

リポジトリ **ルート**で作業する。

- [ ] `security-next-automation/.env` を作る（`cp .env.example .env`）。
- [ ] 最低限、次の **3 行**を埋める（ホストは **https なし**）:

```env
KINTONE_DOMAIN=jbis-kintone.cybozu.com
KINTONE_APP_ID=631
KINTONE_API_TOKEN_COLLECT=（631 用トークン）
```

- [ ] 次が **エラー終了せず**、ログ末尾付近に **登録完了** や **追加なし** まで進む:

```bash
cd （リポジトリの kintone-ai-lab ルート）
npm run security-next:install
npm run security-next:collect
```

- [ ] **「追加なし」だけのとき**: Actions 未設定でも「壊れていない」状態。  
  - キーワードに合う新規記事が無い／既に同じ URL が 631 にある、など。**[Pipeline] KeywordPick** の `ToAdd` をログで確認（[`README` のパイプラインログ説明](../security-next-automation/README.md)）。

### 3. GitHub Actions（日曜の定時までに必須）

- [ ] リポジトリ → **Settings** → **Environments** → **`kintone-collect`** を作成（なければ）。
- [ ] **Environment secrets** に、ローカルと**同じ内容**で少なくとも次を登録:

| Name（スペル厳密） | 値 |
|--------------------|-----|
| `KINTONE_DOMAIN` | `jbis-kintone.cybozu.com` |
| `KINTONE_APP` | `631`（※名前は `KINTONE_APP_ID` **ではない**） |
| `KINTONE_API_TOKEN_COLLECT` | 631 用トークン |

- [ ] **Actions** → **`security-next-daily-collect`** → **Run workflow** で **手動実行**し、**緑（成功）**になる。
- [ ] ログ冒頭で `KINTONE_*_defined` が **true** になっている。

### 4. 日曜の確認

- [ ] **定時**（README どおり JST **10:00 / 17:00** 相当の UTC cron）の実行が走るか、または土日の手動実行で 631 に意図した増え方がしているかを確認。
- [ ] 失敗時は **メール / Webhook**（任意で `NOTIFY_WEBHOOK_URL`）を見る。

---

## Phase 2 — 任意（日曜までに間に合えば）

- [ ] **`GEMINI_API_KEY`**（Secret）… 概要・要約の体裁。無くても RSS ベースで登録は可能。
- [ ] **`GEMINI_MODEL`**（Repository **Variables**）… 429・404 時は [モデル一覧](https://ai.google.dev/gemini-api/docs/models) で使える ID に。
- [ ] **NVD 併用** … `COLLECT_NVD_ENABLE=1`（Variable）と `NVD_API_KEY`（Secret）。詳細は `collect-env-settings.md`。
- [ ] **`RSS_FEED_URLS`（Variable）** … 複数 RSS。空なら Security NEXT 既定フィード系が使われます。

---

## よくあるつまずき（短時間で直す）

| 兆候 | 確認すること |
|------|----------------|
| `KINTONE_APP_defined=false` | Secret 名が **`KINTONE_APP`** になっているか（`KINTONE_APP_ID` 単体では足りないことがある） |
| 環境変数エラー | `.env` は **`security-next-automation/.env`**（ルートの `.env` だけでは無い） |
| 631 に一件も増えないが成功 | **キーワード選別**／**既登録 URL**。ログの **`KeywordPick`** と **[Pipeline]** を読む |

---

## 632（週次要約）について

631 が回ってからでよいです。**`analyze`** 用に `KINTONE_REPORT_APP_ID`・632 用トークン・`GEMINI_API_KEY` が別途必要。まず **631 の定時 collect** を優先してください。

---

**締切イメージ**: **土曜中**に Phase 1 のローカル成功 ＋ GitHub 手動実行成功まで押し込み、**日曜**は定時実行と 631 の表示確認に回す、が無理のない流れです。
