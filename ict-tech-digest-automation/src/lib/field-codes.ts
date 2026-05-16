/** 正本アプリ（685）のフィールドコード */
export const ICT_FIELDS = {
  title: "title",
  url: "url",
  published_at: "published_at",
  overview: "overview",
  category: "category",
} as const;

export const ICT_CATEGORIES = [
  "AI・LLM",
  "インフラ・クラウド",
  "開発トレンド",
  "ITツール・ガジェット",
  "その他",
] as const;

export type IctCategory = (typeof ICT_CATEGORIES)[number];
