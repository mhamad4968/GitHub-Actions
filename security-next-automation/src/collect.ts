/**
 * Security NEXT（既定 RSS）から記事を取得し、
 * 「kintone に未登録の候補」のうち Gemini が重要度上位と判断した最大 3 件だけをニュースアプリへ追加する。
 * 重複: article_url が既存レコードと一致するものは候補に含めない。
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import Parser from "rss-parser";

import { loadConfig, requireGeminiApiKey } from "./lib/config.js";
import { NEWS_FIELDS } from "./lib/field-codes.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { notifyFailure } from "./lib/notify.js";
import { escapeKintoneQueryString, stripHtmlToPlain, truncateForLlm } from "./lib/text.js";

/** 1 回の実行で kintone に送る件数の上限（API・負荷用。0 または未設定で無制限に近い扱い） */
const maxNewEnv = process.env.COLLECT_MAX_NEW_PER_RUN?.trim();
const MAX_NEW_PER_RUN = maxNewEnv && /^\d+$/.test(maxNewEnv) ? Math.max(0, parseInt(maxNewEnv, 10)) : 0;

/** Gemini に渡す新規候補の最大件数（トークン節約・新しい順に切り詰め） */
const MAX_CANDIDATES_FOR_GEMINI = 25;
/** 1 回の収集で kintone に追加する最大件数（選別後） */
const TOP_N = 3;
const GEMINI_MODEL = "gemini-1.5-flash";
const SUMMARY_CHARS_FOR_SCORE = 900;

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

/** LLM 応答から JSON 相当の文字列を抜き出す（フェンスや前後ノイズの除去） */
function extractJsonObjectText(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}

function buildScoringPromptBlock(candidates: NormalizedNewsRow[]): string {
  return candidates
    .map((r, i) => {
      const sum = truncateForLlm(r.summaryText, SUMMARY_CHARS_FOR_SCORE);
      return `${i + 1}. URL: ${r.link}\n   タイトル: ${r.title}\n   概要: ${sum}`;
    })
    .join("\n\n");
}

/**
 * 未登録候補のうち、重要度が高いと判断した URL を最大 TOP_N 件返す（入力に無い URL は捨てる）。
 */
