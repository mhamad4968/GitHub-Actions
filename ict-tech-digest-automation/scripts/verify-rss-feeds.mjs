/**
 * 問題になりやすい RSS の取得検証（exit 0 = 全件 OK）
 * 用法: npm run rss:verify
 */
import { fetchFeedXml } from "../src/lib/rss-fetch.ts";
import { fetchAllFeeds } from "../src/lib/rss.ts";

/** 以前スモークで失敗していた4本（旧 URL 含む） */
const LEGACY_PROBLEM_FEEDS = [
  "https://qiita.com/popular-items/feed",
  "https://msrc.microsoft.com/blog/rss/",
  "https://www.jpcert.or.jp/rss/jpcert.rdf",
  "https://rss.itmedia.co.jp/rss/2.0/nw.xml",
];

async function main() {
  let fail = 0;

  console.log("[verify] fetchAllFeeds (legacy problem set) …");
  const articles = await fetchAllFeeds(LEGACY_PROBLEM_FEEDS);
  const byFeed = new Map();
  for (const a of articles) {
    byFeed.set(a.feedUrl, (byFeed.get(a.feedUrl) ?? 0) + 1);
  }
  for (const url of LEGACY_PROBLEM_FEEDS) {
    const { resolveFeedUrl } = await import("../src/lib/rss-fetch.ts");
    const canonical = resolveFeedUrl(url);
    const n = byFeed.get(canonical) ?? 0;
    if (n > 0) {
      console.log("[OK]", url, "→", canonical, `(${n} 件)`);
    } else {
      fail++;
      console.error("[NG]", url, "→", canonical, "(0 件)");
    }
  }
  console.log("[verify] article_count=", articles.length);

  for (const url of LEGACY_PROBLEM_FEEDS) {
    try {
      await fetchFeedXml(url);
    } catch (e) {
      console.warn(
        "[warn] fetchFeedXml 単体失敗（パイプラインで取得済みなら許容）:",
        url,
        "—",
        e instanceof Error ? e.message : e,
      );
    }
  }

  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
