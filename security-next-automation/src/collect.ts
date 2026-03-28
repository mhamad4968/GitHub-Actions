/**
 * Security NEXT（既定 RSS）から記事を取得し、
 * kintone 未登録の候補のうち、Gemini が「実害のあるセキュリティ事故（インシデント）」記事だけと判断したものを最大 3 件登録する。
 * パッチ・アップデート・注意喚起など予防情報は選別で除外する（プロンプト厳守）。重複 URL は候補に含めない。
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
 * 未登録候補のうち「インシデント事例」だけを残し、重要度順に最大 TOP_N 件の URL を返す（予防系は採用しない）。
 */
async function pickTopUrlsWithGemini(
  apiKey: string,
  candidates: NormalizedNewsRow[],
): Promise<string[]> {
  if (candidates.length === 0) return [];

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
      "あなたは情報セキュリティニュースの選別担当です。与えられた候補から、アウトプット用に採用する URL だけを選びます。",
      "",
      "【選考対象・必須】実際に発生した「セキュリティ事故（インシデント）」に関する記事のみ。例:",
      "・情報漏洩・個人情報の流出、不正アクセス、ランサムウェア被害、マルウェア／ウイルス感染",
      "・機器・媒体の紛失、誤送信・誤掲載などヒューマンエラーによる漏えい",
      "記事の内容が「すでに起きた被害・事件」であることがタイトルまたは概要から読み取れるものに限定する。",
      "",
      "【除外対象・厳禁】次に該当するものは一切採用しない:",
      "・脆弱性の修正パッチ、セキュリティパッチのリリース・配布・適用勧告だけの話",
      "・OS・ソフトウェア・ファームウェアの通常アップデート・バージョンアップの案内",
      "・注意喚起・セキュリティアドバイザリ・「対策を」と言うだけで具体的事故の記述がない予防・管理情報",
      "・CVE の解説だけ・深刻度表の更新だけなど、事故の発生を報じない技術速報",
      "",
      "【判定基準】タイトル・概要に次に近い語やニュアンスがあるものを最優先: 被害、流出、漏洩、不正ログイン、",
      "不正アクセス、身代金、ランサム、感染、誤送信、紛失、インシデント、情報流出 など具体的事件性を示す表現。",
      "曖昧な場合は採用しない（予防記事を誤って入れない）。",
      "",
      "【出力】",
      "- 採用する URL は入力リストの「URL:」行と完全一致のみ。捏造禁止。",
      "- 条件を満たす記事が無ければ top_urls は空配列。",
      "- 条件を満たす中で事件の重大さ・具体的さが高い順に最大3件。",
      '- JSON のみ: {"top_urls":["https://..."]}',
    ].join("\n"),
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  const userText =
    [
      "以下は kintone に未登録の RSS 候補です（上ほど新しい）。",
      "実際に被害・事故が発生したインシデント記事に絶対に限定し、パッチ・アップデート・注意喚起のみの記事は一切選ばないでください。",
      "該当がなければ top_urls は []。該当がある場合のみ最大3件の URL を重要度順で top_urls に入れてください。",
      "",
      buildScoringPromptBlock(pool),
    ].join("\n");

  let text: string;
  try {
    const result = await model.generateContent(userText);
    text = result.response.text();
  } catch (e) {
    console.warn("[collect] Gemini API エラー。インシデント選別できないため今回は登録しません。", e);
    return [];
  }
  let parsed: { top_urls?: unknown };
  try {
    parsed = JSON.parse(extractJsonObjectText(text)) as { top_urls?: unknown };
  } catch (e) {
    console.warn("[collect] Gemini の JSON 解析に失敗。予防記事を混ぜないよう今回は登録しません。", e);
    return [];
  }

  const urlsRaw = parsed.top_urls;
  if (!Array.isArray(urlsRaw)) {
    console.warn("[collect] top_urls が配列ではありません。今回は登録しません。");
    return [];
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
    console.log("[collect] インシデント記事として採用された URL は0件（または該当なし）。");
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
  console.log("[collect] Gemini 選別モデル:", GEMINI_MODEL, "方針: インシデント事例のみ最大", TOP_N, "件/回");
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
