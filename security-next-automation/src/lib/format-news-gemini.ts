/**
 * ニュース 1 件の「概要」（1〜2 文の全体像）と「要約」（事象・脆弱性関連・修正・対策・見解の 4 見出し）を Gemini で整形する。
 * analyze.ts と同モデルで揃え、出力は JSON のみで受け取ってパースする。
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

import { truncateForLlm } from "./text.js";

/** Google AI Studio / Generative Language API のモデル ID（429・404 時は .env / GEMINI_MODEL で別名へ。例: gemini-2.5-flash-preview） */
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 429 / クォータ系かざっくり判定（SDK が投げる FetchError の status または文言） */
function isRateLimitError(err: unknown): boolean {
  if (err !== null && typeof err === "object" && "status" in err) {
    const s = (err as { status?: number }).status;
    if (s === 429) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /429|Too Many Requests|quota|Quota exceeded|RESOURCE_EXHAUSTED/i.test(msg);
}

/** API が返す "retry in 38.1s" から待ち毫秒（無ければ null） */
function getRetryDelayMsFromError(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err);
  const m = /retry in ([\d.]+)\s*s\b/i.exec(msg);
  if (!m) return null;
  const sec = parseFloat(m[1]);
  if (Number.isNaN(sec)) return null;
  return Math.min(120_000, Math.max(5000, Math.ceil(sec * 1000)));
}

/**
 * 同一プロンプトで generateContent を呼び、429 のときだけ指数バックオフ気味に再試行する（無料枠の一時枯渇向け）
 */
