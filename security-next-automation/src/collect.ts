/**
 * 高度なキーワード選別モード（生成ＡＩ／ジェミニは一切使わない）。
 * セキュリティ専門ニュースのフィードから取得し、kintone ニュースアプリ（運用上アプリ番号 631 等、環境変数で指定）へ未登録分を登録する。
 * - ポジティブ: タイトル・概要にインシデント関連語が 1 つ以上含まれる
 * - ネガティブ: 予防・パッチ系の語が 1 つでも含まれる記事は除外
 * 条件を満たす最新記事を最大 3 件（同一記事リンクは 1 件）。
 * `.env` の GEMINI_API_KEY が空でも本スクリプトはその変数を読まないためエラーにならない。
 * フィード抜粋は概要欄・要約欄の両方に同じ内容を入れる。
 */
import Parser from "rss-parser";

import { loadConfig } from "./lib/config.js";
import { NEWS_FIELDS } from "./lib/field-codes.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { notifyFailure, notifyRunSummary } from "./lib/notify.js";
import { escapeKintoneQueryString, stripHtmlToPlain, truncateForLlm } from "./lib/text.js";

/** 1 回の実行で取り込む候補の上限（負荷調整用。0 または未設定なら切り詰めない） */
const maxNewEnv = process.env.COLLECT_MAX_NEW_PER_RUN?.trim();
const MAX_NEW_PER_RUN = maxNewEnv && /^\d+$/.test(maxNewEnv) ? Math.max(0, parseInt(maxNewEnv, 10)) : 0;

/** 1 回の収集で kintone に追加する最大件数（キーワード選別後） */
const TOP_N = 3;

/** ポジティブ（インシデント判定）: タイトルまたは概要にいずれかが含まれるものを残す（部分一致） */
const INCIDENT_KEYWORDS = [
  "漏洩",
  "不正アクセス",
  "流出",
  "被害",
  "ランサム",
  "ウイルス",
  "乗っ取り",
  "紛失",
  "誤送信",
  "インシデント",
  "緊急",
  "悪用確認",
  "ゼロデイ",
] as const;

/** ネガティブ（予防・パッチ情報）: いずれかが含まれる記事はすべて除外 */
const EXCLUSION_KEYWORDS = [
  "アップデート",
  "パッチ",
  "更新プログラム",
  "脆弱性対策",
  "アドバイザリ",
  "リリース",
  "修正",
  "配布",
] as const;

