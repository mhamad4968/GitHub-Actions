/**
 * 収集パイプラインの「体裁付け（Enrichment）」層。
 * Gemini 使用可否・Y/I/N の判定・format-news-gemini / text.ts の呼び出しはここに閉じる。
 */
import { formatDigestInsightOnly, formatNewsForKintone } from "./format-news-gemini.js";
import { type NormalizedNewsRow, logPipeline, overviewFooterSource, type CollectPipelineStep } from "./collect-pipeline.js";
import { tryFetchArticleBodyPlain } from "./fetch-article-plain.js";
import {
  buildRssMaterialSummaryDigest,
  replaceDigestInsightParagraph,
  truncateForLlm,
} from "./text.js";

const STEP_ENRICH: CollectPipelineStep = "Enrichment";

/** 概要（summary）の最大文字数（Gemini 未使用時のフォールバック用） — collect と同値 */
const COLLECT_OVERVIEW_MAX_CHARS = 320;

/** `GEMINI_API_KEY` があれば Gemini 整形を使う。1 にすると常に RSS トリムのみ */
export function shouldUseGeminiFormat(): boolean {
  if (process.env.COLLECT_SKIP_GEMINI_FORMAT?.trim() === "1") {
    return false;
  }
  const k = process.env.GEMINI_API_KEY?.trim();
  return Boolean(k);
}

export type GeminiUsageMark = "Y" | "I" | "N";

export type EnrichOneResult = {
  overview: string;
  digest: string;
  geminiMark: GeminiUsageMark;
};

/** 概要と要約が実質同一か（空白差のみ無視） */
function sameSummaryAndDigest(a: string, b: string): boolean {
  const x = a.trim().replace(/\s+/g, " ");
  const y = b.trim().replace(/\s+/g, " ");
  return x.length > 0 && x === y;
}

/**
 * kintone 要約欄の材料用フォーマット（事象・脆弱性関連・修正・対策・見解）が付いているか。
 */
function digestHasMaterialHeadings(digest: string): boolean {
  const d = digest.trim();
  return (
    /事象:\s*\S/m.test(d) &&
    /脆弱性関連:\s*\S/m.test(d) &&
    /修正・対策:\s*\S/m.test(d) &&
    /見解:\s*\S/m.test(d)
  );
}

function shortUrlForLog(url: string, max = 72): string {
  const u = url.replace(/\s+/g, " ").trim();
  return u.length <= max ? u : `${u.slice(0, max)}…`;
}

/**
 * NVD 由来の要約だけ、見出し「脆弱性関連:」はそのままにし、直後（コロン後の空白・改行のあと）へ (NVD掲載) を 1 回だけ差す。
 * validateNewsFormat や digestHasMaterialHeadings が期待する見出し文字列を壊さない。
 */
/**
 * RSS 抜粋に加え、記事 URL から本文プレーンを取得して LLM 入力を厚くする。
 * `COLLECT_FETCH_ARTICLE_BODY=0` で無効化（CI の遅延・相手サイト負荷を抑えるとき）。
 */
async function rssExcerptWithOptionalArticleBody(row: NormalizedNewsRow): Promise<string> {
  const base = row.digestFullText;
  if (process.env.COLLECT_FETCH_ARTICLE_BODY?.trim() === "0") {
    return base;
  }
  const extra = await tryFetchArticleBodyPlain(row.link);
  if (!extra) return base;
  return `${base}\n\n【記事ページから自動取得した本文抜粋（省略あり・取得失敗時はこのブロックなし）】\n${extra}`;
}

function insertNvdSourceTagAfterVulnHeading(digest: string): string {
  const re = /^脆弱性関連:(\s*)/m;
  const m = re.exec(digest);
  if (!m) {
    return digest;
  }
  const pos = m.index + m[0].length;
  const rest = digest.slice(pos);
  if (rest.startsWith("(NVD掲載)") || rest.startsWith("（NVD掲載）")) {
    return digest;
  }
  return digest.slice(0, pos) + "(NVD掲載) " + rest;
}

/**
 * 1 件ぶんの概要・要約を確定し、Gemini の利用度（Y/I/N）を返す。
 */
