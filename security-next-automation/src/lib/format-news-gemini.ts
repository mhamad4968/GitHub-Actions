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

/** 全文 Gemini 失敗時に「見解」だけを埋める API 呼び出しの再試行回数 */
const INSIGHT_MAX_ATTEMPTS = 2;

const INSIGHT_EXCERPT_MAX = 2000;

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

function digestSectionBody(digest: string, heading: string, nextHeading: string | null): string {
  const i = digest.indexOf(heading);
  if (i < 0) return "";
  const from = i + heading.length;
  const end = nextHeading ? digest.indexOf(nextHeading, from) : digest.length;
  const to = end < 0 ? digest.length : end;
  return digest.slice(from, to).trim();
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

  const jisho = digestSectionBody(digest, "事象:", "脆弱性関連:").replace(/\s+/g, "");
  const zeikan = digestSectionBody(digest, "脆弱性関連:", "修正・対策:").replace(/\s+/g, "");
  const minHead = Math.min(80, jisho.length, zeikan.length);
  if (minHead >= 40 && jisho.slice(0, minHead) === zeikan.slice(0, minHead)) {
    throw new Error(
      "事象 と 脆弱性関連 の冒頭が重複しています。事象はニュースの出来事・状況のみ。脆弱性関連は CVE・製品コンポーネント・攻撃種別・認証の問題など技術用語で別の文にしてください",
    );
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
      "**事象: と 脆弱性関連: は同じ文・同じ言い回しを繰り返さない**（コピペ禁止）。事象は「何が公表・観測されたか」のストリート。脆弱性関連は **技術側**（CVE 番号・攻撃ベクトル・弱点の性質・影響しうる資産）に絞る。",
      "事象: メーカー公表や報道ベースの**出来事**（製品名は出てよいが、技術説明の細部は脆弱性関連へ回す）。",
      "脆弱性関連: **技術名・CVE・認証・権限・コード実行の有無**など。事象で語った内容の言い換え繰り返しは禁止。抜粋に技術情報が無ければ短く「抜粋に CVE・詳細なし。元記事・アドバイザリで要確認」など。",
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
        : `\n\n[前回の出力は要件を満たしませんでした: ${lastErr}。overview は最終行のみ Security NEXT。digest は4見出し順守・事象と脆弱性関連は内容を分離・各見出しに本文1文以上・overview との重複なし。JSON のみ再出力。]`;
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

function parseInsightJson(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  const o = JSON.parse(t) as { insight?: unknown };
  const insight = typeof o.insight === "string" ? o.insight.trim() : "";
  if (insight.length < 15) {
    throw new Error("insight が短すぎます");
  }
  if (/Security NEXT/i.test(insight)) {
    throw new Error("insight に Security NEXT を含めないでください");
  }
  return insight;
}

/**
 * 要約の「見解:」欄のみ Gemini で生成する（全文整形が 429 等で失敗したとき用。トークンを抑える）
 */
export async function formatDigestInsightOnly(apiKey: string, input: NewsFormatInput): Promise<string> {
  const excerpt = truncateForLlm(input.rssExcerptPlain, INSIGHT_EXCERPT_MAX);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: [
      "あなたは組織の情報セキュリティ担当向けのアドバイザです。",
      "入力は RSS 抜粋のみ。抜粋に無い事実は断定せず、優先度や確認観点は「目安」「要確認」と留める。",
      "出力は有効な JSON オブジェクト 1 つだけ。キーは厳密に \"insight\" のみ。",
      "insight の値: 日本語で 1〜3 文。対応優先度の目安、社内で確認すべき論点（資産・利用範囲・パッチ方針など）、リスクの捉え方。",
      "「RSS 由来です」「自動登録です」などのメタ説明は書かない。中身の提案に集中。",
      "Security NEXT という文字列は insight に含めない。",
    ].join("\n"),
    generationConfig: {
      temperature: 0.28,
      maxOutputTokens: 640,
    },
  });

  const userBase = [
    "次の記事について、キー insight だけを JSON で返してください。",
    "",
    "タイトル: " + input.title,
    "URL: " + input.articleUrl,
    "公開日: " + input.publishedDate,
    "",
    "RSS 抜粋:",
    excerpt,
  ].join("\n");

  let lastErr = "（初回）";
  for (let attempt = 0; attempt < INSIGHT_MAX_ATTEMPTS; attempt++) {
    const fix =
      attempt === 0
        ? ""
        : `\n\n[前回不備: ${lastErr}。insight のみ・1〜3文・日本語・JSONのみ再出力。]`;
    const result = await generateContentWith429Retries(model, userBase + fix);
    const text = result.response.text().trim();
    if (!text) {
      lastErr = "空応答";
      continue;
    }
    try {
      return parseInsightJson(text);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`Gemini 見解のみが ${INSIGHT_MAX_ATTEMPTS} 回とも失敗: ${lastErr}`);
}
