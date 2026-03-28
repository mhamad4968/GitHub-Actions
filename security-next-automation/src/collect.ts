/**
 * Security NEXT（既定 RSS）から記事一覧を取得し、kintone のニュースアプリ（例: 631）へ未登録分だけ追加する。
 * 重複判定はフィールド article_url の完全一致（kintone 上に同じ URL があればスキップ）。
 */
import Parser from "rss-parser";

import { loadConfig } from "./lib/config.js";
import { NEWS_FIELDS } from "./lib/field-codes.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { notifyFailure } from "./lib/notify.js";
import { escapeKintoneQueryString, stripHtmlToPlain, truncateForLlm } from "./lib/text.js";

/** 1 回の実行で kintone に送る件数の上限（API・負荷用。0 または未設定で無制限に近い扱い） */
const maxNewEnv = process.env.COLLECT_MAX_NEW_PER_RUN?.trim();
const MAX_NEW_PER_RUN = maxNewEnv && /^\d+$/.test(maxNewEnv) ? Math.max(0, parseInt(maxNewEnv, 10)) : 0;

/** RSS 取得のタイムアウト（ミリ秒） */
const rssParser = new Parser({
  timeout: 30_000,
  headers: { "User-Agent": "security-next-automation/1.0 (kintone GitHub Actions)" },
});

type RssItem = {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
};

/** RSS 1 件を kintone 用に正規化した中間データ */
type NormalizedNewsRow = {
  title: string;
  link: string;
  publishedDate: string;
  summaryText: string;
  sortTimeMs: number;
};

/**
 * 1 記事から「このレコードの URL」と決める。link 優先、無ければ guid が http(s) ならそれを使う。
 */
function resolveArticleUrl(item: RssItem): string | null {
  const raw = item.link?.trim() || "";
  if (raw.length > 0) return raw;
  const g = item.guid?.trim() || "";
  if (/^https?:\/\//i.test(g)) return g;
  return null;
}

/** 並び替え用。isoDate / pubDate のどちらかでミリ秒（無ければ 0）。 */
function rssItemSortTimeMs(item: RssItem): number {
  const s = item.isoDate || item.pubDate;
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * kintone の「日付」型へ入れる文字列。JST の暦日で YYYY-MM-DD（sv-SE は ISO 日付並び）。
 */
function toKintonePublishedDate(item: RssItem): string {
  const ms = rssItemSortTimeMs(item);
  const d = ms > 0 ? new Date(ms) : new Date();
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/**
 * RSS の説明欄から概要テキストを作る（HTML除去・最大 4000 文字）。
 */
function pickSummary(item: RssItem): string {
  const raw = item.contentSnippet || item.summary || item.content || "";
  const plain = stripHtmlToPlain(raw);
  return truncateForLlm(plain, 4000);
}

/**
 * 既に kintone にある article_url をまとめて取得する（chunk ごとに in クエリ）。
 */
async function loadExistingUrls(
  client: ReturnType<typeof createKintoneClient>,
  appId: string,
  urls: string[],
): Promise<Set<string>> {
  const existing = new Set<string>();
  const chunkSize = 30;
  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    const cond = chunk.map((u) => `"${escapeKintoneQueryString(u)}"`).join(", ");
    const query = `${NEWS_FIELDS.articleUrl} in (${cond})`;
    const rows = await client.record.getAllRecordsWithCursor({
      app: appId,
      query,
      fields: [NEWS_FIELDS.articleUrl],
    });
    for (const r of rows) {
      const v = r[NEWS_FIELDS.articleUrl]?.value;
      if (typeof v === "string" && v.length > 0) existing.add(v);
    }
  }
  return existing;
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const client = createKintoneClient(cfg, cfg.kintoneApiTokenForCollect);

  console.log("[collect] ドメイン:", cfg.kintoneDomain);
  console.log("[collect] ニュースアプリ ID:", cfg.newsAppId);
  console.log("[collect] RSS URL:", cfg.rssUrl);
  if (MAX_NEW_PER_RUN > 0) {
    console.log("[collect] 1 回あたり新規追加上限:", MAX_NEW_PER_RUN);
  }

  const feed = await rssParser.parseURL(cfg.rssUrl);
  const items = (feed.items || []) as RssItem[];

  const normalized = items
    .map((it) => {
      const link = resolveArticleUrl(it);
      const title = it.title?.trim() || "(無題)";
      if (!link) return null;
      return {
        title,
        link,
        publishedDate: toKintonePublishedDate(it),
        summaryText: pickSummary(it),
        sortTimeMs: rssItemSortTimeMs(it),
      };
    })
    .filter((x): x is NormalizedNewsRow => x !== null);

  // 新しい記事を先に kintone へ送る（同一日内の順序も RSS の日時で維持）
  normalized.sort((a, b) => b.sortTimeMs - a.sortTimeMs);

  const urls = [...new Set(normalized.map((n) => n.link))];
  console.log("[collect] RSS 件数:", normalized.length, "ユニーク URL:", urls.length);

  const existingUrls = await loadExistingUrls(client, cfg.newsAppId, urls);
  let toAdd = normalized.filter((n) => !existingUrls.has(n.link));
  const skippedDup = normalized.length - toAdd.length;
  console.log("[collect] 新規登録候補(重複除外後):", toAdd.length, "スキップ(既存URL):", skippedDup);

  if (MAX_NEW_PER_RUN > 0 && toAdd.length > MAX_NEW_PER_RUN) {
    console.log("[collect] 上限により送る件数を切り詰め:", toAdd.length, "→", MAX_NEW_PER_RUN);
    toAdd = toAdd.slice(0, MAX_NEW_PER_RUN);
  }

  if (toAdd.length === 0) {
    console.log("[collect] 追加なし。終了。");
    return;
  }

  const batchSize = 100;
  let totalAdded = 0;
  for (let i = 0; i < toAdd.length; i += batchSize) {
    const slice = toAdd.slice(i, i + batchSize);
    const records = slice.map((row) => ({
      [NEWS_FIELDS.title]: { value: row.title },
      [NEWS_FIELDS.articleUrl]: { value: row.link },
      [NEWS_FIELDS.publishedDate]: { value: row.publishedDate },
      [NEWS_FIELDS.summary]: { value: row.summaryText },
      [NEWS_FIELDS.digest]: { value: "" },
    }));
    const addRes = await client.record.addRecords({ app: cfg.newsAppId, records });
    const ids = addRes.ids || [];
    totalAdded += ids.length;
    console.log(
      "[collect] バッチ追加",
      Math.floor(i / batchSize) + 1,
      "件数:",
      ids.length,
      "先頭 ID:",
      ids[0] ?? "—",
    );
  }

  console.log("[collect] 完了。今回追加レコード数:", totalAdded);
}

main().catch(async (err) => {
  console.error("[collect] 失敗:", err);
  try {
    const cfg = loadConfig();
    await notifyFailure(cfg.notifyWebhookUrl, {
      workflow: "collect",
      message: String(err instanceof Error ? err.message : err),
      detail: err instanceof Error ? err.stack : undefined,
    });
  } catch (e) {
    console.error("[collect] 通知処理エラー:", e);
  }
  process.exitCode = 1;
});