export async function enrichOneNewsForKintone(row: NormalizedNewsRow): Promise<EnrichOneResult> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const useGemini = shouldUseGeminiFormat() && Boolean(geminiKey);
  const excerptPlain = await rssExcerptWithOptionalArticleBody(row);
  let overview: string;
  let digest: string;
  let usedGeminiForThis = false;
  let usedGeminiInsightOnly = false;

  if (useGemini) {
    try {
      const fmt = await formatNewsForKintone(geminiKey, {
        title: row.title,
        articleUrl: row.link,
        publishedDate: row.publishedDate,
        rssExcerptPlain: excerptPlain,
        materialSource: row.source,
      });
      overview = fmt.overview;
      digest = fmt.digest;
      if (row.source === "nvd") {
        const lines = overview.split("\n");
        const last = (lines[lines.length - 1] || "").trim();
        if (last === "Security NEXT") {
          lines[lines.length - 1] = overviewFooterSource(row);
          overview = lines.join("\n");
        }
      }
      usedGeminiForThis = true;
    } catch (eGem) {
      console.warn("[ニュース収集] Gemini 体裁整形に失敗 → RSS 材料にフォールバック:", row.link, eGem);
      logPipeline(STEP_ENRICH, {
        Result: "fallback",
        Detail: "gemini-format-error",
        Url: shortUrlForLog(row.link),
      });
      const fb = buildRssMaterialSummaryDigest(
        excerptPlain,
        row.title,
        COLLECT_OVERVIEW_MAX_CHARS,
        overviewFooterSource(row),
        row.source,
      );
      overview = fb.overview;
      digest = fb.digest;
    }
  } else {
    const fb = buildRssMaterialSummaryDigest(
      excerptPlain,
      row.title,
      COLLECT_OVERVIEW_MAX_CHARS,
      overviewFooterSource(row),
      row.source,
    );
    overview = fb.overview;
    digest = fb.digest;
  }

  if (!digestHasMaterialHeadings(digest) || sameSummaryAndDigest(overview, digest)) {
    const fbOnly = buildRssMaterialSummaryDigest(
      excerptPlain,
      row.title,
      COLLECT_OVERVIEW_MAX_CHARS,
      overviewFooterSource(row),
      row.source,
    );
    digest = fbOnly.digest;
    if (sameSummaryAndDigest(overview, digest)) {
      overview = fbOnly.overview;
    }
    usedGeminiForThis = false;
  }

  if (sameSummaryAndDigest(overview, digest)) {
    const m = /^事象:\s*(.+)$/m.exec(digest);
    const stub = ((m ? m[1] : digest) || "").trim();
    overview = `${truncateForLlm(stub, COLLECT_OVERVIEW_MAX_CHARS)}\n${overviewFooterSource(row)}`;
  }

  if (!usedGeminiForThis && shouldUseGeminiFormat() && geminiKey) {
    try {
      const insightBody = await formatDigestInsightOnly(geminiKey, {
        title: row.title,
        articleUrl: row.link,
        publishedDate: row.publishedDate,
        rssExcerptPlain: excerptPlain,
        materialSource: row.source,
      });
      digest = replaceDigestInsightParagraph(digest, insightBody);
      usedGeminiInsightOnly = true;
    } catch (eInsight) {
      console.warn("[ニュース収集] 見解のみ Gemini に失敗:", row.link, eInsight);
      logPipeline(STEP_ENRICH, {
        Result: "insight-fail",
        Url: shortUrlForLog(row.link),
      });
    }
  }

  if (row.source === "nvd") {
    digest = insertNvdSourceTagAfterVulnHeading(digest);
  }

  const geminiMark: GeminiUsageMark = usedGeminiForThis ? "Y" : usedGeminiInsightOnly ? "I" : "N";
  const mode =
    geminiMark === "Y"
      ? "GeminiFull"
      : geminiMark === "I"
        ? "GeminiInsightOnly"
        : useGemini
          ? "MaterialOnly"
          : "GeminiOff";
  logPipeline(STEP_ENRICH, { Result: geminiMark, Mode: mode, Url: shortUrlForLog(row.link) });

  return { overview, digest, geminiMark };
}
