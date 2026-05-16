/**
 * 最新ICT情報掲示板（収集用アプリ）へ RSS × OpenAI で自動登録する。
 * 1日最大5件（JST・published_at 基準）。URL は全期間で一意。
 */
import { loadConfig } from "./lib/config.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { todayJstYmd } from "./lib/jst-date.js";
import {
  addCuratedRecords,
  countTodayRecords,
  fetchExistingUrls,
  urlExists,
} from "./lib/kintone-store.js";
import { curateWithOpenAi } from "./lib/openai-curate.js";
import { dedupeAndSort, fetchAllFeeds } from "./lib/rss.js";

async function main(): Promise<void> {
  console.log("[ICT収集] 処理開始");
  const cfg = loadConfig();
  const client = createKintoneClient(cfg);
  const today = todayJstYmd();

  console.log(`[ICT収集] 正本アプリ=${cfg.storeAppId} 今日(JST)=${today}`);
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

  const existingUrls = await fetchExistingUrls(client, cfg);
  console.log(`[ICT収集] 登録済み URL 数（全期間）: ${existingUrls.size}`);

  const rawArticles = await fetchAllFeeds(cfg.rssFeedUrls);
  const merged = dedupeAndSort(rawArticles);
  const candidates = merged.filter((a) => !existingUrls.has(a.url));
  console.log(`[ICT収集] RSS 候補（未登録 URL）: ${candidates.length} 件`);

  if (candidates.length === 0) {
    console.log("[ICT収集] 新規候補がないため終了します。");
    return;
  }

  let picks;
  try {
    picks = await curateWithOpenAi(cfg, candidates, slots);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ICT収集] OpenAI 厳選に失敗しました。登録は行いません: ${msg}`);
    process.exitCode = 1;
    return;
  }

  if (picks.length === 0) {
    console.log("[ICT収集] OpenAI が登録対象を返さなかったため終了します。");
    return;
  }

  const toRegister = [];
  for (const p of picks) {
    if (await urlExists(client, cfg, p.url)) {
      console.log(`[ICT収集] 重複のためスキップ: ${p.url}`);
      continue;
    }
    toRegister.push({
      title: p.title,
      url: p.url,
      overview: p.overview,
      category: p.category,
    });
  }

  if (toRegister.length === 0) {
    console.log("[ICT収集] 登録対象が残らなかったため終了します。");
    return;
  }

  const ids = await addCuratedRecords(client, cfg, today, toRegister);
  console.log(`[ICT収集] 登録完了: ${ids.length} 件（レコード ID: ${ids.join(", ")}）`);
  console.log("[ICT収集] 処理終了");
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`[ICT収集] 致命的エラー: ${msg}`);
  process.exit(1);
});
