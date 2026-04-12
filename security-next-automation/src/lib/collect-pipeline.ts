/**
 * 631 ニュース収集のパイプライン用「型」と責務境界。
 * ステップログは [Pipeline] で統一し、Actions / エージェントが追いやすくする。
 */

/** 1 ステップを表すラベル（ログ・デバッグ用・拡張時はここに追加） */
export type CollectPipelineStep =
  | "Config"
  | "FetchRss"
  | "FetchNvd"
  | "Normalize"
  | "MergeSort"
  | "DedupeUrl"
  | "KintoneExistingFilter"
  | "CandidateTrim"
  | "KeywordStats"
  | "KeywordPick"
  | "Enrichment"
  | "KintonePost"
  | "Notify";

/** RSS 正規化前の生アイテム形（rss-parser 由来・collect 側で補完） */
export type RssItemLike = {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
};

/** RSS / NVD を統合した候補 1 行（キーワード選別・投入の共通型） */
export type NormalizedNewsRow = {
  title: string;
  link: string;
  publishedDate: string;
  digestFullText: string;
  sortTimeMs: number;
  source: "rss" | "nvd";
};

/**
 * 解析しやすい 1 行ログ。値に改行や長文を入れないこと。
 */
export function logPipeline(step: CollectPipelineStep, fields: Record<string, string | number>): void {
  const body = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  console.log(`[Pipeline] Step: ${step}, ${body}`);
}

/** 概要欄末尾の出典行（RSS は Security NEXT、NVD は NIST） */
export function overviewFooterSource(row: NormalizedNewsRow): string {
  return row.source === "nvd" ? "NVD（NIST CVE）" : "Security NEXT";
}
