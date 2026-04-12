/**
 * 記事 URL から HTML を取得しプレーン化した抜粋を返す（Gemini 入力の補強用）。
 * 失敗時は null（タイムアウト・非 HTML・サイズ超過など）。
 */
import { stripHtmlToPlain, truncateForLlm } from "./text.js";

const TIMEOUT_MS = 12_000;
const MAX_RESPONSE_BYTES = 400_000;
const MAX_PLAIN_CHARS = 5_500;

export async function tryFetchArticleBodyPlain(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    const cl = res.headers.get("content-length");
    if (cl && Number.parseInt(cl, 10) > MAX_RESPONSE_BYTES) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_RESPONSE_BYTES) return null;
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    if (!/<(html|body|article|main)\b/i.test(raw.slice(0, 12_000))) return null;
    const plain = stripHtmlToPlain(raw).replace(/\s+/g, " ").trim();
    if (plain.length < 120) return null;
    return truncateForLlm(plain, MAX_PLAIN_CHARS);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
