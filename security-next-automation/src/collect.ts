/**
 * キーワード選別のみルールベース（敷居の低い選別は生成 AI 不使用）。
 * フィードから kintone ニュースアプリ（631 等）へ未登録分を登録する。
 * - ポジティブ: タイトル・抜粋にインシデント関連語／ネガティブ語で除外
 * - 最大 3 件・同一 URL 1 件
 * **GEMINI_API_KEY あり**: Gemini で体裁付け（概要＝何が起きたか 1〜2 文＋末尾 `Security NEXT`。要約＝事象・脆弱性関連・修正・対策・見解の 4 見出し）。全文 API が失敗しても **見解** だけは Gemini で差し替え試行（`formatDigestInsightOnly`）。
 * **キーなし**または **COLLECT_SKIP_GEMINI_FORMAT=1**: `collect-enrich.ts` 経由で材料整形（4見出し＋概要）。選別は常に全文抜粋ベース。
 * **パイプライン**: 型・`[Pipeline]` ログは `lib/collect-pipeline.ts`、体裁付け（Gemini Y/I/N）は `lib/collect-enrich.ts`。
 */
import { existsSync } from "node:fs";
import Parser from "rss-parser";

import { enrichOneNewsForKintone, shouldUseGeminiFormat } from "./lib/collect-enrich.js";
import { logPipeline, type NormalizedNewsRow } from "./lib/collect-pipeline.js";
import { DOTENV_LOCAL_PATH, DOTENV_MAIN_PATH, loadConfig } from "./lib/config.js";
import { NEWS_FIELDS } from "./lib/field-codes.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { fetchNvdCveRowsAsNormalized } from "./lib/nvd-fetch.js";
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
  /** 誤廃棄・書類廃棄ミスなど（Security NEXT の自治体・組織向け見出し） */
  "誤廃棄",
  "インシデント",
  "緊急",
  /** 「悪用を確認」「悪用が発生」等（「悪用確認」1 語だと「を」が挟まって漏れる） */
  "悪用",
  "悪用確認",
  "ゼロデイ",
  /** Security NEXT 見出しに多いが旧一覧に無かった語 */
  "攻撃",
  "ddos",
  "侵害",
  "システム障害",
  "情報流出",
  /** 製品CVE・注意喚起の大半に含まれる（旧一覧欠落で 0 件化の主因だった） */
  "脆弱性",
  /** description に「悪用されている」等と出る英字表記 */
  "cve",
  /** 統計・事件どちらもフィードに多い */
  "フィッシング",
  /** タイトルに「脆弱性」が無いセキュリティ更新記事の救済（長い句で誤爆しにくい） */
  "セキュリティアップデート",
] as const;

/**
 * ネガティブ（パッチ・提供系の「周知だけ」寄り）: いずれかが含まれる記事は除外。
 * Security NEXT は「脆弱性＋アップデート公開」を同一見出しに載せるため、アップデート／修正／リリース単独語は除外に含めない（本文の「修正したアップデート」で全滅する）。
 * 除外は「ベリンダー・アドバイザリ色が強い」語に絞る。
 */
