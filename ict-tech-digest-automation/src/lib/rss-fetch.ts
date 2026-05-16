/**
 * RSS 本文取得（リトライ・HTML 検知・XML サニタイズ）
 */

const RSS_HEADERS: Record<string, string> = {
  "User-Agent": "ict-tech-digest-automation/1.0 (J-BIS internal)",
  Accept: "application/rss+xml, application/xml, application/rdf+xml, text/xml, */*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "ja,en;q=0.9",
};

const MAX_ATTEMPTS = 4;
const BACKOFF_MS = [0, 2000, 5000, 10_000] as const;
const FETCH_TIMEOUT_MS = 35_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** フィード URL の恒久リダイレクト（404 HTML → 有効 RSS） */
const FEED_URL_ALIASES: Record<string, string> = {
  "https://msrc.microsoft.com/blog/rss/": "https://msrc.microsoft.com/feed/",
  "https://rss.itmedia.co.jp/rss/2.0/nw.xml":
    "https://rss.itmedia.co.jp/rss/2.0/news_nettopics.xml",
};

export function resolveFeedUrl(feedUrl: string): string {
  return FEED_URL_ALIASES[feedUrl] ?? feedUrl;
}

export function isLikelyHtml(body: string): boolean {
  const head = body.slice(0, 800).trimStart();
  return (
    /^\s*<!DOCTYPE\s+html/i.test(head) ||
    /^\s*<html[\s>]/i.test(head) ||
    (/^\s*<\?xml/i.test(head) === false && /^\s*<rss[\s>]/i.test(head) === false &&
      /^\s*<rdf:RDF[\s>]/i.test(head) === false &&
      /^\s*<feed[\s>]/i.test(head) === false &&
      /<title>[^<]*404/i.test(head))
  );
}

/** XML 1.0 として問題になりやすい文字・素の & を緩和 */
export function sanitizeRssXml(raw: string): string {
  let xml = raw.replace(/^\uFEFF/, "").trim();
  xml = xml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  xml = xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
  return xml;
}

function decodeBody(buffer: Buffer, contentType: string | null): string {
  const ct = (contentType ?? "").toLowerCase();
  const charsetMatch = /charset=([^;\s]+)/i.exec(ct);
  const charset = charsetMatch?.[1]?.replace(/"/g, "") ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    err instanceof Error && "code" in err
      ? String((err as NodeJS.ErrnoException).code)
      : "";
  return (
    /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(msg + code) ||
    /HTTP 5\d{2}/.test(msg) ||
    /fetch failed/i.test(msg)
  );
}

/**
 * フィード URL から XML 文字列を取得（失敗時は最大3回リトライ）
 */
export async function fetchFeedXml(feedUrl: string): Promise<string> {
  const resolved = resolveFeedUrl(feedUrl);
  if (resolved !== feedUrl) {
    console.log(`[RSS] URL 差し替え: ${feedUrl} → ${resolved}`);
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt] > 0) {
      await sleep(BACKOFF_MS[attempt]);
    }
    try {
      const res = await fetch(resolved, {
        headers: RSS_HEADERS,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: "follow",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const body = decodeBody(Buffer.from(await res.arrayBuffer()), res.headers.get("content-type"));
      if (isLikelyHtml(body)) {
        throw new Error("HTML レスポンス（RSS ではない）");
      }
      return sanitizeRssXml(body);
    } catch (e) {
      lastErr = e;
      const retryable = isRetryableError(e);
      if (attempt < MAX_ATTEMPTS - 1 && retryable) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[RSS] リトライ ${attempt + 2}/${MAX_ATTEMPTS}: ${resolved} — ${msg}`);
        continue;
      }
      if (attempt < MAX_ATTEMPTS - 1 && !retryable && /HTML/.test(String(e))) {
        break;
      }
      if (attempt < MAX_ATTEMPTS - 1) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[RSS] リトライ ${attempt + 2}/${MAX_ATTEMPTS}: ${resolved} — ${msg}`);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