async function pickTopUrlsWithGemini(
  apiKey: string,
  candidates: NormalizedNewsRow[],
): Promise<string[]> {
  if (candidates.length === 0) return [];
  if (candidates.length <= TOP_N) {
    console.log("[collect] 候補が", candidates.length, "件のため Gemini 呼び出しを省略し全件採用");
    return candidates.map((c) => c.link);
  }

  const pool = candidates.slice(0, MAX_CANDIDATES_FOR_GEMINI);
  if (pool.length < candidates.length) {
    console.log(
      "[collect] Gemini には新しい順で先頭",
      pool.length,
      "件のみ渡します（全候補",
      candidates.length,
      "件）",
    );
  }

  const allowed = new Set(pool.map((p) => p.link));
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: [
      "あなたは情報セキュリティメディアの編集者です。与えられた候補記事だけから重要度を比較し、採用する URL を選んでください。",
      "採用基準（総合スコアの目安）。日本の公的・準公的な情報源と国内影響を最優先に読むこと:",
      "・IPA（情報処理推進機構）の注意喚起・IPA に言及する内容は他条件が同程度なら上位に置く",
      "・JVN（Japan Vulnerability Notes）の掲載・公表や、その脆弱性の深刻度（Critical / High）に直結する記述は強く加点",
      "・国内インシデント（日本国内組織の被害・日本向け勧告・国内サービスへの実害・当局・業界団体の国内向け警告）は高優先",
      "1) 脆弱性の深刻度: Critical / High が記事内で明示されている、または強く示唆されるものを最優先",
      "2) 日本国内への影響度: 日本の組織・サービス・ユーザーへの直接的影響、国内での注意喚起・対応の必要性が高いもの",
      "3) 攻撃の発生状況: 実悪用・ゼロデイ・大規模インシデント・注意喚起レベルの緊急性が高いもの",
      "厳守:",
      "- リストに無い URL を捏造しない。必ず入力「URL:」行の文字列と完全一致で返す",
      "- 最大3件。明確に価値が低いだけなら3件未満でもよい",
      '- 応答は JSON オブジェクトのみ。形式: {"top_urls":["https://...","..."]}',
    ].join("\n"),
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  const userText =
    "以下は kintone に未登録の新規候補です（上ほど新しい）。top_urls に重要度順で最大3件の URL を入れてください。\n\n" +
    buildScoringPromptBlock(pool);

  let text: string;
  try {
    const result = await model.generateContent(userText);
    text = result.response.text();
  } catch (e) {
    console.warn("[collect] Gemini API エラー。フォールバックで新しい順3件。", e);
    return pool.slice(0, TOP_N).map((p) => p.link);
  }
  let parsed: { top_urls?: unknown };
  try {
    parsed = JSON.parse(extractJsonObjectText(text)) as { top_urls?: unknown };
  } catch (e) {
    console.warn("[collect] Gemini の JSON 解析に失敗。フォールバックで新しい順3件を採用します。", e);
    return pool.slice(0, TOP_N).map((p) => p.link);
  }

  const urlsRaw = parsed.top_urls;
  if (!Array.isArray(urlsRaw)) {
    console.warn("[collect] top_urls が配列ではありません。フォールバックで新しい順3件。");
    return pool.slice(0, TOP_N).map((p) => p.link);
  }

  const picked: string[] = [];
  for (const u of urlsRaw) {
    if (typeof u !== "string") continue;
    const url = u.trim();
    if (!allowed.has(url)) {
      console.warn("[collect] Gemini が候補外の URL を返したため無視:", url);
      continue;
    }
    if (!picked.includes(url)) picked.push(url);
    if (picked.length >= TOP_N) break;
  }

  if (picked.length === 0) {
    console.warn("[collect] 有効な URL が得られなかったためフォールバックで新しい順3件。");
    return pool.slice(0, TOP_N).map((p) => p.link);
  }

  return picked;
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const geminiKey = requireGeminiApiKey();
  const client = createKintoneClient(cfg, cfg.kintoneApiTokenForCollect);

  console.log("[collect] ドメイン:", cfg.kintoneDomain);
  console.log("[collect] ニュースアプリ ID:", cfg.newsAppId);
  console.log("[collect] RSS URL:", cfg.rssUrl);
  console.log("[collect] Gemini 選別モデル:", GEMINI_MODEL, "上限登録:", TOP_N, "件/回");
  if (MAX_NEW_PER_RUN > 0) {
    console.log("[collect] COLLECT_MAX_NEW_PER_RUN（選別後の追加Cap）:", MAX_NEW_PER_RUN);
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
  console.log("[collect] RSS 件数:", normalized.length, "ユニーク URL:", urls.length);

  const existingUrls = await loadExistingUrls(client, cfg.newsAppId, urls);
  let candidates = normalized.filter((n) => !existingUrls.has(n.link));
  const skippedDup = normalized.length - candidates.length;
  console.log("[collect] 新規候補(kintoneと異なるURL):", candidates.length, "スキップ(既存):", skippedDup);

  if (MAX_NEW_PER_RUN > 0 && candidates.length > MAX_NEW_PER_RUN) {
    console.log("[collect] COLLECT_MAX_NEW_PER_RUN により候補を切り詰め:", candidates.length, "→", MAX_NEW_PER_RUN);
    candidates = candidates.slice(0, MAX_NEW_PER_RUN);
  }

  if (candidates.length === 0) {
    console.log("[collect] 追加なし。終了。");
    return;
  }

  const topLinks = await pickTopUrlsWithGemini(geminiKey, candidates);
  const byLink = new Map(candidates.map((c) => [c.link, c]));
  let toAdd = topLinks.map((link) => byLink.get(link)).filter((x): x is NormalizedNewsRow => x != null);

  if (MAX_NEW_PER_RUN > 0 && toAdd.length > MAX_NEW_PER_RUN) {
    toAdd = toAdd.slice(0, MAX_NEW_PER_RUN);
  }

  console.log("[collect] Gemini 選別後の登録予定:", toAdd.length, "件");
  if (toAdd.length === 0) {
    console.log("[collect] 登録対象なし。終了。");
    return;
  }

  const records = toAdd.map((row) => ({
    [NEWS_FIELDS.title]: { value: row.title },
    [NEWS_FIELDS.articleUrl]: { value: row.link },
    [NEWS_FIELDS.publishedDate]: { value: row.publishedDate },
    [NEWS_FIELDS.summary]: { value: row.summaryText },
    [NEWS_FIELDS.digest]: { value: "" },
  }));
  const addRes = await client.record.addRecords({ app: cfg.newsAppId, records });
  const ids = addRes.ids || [];
  console.log("[collect] 登録完了。今回追加レコード数:", ids.length, "先頭 ID:", ids[0] ?? "—");
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
