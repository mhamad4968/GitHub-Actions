/**
 * Gemini の generateContent に対する 429（クォータ）時の待機再試行。
 * collect（体裁）・analyze（週次）で共用する。
 */
import type { GoogleGenerativeAI } from "@google/generative-ai";

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 429 / クォータ系かざっくり判定（SDK が投げる FetchError の status または文言） */
export function isRateLimitError(err: unknown): boolean {
  if (err !== null && typeof err === "object" && "status" in err) {
    const s = (err as { status?: number }).status;
    if (s === 429) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /429|Too Many Requests|quota|Quota exceeded|RESOURCE_EXHAUSTED/i.test(msg);
}

/** API が返す "retry in 38.1s" から待ち毫秒（無ければ null） */
export function getRetryDelayMsFromError(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err);
  const m = /retry in ([\d.]+)\s*s\b/i.exec(msg);
  if (!m) return null;
  const sec = parseFloat(m[1]);
  if (Number.isNaN(sec)) return null;
  return Math.min(120_000, Math.max(5000, Math.ceil(sec * 1000)));
}

type GenerativeModel = ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

export type GenerateContentWith429Options = {
  /** ネットワーク上の再試行回数（初回含む）。既定 4 */
  maxNetAttempts?: number;
  /** console.warn の先頭タグ。既定 [Gemini体裁] */
  logTag?: string;
};

/**
 * 同一プロンプトで generateContent を呼び、429 のときだけ待機して再試行する。
 */
export async function generateContentWith429Retries(
  model: GenerativeModel,
  prompt: string,
  options: GenerateContentWith429Options = {},
): Promise<Awaited<ReturnType<GenerativeModel["generateContent"]>>> {
  const maxNetAttempts = options.maxNetAttempts ?? 4;
  const logTag = options.logTag ?? "[Gemini体裁]";
  let lastErr: unknown;
  for (let i = 0; i < maxNetAttempts; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (e) {
      lastErr = e;
    }
    if (!isRateLimitError(lastErr) || i === maxNetAttempts - 1) {
      throw lastErr;
    }
    const fromApi = getRetryDelayMsFromError(lastErr);
    const wait = fromApi ?? Math.min(60_000, 8000 * (i + 1));
    console.warn(
      `${logTag} ${i + 1} 回目の呼び出しが 429（クォータ）のため ${wait}ms 待って再試行します（最大 ${maxNetAttempts} 回まで）。別モデルは GEMINI_MODEL、安定運用は課金・枠の確認を。`,
    );
    await sleepMs(wait);
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
