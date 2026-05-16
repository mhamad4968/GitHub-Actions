import Parser from "rss-parser";

import { stripHtmlToPlain } from "./text.js";

export type RssArticle = {
  title: string;
  url: string;
  publishedAt: string;
  snippet: string;
  sortTimeMs: number;
  feedUrl: string;
};

const parser = new Parser({
  timeout: 20000,
  headers: { "User-Agent": "ict-tech-digest-automation/1.0 (J-BIS internal)" },
});

function parsePubMs(item: Parser.Item): number {
  const raw = item.isoDate || item.pubDate;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

function itemUrl(item: Parser.Item): string {
  const link = (item.link || "").trim();
  if (link) return link;
  const guid = typeof item.guid === "string" ? item.guid.trim() : "";
  return guid.startsWith("http") ? guid : "";
}

/**
 * 複数 RSS フィードを取得し正規化する
 */
export async function fetchAllFeeds(feedUrls: string[]): Promise<RssArticle[]> {
  const rows: RssArticle[] = [];
  for (const feedUrl of feedUrls) {
    try {
      console.log(`[RSS] 取得開始: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items) {
        const url = itemUrl(item);
        const title = (item.title || "").trim();
        if (!url || !title) continue;
        const snippet = stripHtmlToPlain(
          item.contentSnippet || item.summary || item.content || "",
        ).slice(0, 800);
        const ms = parsePubMs(item);
        const publishedAt =
          ms > 0
            ? new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Tokyo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(new Date(ms))
            : "";
        rows.push({
          title,
          url,
          publishedAt,
          snippet,
          sortTimeMs: ms,
          feedUrl,
        });
      }
      console.log(`[RSS] 取得完了: ${feedUrl}（${feed.items.length} 件）`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[RSS] 取得失敗: ${feedUrl} — ${msg}`);
    }
  }
  return rows;
}

/** URL で重複排除し、新しい順 */
export function dedupeAndSort(articles: RssArticle[]): RssArticle[] {
  const byUrl = new Map<string, RssArticle>();
  for (const a of articles) {
    const prev = byUrl.get(a.url);
    if (!prev || a.sortTimeMs > prev.sortTimeMs) {
      byUrl.set(a.url, a);
    }
  }
  return [...byUrl.values()].sort((a, b) => b.sortTimeMs - a.sortTimeMs);
}
