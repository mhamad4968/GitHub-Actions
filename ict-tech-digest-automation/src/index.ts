/**
 * 最新ICT情報掲示板（収集用アプリ）へ RSS × Gemini で自動登録する。
 * 1日最大5件（JST・published_at 基準）。URL は全期間で一意。
 * ICT_DRY_RUN=true のとき kintone への登録は行わない。
 */
import { loadConfig } from "./lib/config.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { addDaysJstYmd, todayJstYmd } from "./lib/jst-date.js";
import type { RssArticle } from "./lib/rss.js";
import {
  addCuratedRecords,
  countTodayRecords,
  fetchExistingUrls,
  fetchRecentTitlesForDedup,
  urlExists,
} from "./lib/kintone-store.js";
import { resolveArticleUrl } from "./lib/article-url.js";
import { curateWithGemini } from "./lib/gemini-curate.js";
import { dedupeAndSort, fetchAllFeeds, getLastRssFetchReport } from "./lib/rss.js";

/** 厳選候補は直近の記事に絞る（「今日一番」の精度向上） */
function filterRecentForCuration(articles: RssArticle[], today: string): RssArticle[] {
  const cutoff7 = addDaysJstYmd(today, -7);
  const recent = articles.filter((a) => !a.publishedAt || a.publishedAt >= cutoff7);
  if (recent.length >= 15) return recent;
  const cutoff14 = addDaysJstYmd(today, -14);
  return articles.filter((a) => !a.publishedAt || a.publishedAt >= cutoff14);
}

function logDryRunPayload(
  items: Array<{
    title: string;
    url: string;
    overview: string;
    category: string;
    publishedAt: string;
  }>,
): void {
  console.log("[ICT収集] ドライラン: 以下を登録予定でした（kintone POST は未実行）:");
  for (const [i, item] of items.entries()) {
    console.log(
      `[ICT収集] ドライラン [${i + 1}/${items.length}]`,
      JSON.stringify(item, null, 2),
    );
  }
}

async function main(): Promise<void> {
  console.log("[ICT収集] 処理開始");
  const cfg = loadConfig();
  const client = createKintoneClient(cfg);
  const today = todayJstYmd();

  if (cfg.dryRun) {
    console.log("[ICT収集] ドライランモード（ICT_DRY_RUN=true）: kintone への登録は行いません。");
  }

  console.log(
    `[ICT収集] 正本アプリ=${cfg.storeAppId} 今日(JST)=${today} RSSフィード数=${cfg.rssFeedUrls.length} モデル=${cfg.geminiModel}`,
  );
  if (cfg.boardAppId) {
    console.log(`[ICT収集] ダッシュアプリ=${cfg.boardAppId}`);
  }

  const todayCount = await countTodayRecords(client, cfg, today);
  console.log(`[ICT収集] 本日の登録済み件数: ${todayCount} / ${cfg.dailyMaxRecords}`);

  if (todayCount >= cfg.dailyMaxRecords) {
    console.log(
      `[ICT収集] 本日は既に ${cfg.dailyMaxRecords} 件登録済みのためスキップして終了します。`,
    );
    return;
  }

  const slots = cfg.dailyMaxRecords - todayCount;
  console.log(`[ICT収集] 残り登録枠: ${slots} 件`);

  let registeredTitles: string[];
  try {
    registeredTitles = await fetchRecentTitlesForDedup(client, cfg, today);
    console.log(
      `[ICT収集] 類似除外用タイトル: 過去12ヶ月から ${registeredTitles.length} 件取得（プロンプト最大150件）`,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ICT収集] 登録済みタイトル取得に失敗しました。登録は行いません: ${msg}`);
    process.exitCode = 1;
    return;
  }

  const existingUrls = await fetchExistingUrls(client, cfg);
  console.log(`[ICT収集] 登録済み URL 数（全期間）: ${existingUrls.size}`);

  const rawArticles = await fetchAllFeeds(cfg.rssFeedUrls);
  const rssReport = getLastRssFetchReport();
  if (rssReport.fail > 0) {
    console.warn(
      `[ICT収集] RSS 一部失敗: 成功 ${rssReport.ok} / 失敗 ${rssReport.fail}`,
    );
  }
  const merged = dedupeAndSort(rawArticles);
  const unregistered = merged.filter((a) => !existingUrls.has(a.url));
  const candidates = filterRecentForCuration(unregistered, today).map((a) => {
    const url = resolveArticleUrl(a.url, a.title, a.snippet);
    return url === a.url ? a : { ...a, url };
  });
  console.log(
    `[ICT収集] RSS 横断 ${cfg.rssFeedUrls.length} 本 → 未登録 ${unregistered.length} 件 → 厳選候補（直近） ${candidates.length} 件`,
  );

  if (candidates.length === 0) {
    console.log("[ICT収集] 新規候補がないため終了します。");
    return;
  }

  let picks;
  try {
    picks = await curateWithGemini(cfg, candidates, slots, registeredTitles);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ICT収集] Gemini 厳選に失敗しました。登録は行いません: ${msg}`);
    process.exitCode = 1;
    return;
  }

  if (picks.length === 0) {
    console.log("[ICT収集] Gemini が登録対象を返さなかったため終了します。");
    return;
  }

  const toRegister = [];
  for (const p of picks) {
    if (await urlExists(client, cfg, p.url)) {
      console.log(`[ICT収集] 重複のためスキップ: ${p.url}`);
      continue;
    }
    const url = resolveArticleUrl(p.url, p.title, p.overview);
    if (url !== p.url.trim()) {
      console.log(`[ICT収集] URL を NVD に差し替え: ${p.url} → ${url}`);
    }
    toRegister.push({
      title: p.title,
      url,
      overview: p.overview,
      category: p.category,
      publishedAt: today,
    });
  }

  if (toRegister.length === 0) {
    console.log("[ICT収集] 登録対象が残らなかったため終了します。");
    return;
  }

  if (cfg.dryRun) {
    logDryRunPayload(toRegister);
    console.log("[ICT収集] ドライランのため正常終了（登録件数=0）");
    console.log("[ICT収集] 処理終了");
    return;
  }

  let ids: number[];
  try {
    ids = await addCuratedRecords(client, cfg, today, toRegister);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ICT収集] kintone 登録に失敗しました: ${msg}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[ICT収集] 登録完了: ${ids.length} 件（レコード ID: ${ids.join(", ")}）`);
  console.log("[ICT収集] 処理終了");
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`[ICT収集] 致命的エラー: ${msg}`);
  process.exit(1);
});
