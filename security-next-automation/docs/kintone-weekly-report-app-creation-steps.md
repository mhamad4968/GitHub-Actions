# ニュース週次要約用アプリ — kintone での作成手順

**ニュース保存アプリ（631 等）とは別アプリ**です。`analyze.ts` がここへ週次で 1 レコード追加します。

設計図（Excel 用 CSV）: **[`security-next-weekly-report-app-design.csv`](security-next-weekly-report-app-design.csv)**（UTF-8 BOM 付き）

コード上の正本: `src/lib/field-codes.ts` の `REPORT_FIELDS`

## 1. スペースを開く

ニュースアプリと同じスペース（例: `#/space/48`）でよいです。

## 2. アプリを新規作成

1. **アプリを追加** → はじめから作成。  
2. アプリ名の例: **ニュース週次要約**（任意。`KINTONE_SECURITY_NEXT_REPORT_APP_NAME` やスクリプトの既定とも揃えるとわかりやすい）

## 3. フォーム（必ず次の 2 フィールドだけ）

| 画面のラベル例 | フィールドコード（厳守） | kintone の型 |
|----------------|---------------------------|--------------|
| 対象週 | `target_week` | **日付** |
| 今週の傾向と対策 | `weekly_trend` | **リッチエディタ** |

1. フォームに **日付** を1つ追加 → フィールドコード `target_week`、ラベル例「対象週」  
2. **リッチエディタ** を1つ追加 → フィールドコード `weekly_trend`、ラベル例「今週の傾向と対策」  
3. 保存 → **設定を更新して利用**

## 4. API トークン

- **レコードの追加**（必須）、**レコードの閲覧**（推奨）  
- 既存トークンに **このアプリを追加**すれば、ニュース用と同じ `KINTONE_API_TOKEN` のまま運用可能。

## 5. 環境変数

- `KINTONE_REPORT_APP_ID` … このアプリの ID  
- GitHub Actions の `analyze` ジョブ用 Secrets にも同じ。

## 6. API でまとめて作る

```bash
cd /path/to/kintone-ai-lab
npm run setup:security-next-report-app
```

既定のアプリ名は **ニュース週次要約**（環境変数で変更可）。
