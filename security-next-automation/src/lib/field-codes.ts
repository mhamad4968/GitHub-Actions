/**
 * kintone フォームのフィールドコード（アプリ作成時にこの名前でそろえること）
 * ニュース正本: docs/security-next-news-app-design.csv
 * 週次要約アプリ正本: docs/security-next-weekly-report-app-design.csv
 */
export const NEWS_FIELDS = {
  title: "title",
  articleUrl: "article_url",
  /** RSS の公開日を JST の日付のみで格納（kintone の「日付」型） */
  publishedDate: "published_date",
  summary: "summary",
  /** collect では空で投入。手入力・別処理で追記 */
  digest: "digest",
} as const;

/** ニュース週次要約用アプリ（ニュース本体とは別アプリ）。analyze.ts が使用 */
export const REPORT_FIELDS = {
  targetWeek: "target_week",
  weeklyTrend: "weekly_trend",
} as const;

/** クエリでつかう作成日時（日本語環境の標準フィールドコード） */
export const CREATED_TIME_CODE = "作成日時";