async function generateContentWith429Retries(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  prompt: string,
  maxNetAttempts = 4,
): Promise<Awaited<ReturnType<typeof model.generateContent>>> {
  let lastErr: unknown;
  for (let i = 0; i < maxNetAttempts; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (e) {
      lastErr = e;
      if (!isRateLimitError(e) || i === maxNetAttempts - 1) {
        throw e;
      }
      const fromApi = getRetryDelayMsFromError(e);
      const wait = fromApi ?? Math.min(60_000, 8000 * (i + 1));
      console.warn(
        `[Gemini体裁] ${i + 1} 回目の呼び出しが 429（クォータ）のため ${wait}ms 待って再試行します（最大 ${maxNetAttempts} 回まで）。別モデルは GEMINI_MODEL、安定運用は課金・枠の確認を。`,
      );
      await sleepMs(wait);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** LLM 入力に渡す RSS 抜粋の上限（トークン節約） */
const EXCERPT_FOR_LLM_MAX = 3500;

/** 体裁検証に失敗したときの最大再試行回数（プロンプトに検証メッセージを付けてやり直す） */
const FORMAT_MAX_ATTEMPTS = 3;

const DIGEST_HEADINGS = [
  "事象:",
  "脆弱性関連:",
  "修正・対策:",
  "見解:",
] as const;

export type NewsFormatInput = {
  title: string;
  articleUrl: string;
  publishedDate: string;
  /** プレーン化済み RSS 抜粋（要約欄のたたき台） */
  rssExcerptPlain: string;
};

export type NewsFormatOutput = {
  overview: string;
  digest: string;
};

function parseFormatJson(raw: string): NewsFormatOutput {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  const o = JSON.parse(t) as { overview?: unknown; digest?: unknown };
  const overview = typeof o.overview === "string" ? o.overview.trim() : "";
  const digest = typeof o.digest === "string" ? o.digest.trim() : "";
  if (!overview || !digest) {
    throw new Error("Gemini の JSON に overview または digest が空です");
  }
  return { overview, digest };
}

/**
 * 概要・要約が仕様どおりか検証（失敗時はメッセージを投げて再生成の材料にする）
 */
export function validateNewsFormat(out: NewsFormatOutput): void {
  const overview = out.overview.replace(/\r\n/g, "\n").trim();
  const digest = out.digest.replace(/\r\n/g, "\n").trim();

  if (digest.includes("Security NEXT")) {
    throw new Error("digest に Security NEXT を含めないでください（概要専用）");
  }

  const oLines = overview.split("\n").map((l) => l.trimEnd().trim());
  const nonEmpty = oLines.filter((l) => l.length > 0);
  if (nonEmpty.length < 2) {
    throw new Error("overview は本文 1 行以上＋最終行 Security NEXT が必要です");
  }
  if (nonEmpty[nonEmpty.length - 1] !== "Security NEXT") {
    throw new Error('overview の最終行は "Security NEXT" 単独の 1 行にしてください');
  }
  const body = nonEmpty.slice(0, -1).join(" ").trim();
  if (body.length < 15) {
    throw new Error("overview 本文が短すぎます（材料として 1〜2 文で何が起きたかを書いてください）");
  }
  if (body.length > 520) {
    throw new Error("overview 本文が長すぎます（1〜2 文・全体像のみ。詳細は digest へ）");
  }

  let lastPos = -1;
  for (const label of DIGEST_HEADINGS) {
    const p = digest.indexOf(label);
    if (p === -1) {
      throw new Error(`digest に必須見出し ${label} がありません`);
    }
    if (p <= lastPos) {
      throw new Error(`digest の見出し順が不正です（${label}）`);
    }
    lastPos = p;
  }

  for (let i = 0; i < DIGEST_HEADINGS.length; i++) {
    const label = DIGEST_HEADINGS[i];
    const start = digest.indexOf(label) + label.length;
    const next =
      i + 1 < DIGEST_HEADINGS.length ? digest.indexOf(DIGEST_HEADINGS[i + 1], start) : digest.length;
    const section = digest.slice(start, next).trim();
    if (section.length < 12) {
      throw new Error(
        `${label} の直後が空に近いです。情報が無い場合は「RSS 抜粋に明示なし。元記事で要確認。」など 1 文以上書いてください`,
      );
    }
  }

  const normOverviewBody = body.replace(/\s+/g, " ");
  const normDigest = digest.replace(/\s+/g, " ");
  if (normOverviewBody.length > 0 && normDigest.startsWith(normOverviewBody.slice(0, Math.min(40, normOverviewBody.length)))) {
    throw new Error("digest の先頭が overview 本文と同じ始まりになっています。要約は別の言い回しで書いてください");
  }
}

/**
 * タイトル・URL・公開日・RSS 抜粋から、kintone の概要・要約用テキストを生成する。
 */
export async function formatNewsForKintone(
  apiKey: string,
  input: NewsFormatInput,
): Promise<NewsFormatOutput> {
  const excerpt = truncateForLlm(input.rssExcerptPlain, EXCERPT_FOR_LLM_MAX);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: [
      "あなたは情報セキュリティ系メディア「Security NEXT」品格の編集者です。",
      "入力は RSS 由来の抜粋のみであり本文全体はありません。抜粋に無い事実は断定せず、不明なら「詳細は確認中」「RSS 抜粋に明示なし」などと書いてください。",
      "出力は有効な JSON オブジェクト 1 つだけ。前後に説明文やマークダウンを付けない。",
      'キーは厳密に "overview" と "digest" の 2 つ。',
      "",
      "【overview】日本語。**概要**＝資料のネタ探し用に「何が起きたか」が一目で分かる**全体像**のみ。",
      "原則 **1 文または 2 文**（読点は少なめ）。数値・CVE 番号・製品バージョン・手順的な対策の列挙は digest に回す。",
      "**overview の本文と digest の本文は重複禁止**（同じ文・同じ言い回しのコピペ不可）。digest は別の構成で掘り下げる。",
      "最終行を**独立した 1 行**とし、`Security NEXT` のみ（他の出典表記は付けない）。",
      "",
      "【digest】日本語。**要約**＝概要より詳しく、抜粋に基づき材料として後読み・調査に使える粒度。",
      "**Security NEXT** という文字列は digest に入れない。",
      "次の 4 見出しを**この順・この表記**で各行の先頭に付ける（コロンは半角）:",
      "事象:",
      "脆弱性関連:",
      "修正・対策:",
      "見解:",
      "各見出しのコロン**直後**は空にしない。**最低 1 文・おおよそ 15 文字以上**。抜粋に無い事項は「記事・公式で要確認」「抜粋に明示なし」と明示する。",
      "事象: 影響範囲・停止・被害の様子・攻撃の手口の素朴な説明（抜粋ベース）。",
      "脆弱性関連: CVE・製品名・認証の問題等。抜粋に無ければ推測せず確認依頼の文にする。",
      "修正・対策: パッチ・バージョン・推奨設定が抜粋にあれば。無ければ「元記事の対応を確認」系。",
      "見解: 管理者向けに優先度の目安・すぐ確認すべき点を 1〜2 文（断定しすぎない）。",
    ].join("\n"),
    generationConfig: {
      temperature: 0.22,
      maxOutputTokens: 2800,
    },
  });

  const userBase = [
    "次の記事情報を、指示どおり JSON で返してください。",
    "",
    "タイトル: " + input.title,
    "URL: " + input.articleUrl,
    "公開日（JST 日付）: " + input.publishedDate,
    "",
    "RSS 抜粋:",
    excerpt,
  ].join("\n");

  let lastErr = "（初回）";
  for (let attempt = 0; attempt < FORMAT_MAX_ATTEMPTS; attempt++) {
    const fix =
      attempt === 0
        ? ""
        : `\n\n[前回の出力は要件を満たしませんでした: ${lastErr}。overview は最終行のみ Security NEXT。digest は4見出し順守・各見出しに本文1文以上・overview との重複なし。JSON のみ再出力。]`;
    const result = await generateContentWith429Retries(model, userBase + fix);
    const text = result.response.text().trim();
    if (!text) {
      lastErr = "Gemini から空の応答";
      continue;
    }
    let parsed: NewsFormatOutput;
    try {
      parsed = parseFormatJson(text);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      continue;
    }
    try {
      validateNewsFormat(parsed);
      return parsed;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`Gemini 体裁が ${FORMAT_MAX_ATTEMPTS} 回とも検証に失敗しました: ${lastErr}`);
}
