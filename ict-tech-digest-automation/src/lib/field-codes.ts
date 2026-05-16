/** 正本アプリ（685）のフィールドコード */
export const ICT_FIELDS = {
  title: "title",
  url: "url",
  published_at: "published_at",
  overview: "overview",
  category: "category",
} as const;

/**
 * 掲示板フィルタ・Gemini 厳選で使用（685 ドロップダウンと同期すること）
 * 先頭7種が新ジャンル。末尾3種は既存レコード互換用。
 */
export const ICT_CATEGORIES = [
  "Microsoft・Windows",
  "PC・端末",
  "サーバー・インフラ",
  "ネットワーク・通信",
  "セキュリティ・脆弱性",
  "プログラム・開発",
  "ITベンダー・DX",
  "AI・LLM",
  "インフラ・クラウド",
  "開発トレンド",
  "ITツール・ガジェット",
  "その他",
] as const;

export type IctCategory = (typeof ICT_CATEGORIES)[number];
