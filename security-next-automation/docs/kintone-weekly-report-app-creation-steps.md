# ニュース週次要約用アプリ — kintone での作成手順

**ニュース保存アプリ（631 等）とは別アプリ**です。`analyze.ts` がここへ週次でレコードを **新規追加または同一 `target_week` の更新（upsert）** します。

設計図（Excel 用 CSV）: **[`security-next-weekly-report-app-design.csv`](security-next-weekly-report-app-design.csv)**（UTF-8 BOM 付き）

コード上の正本: `src/lib/field-codes.ts` の `REPORT_FIELDS`

## 1. スペースを開く

ニュースアプリと同じスペース（例: `#/space/48`）でよいです。

## 2. アプリを新規作成

1. **アプリを追加** → はじめから作成。  
2. アプリ名の例: **ニュース週次要約**（任意。`KINTONE_SECURITY_NEXT_REPORT_APP_NAME` やスクリプトの既定とも揃えるとわかりやすい）

## 3. フォーム（フィールドコードは `field-codes.ts` / CSV と厳密に一致）

| 画面のラベル例 | フィールドコード | kintone の型 | 備考 |
|----------------|------------------|--------------|------|
| 対象週 | `target_week` | **日付** | Idempotency のキー（同一週は更新） |
| 今週の傾向と対策 | `weekly_trend` | **リッチエディタ** | 本文 |
| 週次サマリー1行 | `summary_one_line` | **文字列（1行）** | 一覧・通知向け（表示用） |
| 参照631件数（内部） | `internal_ref_news_count` | **数値** | 管理者向け・一覧では非表示推奨 |
| 参照631レコード番号最小（内部） | `internal_ref_record_id_min` | **数値** | 同上 |
| 参照631レコード番号最大（内部） | `internal_ref_record_id_max` | **数値** | 同上 |
| 分析実行日時（内部） | `internal_analysis_run_at` | **日付と時刻** | 同上 |
| GitHub run_id（内部） | `internal_github_run_id` | **文字列（1行）** | 同上 |

保存 → **設定を更新して利用**。

**既存アプリ（632）をすでに使っている場合**: 上表のうち足りないフィールドだけを追加してください（`analyze.ts` はすべてのコードを一度に書き込みます）。

## 4. API トークン

- **レコードの追加**・**レコードの編集**（同一週の更新に必須）、**レコードの閲覧**（推奨）  
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
