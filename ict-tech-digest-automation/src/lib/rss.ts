import Parser from "rss-parser";

import { fetchFeedXml, resolveFeedUrl } from "./rss-fetch.js";
import { stripHtmlToPlain } from "./text.js";

export type RssArticle = {
  title: string;
  url: string;
  publishedAt: string;
  snippet: string;
  sortTimeMs: number;
  feedUrl: string;
};

export type RssFetchReport = {
  ok: number;
  fail: number;
  failedUrls: string[];
};

const parser = new Parser({
  timeout: 30000,
  headers: {
    "User-Agent": "ict-tech-digest-automation/1.0 (J-BIS internal)",
  },
});

let lastFetchReport: RssFetchReport = { ok: 0, fail: 0, failedUrls: [] };

export function getLastRssFetchReport(): RssFetchReport {
  return { ...lastFetchReport, failedUrls: [...lastFetchReport.failedUrls] };
}

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

function mapFeedItems(feed: Parser.Output<unknown>, feedUrl: string): RssArticle[] {
  const rows: RssArticle[] = [];
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
  return rows;
}

/**
 * 複数 RSS フィードを取得し正規化する（1本失敗しても他は継続）
 */
export async function fetchAllFeeds(feedUrls: string[]): Promise<RssArticle[]> {
  const rows: RssArticle[] = [];
  const report: RssFetchReport = { ok: 0, fail: 0, failedUrls: [] };

  for (const feedUrl of feedUrls) {
    const canonical = resolveFeedUrl(feedUrl);
    try {
      console.log(`[RSS] 取得開始: ${feedUrl}`);
      const xml = await fetchFeedXml(feedUrl);
      const feed = await parser.parseString(xml);
      rows.push(...mapFeedItems(feed, canonical));
      report.ok++;
      console.log(`[RSS] 取得完了: ${canonical}（${feed.items.length} 件）`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      report.fail++;
      report.failedUrls.push(canonical);
      console.error(`[RSS] 取得失敗: ${canonical} — ${msg}`);
    }
  }

  lastFetchReport = report;
  if (report.fail > 0) {
    console.warn(
      `[RSS] サマリ: 成功 ${report.ok} / 失敗 ${report.fail} — ${report.failedUrls.join(", ")}`,
    );
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