/** 記事フィード取得の待ち時間の上限（ミリ秒） */
const rssParser = new Parser({
  timeout: 30_000,
  // 記事サーバーへの付帯情報（識別用）。英字のみにするとエンコード差異を避けられるが、方針どおり日本語表記とする
  headers: { "User-Agent": "kintone-security-collector" },
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

function resolveArticleUrl(item: RssItem): string | null {
  const raw = item.link?.trim() || "";
  if (raw.length > 0) return raw;
  const g = item.guid?.trim() || "";
  if (/^https?:\/\//i.test(g)) return g;
  return null;
}

function rssItemSortTimeMs(item: RssItem): number {
  const s = item.isoDate || item.pubDate;
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function toKintonePublishedDate(item: RssItem): string {
  const ms = rssItemSortTimeMs(item);
  const d = ms > 0 ? new Date(ms) : new Date();
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

function pickSummary(item: RssItem): string {
  const raw = item.contentSnippet || item.summary || item.content || "";
  const plain = stripHtmlToPlain(raw);
  return truncateForLlm(plain, 4000);
}

/** キーワードはすべて日本語（カタカナ含む）で定義。比較では小文字へそろえて部分一致する */
function haystackContainsAny(haystack: string, needles: readonly string[]): boolean {
  const lowerHay = haystack.toLowerCase();
  return needles.some((word) => lowerHay.includes(word.toLowerCase()));
}

/** ネガティブ語が無く、ポジティブ（インシデント）語が 1 つ以上ある */
function rowMatchesKeywordRules(row: NormalizedNewsRow): boolean {
  const blob = `${row.title}\n${row.summaryText}`;
  if (haystackContainsAny(blob, EXCLUSION_KEYWORDS)) {
    return false;
  }
  return haystackContainsAny(blob, INCIDENT_KEYWORDS);
}

/**
 * 候補は既に公開日時の新しい順。同一の記事リンクは先頭（最新）の 1 件だけ残す。
 */
function dedupeCandidatesNewestFirstUniqueUrl(candidates: NormalizedNewsRow[]): NormalizedNewsRow[] {
  const seen = new Set<string>();
  const out: NormalizedNewsRow[] = [];
  for (const c of candidates) {
    if (seen.has(c.link)) continue;
    seen.add(c.link);
    out.push(c);
  }
  return out;
}

/**
 * キーワードで絞ったうえで記事リンクの重複を除き、新しい順に最大 n 件。
 */
function pickKeywordMatchesNewestUpToN(candidates: NormalizedNewsRow[], n: number): NormalizedNewsRow[] {
  const matched = candidates.filter(rowMatchesKeywordRules);
  return dedupeCandidatesNewestFirstUniqueUrl(matched).slice(0, n);
}

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

  console.log("[ニュース収集] 接続先ドメイン:", cfg.kintoneDomain);
  console.log("[ニュース収集] ニュースを保存するアプリの識別番号:", cfg.newsAppId);
  console.log("[ニュース収集] 記事フィードの取得先:", cfg.rssUrl);
  console.log(
    "[ニュース収集] 選別方式: 高度キーワード（ポジティブ＝インシデント語／ネガティブ＝予防・パッチ語。生成ＡＩは未使用）。1 回あたりの登録上限:",
    TOP_N,
    "件",
  );
  if (MAX_NEW_PER_RUN > 0) {
    console.log("[ニュース収集] 候補を先頭から切り詰める件数の上限（環境変数）:", MAX_NEW_PER_RUN);
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

  normalized.sort((a, b) => b.sortTimeMs - a.sortTimeMs);

  const urls = [...new Set(normalized.map((n) => n.link))];
  console.log("[ニュース収集] フィード由来の記事行数:", normalized.length, "重複を除いたリンク数:", urls.length);

  const existingUrls = await loadExistingUrls(client, cfg.newsAppId, urls);
  let candidates = normalized.filter((n) => !existingUrls.has(n.link));
  const skippedDup = normalized.length - candidates.length;
  console.log(
    "[ニュース収集] まだ kintone に無い新規候補:",
    candidates.length,
    "件／既に登録済みで除外:",
    skippedDup,
    "件",
  );

  if (MAX_NEW_PER_RUN > 0 && candidates.length > MAX_NEW_PER_RUN) {
    console.log("[ニュース収集] 環境変数の上限で候補を切り詰め:", candidates.length, "件 →", MAX_NEW_PER_RUN, "件");
    candidates = candidates.slice(0, MAX_NEW_PER_RUN);
  }

  const summaryUrl = process.env.NOTIFY_SUMMARY_WEBHOOK_URL;

  if (candidates.length === 0) {
    console.log("[ニュース収集] 追加なし。終了。");
    await notifyRunSummary(summaryUrl, {
      workflow: "ニュース収集",
      candidateCount: 0,
      addedCount: 0,
      extraLines: ["• 補足: まだ kintone に未登録の新規候補がありません"],
    });
    return;
  }

  const candidateCountForSummary = candidates.length;
  // 同一 URL が複数行あっても 1 件と数える
  const keywordMatchedCount = dedupeCandidatesNewestFirstUniqueUrl(candidates.filter(rowMatchesKeywordRules)).length;
  console.log(
    "[ニュース収集] キーワード条件に合致する新着候補:",
    keywordMatchedCount,
    "/",
    candidateCountForSummary,
  );

  let toAdd = pickKeywordMatchesNewestUpToN(candidates, TOP_N);
  if (MAX_NEW_PER_RUN > 0 && toAdd.length > MAX_NEW_PER_RUN) {
    toAdd = toAdd.slice(0, MAX_NEW_PER_RUN);
  }

  console.log("[ニュース収集] 登録予定:", toAdd.length, "件（キーワード選別・日付新しい順・最大", TOP_N, "件）");
  if (toAdd.length === 0) {
    console.log("[ニュース収集] 登録対象なし。終了。");
    await notifyRunSummary(summaryUrl, {
      workflow: "ニュース収集",
      candidateCount: candidateCountForSummary,
      addedCount: 0,
      extraLines: [
        "• 補足: 新着候補はあったが、ポジティブ条件を満たす記事 0 件（またはネガティブ語により除外済み）",
      ],
    });
    return;
  }

  const records = toAdd.map((row) => ({
    [NEWS_FIELDS.title]: { value: row.title },
    [NEWS_FIELDS.articleUrl]: { value: row.link },
    [NEWS_FIELDS.publishedDate]: { value: row.publishedDate },
    [NEWS_FIELDS.summary]: { value: row.summaryText },
    [NEWS_FIELDS.digest]: { value: row.summaryText },
  }));
  const addRes = await client.record.addRecords({ app: cfg.newsAppId, records });
  const ids = addRes.ids || [];
  console.log(
    "[ニュース収集] 登録完了。今回追加した件数:",
    ids.length,
    "／先頭レコードの識別番号:",
    ids[0] ?? "—",
  );

  await notifyRunSummary(summaryUrl, {
    workflow: "ニュース収集",
    candidateCount: candidateCountForSummary,
    addedCount: ids.length,
    extraLines: [
      `• キーワードに合致した候補（件数）: ${keywordMatchedCount}`,
      `• 保存先アプリの識別番号: ${cfg.newsAppId}`,
      ...(ids[0] ? [`• 今回の先頭レコード識別番号: ${ids[0]}`] : []),
    ],
  });
}

main().catch(async (err) => {
  console.error("[ニュース収集] 失敗:", err);
  try {
    const cfg = loadConfig();
    await notifyFailure(cfg.notifyWebhookUrl, {
      workflow: "ニュース収集",
      message: String(err instanceof Error ? err.message : err),
      detail: err instanceof Error ? err.stack : undefined,
    });
  } catch (e) {
    console.error("[ニュース収集] 通知処理エラー:", e);
  }
  process.exitCode = 1;
});
