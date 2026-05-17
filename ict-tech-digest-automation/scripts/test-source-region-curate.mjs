/**
 * v2.1 国内優先・DX国内限定の試験（kintone 登録なし・日次上限チェックなし）
 * 用法: ICT_DIGEST_STORE_APP_ID=685 npx tsx scripts/test-source-region-curate.mjs
 */
import { loadConfig } from "../src/lib/config.js";
import { createKintoneClient } from "../src/lib/kintone-client.js";
import { todayJstYmd, addDaysJstYmd } from "../src/lib/jst-date.js";
import { fetchRecentTitlesForDedup } from "../src/lib/kintone-store.js";
import { resolveArticleUrl } from "../src/lib/article-url.js";
import { curateWithGemini } from "../src/lib/gemini-curate.js";
import { dedupeAndSort, fetchAllFeeds } from "../src/lib/rss.js";
import { isDomesticArticleUrl } from "../src/lib/source-region.js";
import { DX_DOMESTIC_ONLY_CATEGORY } from "../src/lib/field-codes.js";

const SLOTS = 3;

function filterRecent(articles, today) {
  const cutoff7 = addDaysJstYmd(today, -7);
  const recent = articles.filter((a) => !a.publishedAt || a.publishedAt >= cutoff7);
  if (recent.length >= 15) return recent;
  const cutoff14 = addDaysJstYmd(today, -14);
  return articles.filter((a) => !a.publishedAt || a.publishedAt >= cutoff14);
}

async function main() {
  console.log("[試験] v2.1 国内優先・DX国内限定 — 開始");
  const cfg = loadConfig();
  const client = createKintoneClient(cfg);
  const today = todayJstYmd();

  const titles = await fetchRecentTitlesForDedup(client, cfg, today);
  console.log(`[試験] 類似除外タイトル: ${titles.length} 件`);

  const raw = await fetchAllFeeds(cfg.rssFeedUrls);
  const merged = dedupeAndSort(raw);
  const candidates = filterRecent(merged, today)
    .slice(0, 80)
    .map((a) => {
      const url = resolveArticleUrl(a.url, a.title, a.snippet);
      return url === a.url ? a : { ...a, url };
    });
  console.log(`[試験] 厳選候補: ${candidates.length} 件（最大80）`);

  const domestic = candidates.filter((c) => isDomesticArticleUrl(c.url)).length;
  console.log(`[試験] 候補の国内URL: ${domestic}/${candidates.length}`);

  const picks = await curateWithGemini(cfg, candidates, SLOTS, titles);
  console.log(`[試験] Gemini 厳選結果: ${picks.length} 件`);
  for (const [i, p] of picks.entries()) {
    const dom = isDomesticArticleUrl(p.url);
    const dxOk = p.category !== DX_DOMESTIC_ONLY_CATEGORY || dom;
    console.log(
      `[試験] [${i + 1}] score=${p.importanceScore} domestic=${dom} dxOk=${dxOk}`,
    );
    console.log(`       category=${p.category}`);
    console.log(`       url=${p.url}`);
    console.log(`       title=${p.title.slice(0, 60)}…`);
  }

  const dxViolations = picks.filter(
    (p) => p.category === DX_DOMESTIC_ONLY_CATEGORY && !isDomesticArticleUrl(p.url),
  );
  if (dxViolations.length > 0) {
    console.error("[試験] NG: DXカテゴリに海外URLが残っています");
    process.exit(1);
  }
  console.log("[試験] OK: DXカテゴリの海外URLなし");
  console.log("[試験] 完了（kintone 登録なし）");
}

main().catch((e) => {
  console.error("[試験] 失敗:", e instanceof Error ? e.message : e);
  process.exit(1);
});
