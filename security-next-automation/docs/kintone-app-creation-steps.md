# Security NEXT ニュース — kintone での作成手順

設計図（項目一覧）は同フォルダの **`security-next-news-app-design.csv`** を Excel で開いて利用できます（先頭列は UTF-8 BOM 付きで文字化けしにくくしてあります）。

## 1. スペースを開く

1. kintone にログインする。  
2. 作成先のスペースを開く（例: `https://jbis-kintone.cybozu.com/k/#/space/48`）。

## 2. アプリを新規作成する

1. スペース内の **「アプリを追加」**（または同等のメニュー）を選ぶ。  
2. **「はじめから作成」** などで空のアプリを作る。  
3. アプリ名を入力する（例: **Security NEXT ニュース**）。

## 3. フォームにフィールドを並べる

1. アプリの **設定**（歯車）→ **フォーム** を開く。  
2. CSV の行に従い、次を **1つずつ** 配置する。  
   - **タイトル** … 文字列（1行）  
   - **URL** … 文字列（1行）  
   - **公開日** … 日付  
   - **概要** … 文字列（複数行）  
   - **要約** … 文字列（複数行）  
3. 各フィールドの **設定** を開き、**フィールドコード** を CSV の「フィールドコード」列どおりにする（例: `title`, `article_url`, `published_date`, `summary`, `digest`）。  
   - **URL** フィールドでは、運用方針に応じて **「値の重複を禁止」** をオンにする。  
4. **保存** し、アプリを **設定を更新して利用**（公開）する。

## 4. API で書き込む場合（GitHub Actions 等）

1. **設定** → **API トークン** でトークンを発行する。  
2. トークンに少なくとも **レコードの閲覧** と **レコードの追加** を付与する（重複確認で閲覧が必要）。  
3. アプリの **アクセス権** で、API 利用ユーザーまたは **Everyone** など、運用に合った閲覧・追加権を付与する。

## 5. 自動収集スクリプト（collect.ts）との対応

`collect.ts` と `field-codes.ts` は次の 5 コードに統一されています。

| 内容 | フィールドコード | 型 |
|------|------------------|-----|
| タイトル | `title` | 文字列（1行） |
| URL | `article_url` | 文字列（1行） |
| 公開日（JST・暦日） | `published_date` | **日付** |
| 概要 | `summary` | 文字列（複数行） |
| 要約 | `digest` | 文字列（複数行・追加時は**空**、あとから編集可） |

## 6. 一括でアプリとフィールドを作る（上級者向け）

スペース 48 向けに、管理者認証でフォームまで組み立てるスクリプトがあります。

```bash
cd /path/to/kintone-ai-lab
npm run setup:security-next-apps
```

ニュースアプリは **`published_date`（日付）**・**`digest`（要約）** まで含みます（上表と一致）。

**ニュース週次要約用アプリ**（別アプリ・フィールド 2 つのみ）の手順と CSV は **[`kintone-weekly-report-app-creation-steps.md`](kintone-weekly-report-app-creation-steps.md)** / **[`security-next-weekly-report-app-design.csv`](security-next-weekly-report-app-design.csv)**。コマンドだけ先に実行する場合は `npm run setup:security-next-report-app`。
