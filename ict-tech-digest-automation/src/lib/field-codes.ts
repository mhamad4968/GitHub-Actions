/** 正本アプリ（685）のフィールドコード */
export const ICT_FIELDS = {
  title: "title",
  url: "url",
  published_at: "published_at",
  overview: "overview",
  category: "category",
} as const;

/** 掲示板フィルタ・Gemini 厳選で使用（685 ドロップダウンと同期すること） */
export const ICT_CATEGORIES = [
  "インフラ・通信・端末",
  "開発トレンド",
  "Box・SaaS・文書管理",
  "DX人材・IT資格・組織",
  "セキュリティ製品・技術",
  "その他",
] as const;

export type IctCategory = (typeof ICT_CATEGORIES)[number];

/** v2.1: このカテゴリは国内ソースの記事のみ採用可 */
export const DX_DOMESTIC_ONLY_CATEGORY: IctCategory = "DX人材・IT資格・組織";

/** 旧17種 → 新7種（686 表示・フィルタ用。685 既存レコードは旧値のまま） */
export const LEGACY_CATEGORY_TO_NEW: Record<string, IctCategory> = {
  "Microsoft・Windows": "インフラ・通信・端末",
  "PC・端末": "インフラ・通信・端末",
  "サーバー・インフラ": "インフラ・通信・端末",
  "ネットワーク・通信": "インフラ・通信・端末",
  "インフラ・クラウド": "インフラ・通信・端末",
  "セキュリティ・脆弱性": "セキュリティ製品・技術",
  "プログラム・開発": "開発トレンド",
  "開発トレンド": "開発トレンド",
  "ITツール・ガジェット": "開発トレンド",
  "SaaS・文書管理": "Box・SaaS・文書管理",
  "資格・リスキリング": "DX人材・IT資格・組織",
  "DX人材・組織": "DX人材・IT資格・組織",
  "情シス・IT部門": "DX人材・IT資格・組織",
  "AI・LLM": "その他",
  "ITベンダー・DX": "その他",
  "IPA・政策調査": "その他",
  その他: "その他",
};

export function normalizeCategory(raw: string): IctCategory | null {
  const t = raw.trim();
  if ((ICT_CATEGORIES as readonly string[]).includes(t)) {
    return t as IctCategory;
  }
  return LEGACY_CATEGORY_TO_NEW[t] ?? null;
}