const EXCLUSION_KEYWORDS = [
  "パッチ",
  "更新プログラム",
  "脆弱性対策",
  "アドバイザリ",
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
  if (!(ms > 0)) {
    const url = item.link?.trim() || item.guid?.trim() || "(url なし)";
    console.warn(
      "[ニュース収集] RSS に有効な公開日時（isoDate/pubDate）がありません。published_date には JST の当日を入れます:",
      url,
    );
  }
  const d = ms > 0 ? new Date(ms) : new Date();
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** RSS からプレーン抜粋を取り、kintone 要約欄向けに上限まで入れる */
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

/** ログ用: 最初に一致したキーワード（無ければ null） */
function firstMatchingKeyword(haystack: string, needles: readonly string[]): string | null {
  const lowerHay = haystack.toLowerCase();
  for (const word of needles) {
    if (lowerHay.includes(word.toLowerCase())) return word;
  }
  return null;
}

/** 登録 0 件時、各新規候補がキーワードで落ちた理由を 1 行ずつ出す（Actions で調整先が分かる） */
function logKeywordDetailPerCandidate(rows: NormalizedNewsRow[]): void {
  const n = rows.length;
  for (let i = 0; i < n; i++) {
    const row = rows[i];
    const blob = `${row.title}\n${row.digestFullText}`;
    const titleShort = truncateForLlm((row.title || "").trim() || "(無題)", 120);
    const urlShort = row.link.length > 88 ? `${row.link.slice(0, 88)}…` : row.link;
    if (row.source === "nvd") {
      const ex = firstMatchingKeyword(blob, EXCLUSION_KEYWORDS);
      console.log(
        `[ニュース収集] キーワード内訳 ${i + 1}/${n} (NVD): 除外語=${ex ?? "なし"} | ${titleShort} | ${urlShort}`,
      );
      continue;
    }
    const ex = firstMatchingKeyword(blob, EXCLUSION_KEYWORDS);
    if (ex) {
      console.log(
        `[ニュース収集] キーワード内訳 ${i + 1}/${n}: 除外語「${ex}」でスキップ | ${titleShort} | ${urlShort}`,
      );
    } else if (!haystackContainsAny(blob, INCIDENT_KEYWORDS)) {
      console.log(`[ニュース収集] キーワード内訳 ${i + 1}/${n}: 事件語なし（INCIDENT に該当語がタイトル・抜粋に無い） | ${titleShort} | ${urlShort}`);
    } else {
      console.log(`[ニュース収集] キーワード内訳 ${i + 1}/${n}: (内部不整合の可能性) | ${titleShort} | ${urlShort}`);
    }
  }
}

/** ネガティブ語が無く、ポジティブ（インシデント）語が 1 つ以上ある */
function rowMatchesKeywordRules(row: NormalizedNewsRow): boolean {
  const blob = `${row.title}\n${row.digestFullText}`;
  if (haystackContainsAny(blob, EXCLUSION_KEYWORDS)) {
    return false;
  }
  if (row.source === "nvd") {
    return true;
  }
  return haystackContainsAny(blob, INCIDENT_KEYWORDS);
}

/** 登録 0 件時のログ用（Actions で原因切り分けしやすくする） */
function countKeywordRejectionReasons(rows: NormalizedNewsRow[]): {
  excludedOnly: number;
  noIncidentOnly: number;
} {
  let excludedOnly = 0;
  let noIncidentOnly = 0;
  for (const row of rows) {
    const blob = `${row.title}\n${row.digestFullText}`;
    const neg = haystackContainsAny(blob, EXCLUSION_KEYWORDS);
    if (row.source === "nvd") {
      if (neg) excludedOnly++;
      continue;
    }
    const pos = haystackContainsAny(blob, INCIDENT_KEYWORDS);
    if (neg) {
      excludedOnly++;
    } else if (!pos) {
      noIncidentOnly++;
    }
  }
  return { excludedOnly, noIncidentOnly };
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
  console.log("[ニュース収集] .env の参照パス（collect が読むのはこの 1 本。ルートの .env ではありません）:", DOTENV_MAIN_PATH);
  if (existsSync(DOTENV_LOCAL_PATH)) {
    console.log(
      "[ニュース収集] .env.local あり。ここに書いた同名のキーは .env より優先されます:",
      DOTENV_LOCAL_PATH,
    );
  }
  const cfg = loadConfig();
  const client = createKintoneClient(cfg, cfg.kintoneApiTokenForCollect);
  logPipeline("Config", {
    NewsApp: String(cfg.newsAppId),
    RssFeedCount: cfg.rssFeedUrls.length,
    NvdEnabled: cfg.collectNvdEnabled ? 1 : 0,
    TopN: TOP_N,
  });

  if (!cfg.collectNvdEnabled && process.env.NVD_API_KEY?.trim()) {
    console.warn(
      "[ニュース収集] NVD_API_KEY はあるが NVD はオフです。`security-next-automation/.env` に `COLLECT_NVD_ENABLE=1`（または true / yes）があるか確認してください（ルートの .env だけでは collect は読みません）。",
    );
  }
  if (!cfg.collectNvdEnabled && process.env.COLLECT_NVD_ENABLE?.trim()) {
    const v = process.env.COLLECT_NVD_ENABLE.trim();
    console.warn(
      "[ニュース収集] COLLECT_NVD_ENABLE に値はありますがオンとみなせません（有効なのは 1 / true / yes のみ・前後空白は無視）。現在:",
      JSON.stringify(v),
    );
  }

  console.log("[ニュース収集] 接続先ドメイン:", cfg.kintoneDomain);
  console.log("[ニュース収集] ニュースを保存するアプリの識別番号:", cfg.newsAppId);
  console.log("[ニュース収集] 記事 RSS の取得先（複数可）:", cfg.rssFeedUrls.join(" | "));
  if (cfg.collectNvdEnabled) {
    console.log(
      "[ニュース収集] NVD CVE 併用: 有効（直近",
      cfg.nvdLookbackDays,
      "日・プール上限",
      cfg.nvdMaxPerRun,
      "件・API キー:",
      cfg.nvdApiKey ? "あり" : "なし",
      "）",
    );
  }
  console.log(
    "[ニュース収集] 選別方式: RSS はインシデント語／除外語。NVD は除外語のみ（CVE は原則通過）。概要・要約は GEMINI_API_KEY があれば Gemini、なければ材料整形。1 回あたりの登録上限:",
    TOP_N,
    "件",
  );
  if (MAX_NEW_PER_RUN > 0) {
    console.log("[ニュース収集] 候補を先頭から切り詰める件数の上限（環境変数）:", MAX_NEW_PER_RUN);
  }

  const allFeedItems: RssItem[] = [];
  for (const feedUrl of cfg.rssFeedUrls) {
    try {
      const feed = await rssParser.parseURL(feedUrl);
      const items = (feed.items || []) as RssItem[];
      console.log("[ニュース収集] RSS 取得:", feedUrl, "件数:", items.length);
      logPipeline("FetchRss", { Items: items.length });
      allFeedItems.push(...items);
    } catch (e) {
      console.warn("[ニュース収集] RSS 取得失敗（この URL はスキップ）:", feedUrl, e);
    }
  }

  const rssNormalized: NormalizedNewsRow[] = allFeedItems.flatMap((it) => {
    const link = resolveArticleUrl(it);
    const title = it.title?.trim() || "(無題)";
    if (!link) return [];
    const digestFullText = pickSummary(it);
    return [
      {
        title,
        link,
        publishedDate: toKintonePublishedDate(it),
        digestFullText,
        sortTimeMs: rssItemSortTimeMs(it),
        source: "rss" as const,
      },
    ];
  });

  let nvdRows: NormalizedNewsRow[] = [];
  if (cfg.collectNvdEnabled) {
    try {
      nvdRows = await fetchNvdCveRowsAsNormalized({
        lookbackDays: cfg.nvdLookbackDays,
        maxItems: cfg.nvdMaxPerRun,
        apiKey: cfg.nvdApiKey,
      });
      console.log("[ニュース収集] NVD からの候補行:", nvdRows.length);
      logPipeline("FetchNvd", { Rows: nvdRows.length });
    } catch (e) {
      console.warn("[ニュース収集] NVD 取得失敗（RSS のみ続行）:", e);
    }
  }

  const merged = [...rssNormalized, ...nvdRows];
  merged.sort((a, b) => b.sortTimeMs - a.sortTimeMs);
  logPipeline("MergeSort", { Rows: merged.length });
  const normalized = dedupeCandidatesNewestFirstUniqueUrl(merged);
  logPipeline("DedupeUrl", { Rows: normalized.length });

  const urls = [...new Set(normalized.map((n) => n.link))];
  console.log("[ニュース収集] RSS＋NVD 合算の候補行数:", normalized.length, "重複を除いたリンク数:", urls.length);

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
  logPipeline("KintoneExistingFilter", { NewCandidates: candidates.length, SkippedRegistered: skippedDup });

  if (MAX_NEW_PER_RUN > 0 && candidates.length > MAX_NEW_PER_RUN) {
    console.log("[ニュース収集] 環境変数の上限で候補を切り詰め:", candidates.length, "件 →", MAX_NEW_PER_RUN, "件");
    candidates = candidates.slice(0, MAX_NEW_PER_RUN);
    logPipeline("CandidateTrim", { MaxPerRun: MAX_NEW_PER_RUN, After: candidates.length });
  }

  const summaryUrl = process.env.NOTIFY_SUMMARY_WEBHOOK_URL;

  if (candidates.length === 0) {
    console.log("[ニュース収集] 追加なし。終了。");
    logPipeline("KeywordStats", { CandidateCount: 0 });
    await notifyRunSummary(summaryUrl, {
      workflow: "ニュース収集",
      candidateCount: 0,
      addedCount: 0,
      extraLines: ["• 補足: まだ kintone に未登録の新規候補がありません"],
    });
    logPipeline("Notify", { Added: 0, Candidates: 0, Webhook: summaryUrl?.trim() ? 1 : 0 });
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
  logPipeline("KeywordStats", { Matched: keywordMatchedCount, Pool: candidateCountForSummary });

  let toAdd = pickKeywordMatchesNewestUpToN(candidates, TOP_N);
  if (MAX_NEW_PER_RUN > 0 && toAdd.length > MAX_NEW_PER_RUN) {
    toAdd = toAdd.slice(0, MAX_NEW_PER_RUN);
  }

  console.log("[ニュース収集] 登録予定:", toAdd.length, "件（キーワード選別・日付新しい順・最大", TOP_N, "件）");
  logPipeline("KeywordPick", { ToAdd: toAdd.length });
  if (toAdd.length === 0) {
    const rej = countKeywordRejectionReasons(candidates);
    console.log(
      "[ニュース収集] 登録対象なし。新規候補の内訳（件数ベース・重複 URL 含む）→ 除外語ヒット:",
      rej.excludedOnly,
      "／事件性キーワード不足:",
      rej.noIncidentOnly,
      "（`collect.ts` の INCIDENT_KEYWORDS / EXCLUSION_KEYWORDS を参照）",
    );
    console.log("[ニュース収集] 各候補の落ちた理由（下の「除外語」「事件語なし」を見てキーワード配列を調整）:");
    logKeywordDetailPerCandidate(candidates);
    await notifyRunSummary(summaryUrl, {
      workflow: "ニュース収集",
      candidateCount: candidateCountForSummary,
      addedCount: 0,
      extraLines: [
        `• 補足: 新着候補はあったがキーワードで 0 件。除外語: ${rej.excludedOnly} 件／事件語不足: ${rej.noIncidentOnly} 件（ログ参照）`,
      ],
    });
    logPipeline("Notify", { Added: 0, Candidates: candidateCountForSummary, Webhook: summaryUrl?.trim() ? 1 : 0 });
    return;
  }

  const useGemini = shouldUseGeminiFormat();
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
  if (useGemini && geminiKey) {
    console.log("[ニュース収集] GEMINI_API_KEY あり → collect-enrich 経由で Gemini 体裁（model は GEMINI_MODEL / format-news-gemini 参照）。");
  } else {
    console.log(
      "[ニュース収集] Gemini オフ（GEMINI_API_KEY 未設定または COLLECT_SKIP_GEMINI_FORMAT=1）→ collect-enrich で材料整形のみ。Actions では Environment kintone-collect に GEMINI_API_KEY があるか確認。",
    );
  }

  const records: Array<Record<string, { value: string }>> = [];
  /** 通知用: 全文 Gemini 成功 */
  let geminiFullCount = 0;
  /** 通知用: 見解のみ Gemini（全文は RSS 材料など） */
  let geminiInsightOnlyCount = 0;

  for (const row of toAdd) {
    const { overview, digest, geminiMark } = await enrichOneNewsForKintone(row);
    if (geminiMark === "Y") {
      geminiFullCount++;
    } else if (geminiMark === "I") {
      geminiInsightOnlyCount++;
    }
    const prevDigest = digest.slice(0, 72).replace(/\s+/g, " ");
    console.log(
      "[ニュース収集] 登録直前:",
      row.link,
      "| gemini=",
      geminiMark,
      "| 概要(先頭40字)=",
      overview.replace(/\s+/g, " ").slice(0, 40),
      "| 要約(先頭72字)=",
      prevDigest,
    );

    records.push({
      [NEWS_FIELDS.title]: { value: row.title },
      [NEWS_FIELDS.articleUrl]: { value: row.link },
      [NEWS_FIELDS.publishedDate]: { value: row.publishedDate },
      [NEWS_FIELDS.summary]: { value: overview },
      [NEWS_FIELDS.digest]: { value: digest },
    });
  }

  const addRes = await client.record.addRecords({ app: cfg.newsAppId, records });
  const ids = addRes.ids || [];
  console.log(
    "[ニュース収集] 登録完了。今回追加した件数:",
    ids.length,
    "／先頭レコードの識別番号:",
    ids[0] ?? "—",
  );
  logPipeline("KintonePost", { Added: ids.length, FirstId: ids[0] ? Number(ids[0]) : 0 });

  await notifyRunSummary(summaryUrl, {
    workflow: "ニュース収集",
    candidateCount: candidateCountForSummary,
    addedCount: ids.length,
    extraLines: [
      `• キーワードに合致した候補（件数）: ${keywordMatchedCount}`,
      `• 保存先アプリの識別番号: ${cfg.newsAppId}`,
      `• 概要・要約: Gemini 全文 ${geminiFullCount}／見解のみ ${geminiInsightOnlyCount}／登録 ${ids.length} 件（ログ「登録直前」: Y=全文・I=見解のみ・N=Gemini 未使用）`,
      ...(ids[0] ? [`• 今回の先頭レコード識別番号: ${ids[0]}`] : []),
    ],
  });
  logPipeline("Notify", { Added: ids.length, Candidates: candidateCountForSummary, Webhook: summaryUrl?.trim() ? 1 : 0 });
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
