/**
 * RSS 取得検証（exit 0 = OK）
 * - コード既定フィード数（27本）の一致
 * - v2 代表4本の取得スモーク（JPCERT alert は対象外）
 * 用法: npm run rss:verify
 */
import { fetchFeedXml } from "../src/lib/rss-fetch.ts";
import { fetchAllFeeds } from "../src/lib/rss.ts";
import { resolveRssUrls } from "../src/lib/config.ts";

const EXPECTED_DEFAULT_RSS_COUNT = 27;

/** v2 代表（旧 jpcert alert は除外済み） */
const V2_SMOKE_FEEDS = [
  "https://qiita.com/popular-items/feed",
  "https://msrc.microsoft.com/feed/",
  "https://scan.netsecurity.ne.jp/rss/index.rdf",
  "https://rss.itmedia.co.jp/rss/2.0/ait.xml",
];

async function main() {
  let fail = 0;

  const savedIct = process.env.ICT_RSS_FEED_URLS;
  const savedLegacy = process.env.RSS_FEED_URLS;
  delete process.env.ICT_RSS_FEED_URLS;
  delete process.env.RSS_FEED_URLS;
  const defaultUrls = resolveRssUrls();
  if (savedIct !== undefined) process.env.ICT_RSS_FEED_URLS = savedIct;
  if (savedLegacy !== undefined) process.env.RSS_FEED_URLS = savedLegacy;

  if (defaultUrls.length !== EXPECTED_DEFAULT_RSS_COUNT) {
    fail++;
    console.error(
      "[NG] DEFAULT_RSS 件数:",
      defaultUrls.length,
      "期待:",
      EXPECTED_DEFAULT_RSS_COUNT,
    );
  } else {
    console.log("[OK] DEFAULT_RSS 件数 =", EXPECTED_DEFAULT_RSS_COUNT);
  }

  console.log("[verify] fetchAllFeeds (v2 smoke set) …");
  const articles = await fetchAllFeeds(V2_SMOKE_FEEDS);
  const byFeed = new Map();
  for (const a of articles) {
    byFeed.set(a.feedUrl, (byFeed.get(a.feedUrl) ?? 0) + 1);
  }
  for (const url of V2_SMOKE_FEEDS) {
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

  for (const url of V2_SMOKE_FEEDS) {
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
