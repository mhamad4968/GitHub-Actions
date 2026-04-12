/**
 * NIST NVD CVE API 2.0 から指定期間の公開 CVE を取り、collect 向けに正規化する。
 * 無 API キー時はレートが厳しいため、実行あたり 1 リクエストに収める（先頭ページのみ）。
 */
import { truncateForLlm } from "./text.js";

export type NvdNormalizedRow = {
  title: string;
  link: string;
  publishedDate: string;
  digestFullText: string;
  sortTimeMs: number;
  source: "nvd";
};

type NvdCveResponse = {
  vulnerabilities?: Array<{ cve?: NvdCveCore }>;
  totalResults?: number;
  resultsPerPage?: number;
};

type NvdCveCore = {
  id?: string;
  published?: string;
  descriptions?: Array<{ lang?: string; value?: string }>;
  metrics?: Record<string, unknown>;
};

/** NVD の pubStartDate / pubEndDate 向け（例: 2024-03-25T12:00:00.000） */
function toNvdDateParam(d: Date): string {
  return `${d.toISOString().slice(0, 19)}.000`;
}

function pickEnglishDescription(cve: NvdCveCore): string {
  const list = cve.descriptions || [];
  const en = list.find((x) => (x.lang || "").toLowerCase() === "en")?.value?.trim();
  if (en) return en;
  return (list[0]?.value || "").trim();
}

/** CVSS の要点 1 行（無ければ空） */
function pickCvssLine(cve: NvdCveCore): string {
  const m = cve.metrics;
  if (!m || typeof m !== "object") return "";
  type CvssBlock = { cvssData?: { baseScore?: number; vectorString?: string } };
  const v31 = (m as { cvssMetricV31?: CvssBlock[] }).cvssMetricV31?.[0]?.cvssData;
  if (v31?.baseScore != null) {
    const v = v31.vectorString ? ` (${v31.vectorString})` : "";
    return `CVSS v3.1 base ${v31.baseScore}${v}`;
  }
  const v30 = (m as { cvssMetricV30?: CvssBlock[] }).cvssMetricV30?.[0]?.cvssData;
  if (v30?.baseScore != null) {
    const v = v30.vectorString ? ` (${v30.vectorString})` : "";
    return `CVSS v3.0 base ${v30.baseScore}${v}`;
  }
  const v2 = (m as { cvssMetricV2?: CvssBlock[] }).cvssMetricV2?.[0]?.cvssData;
  if (v2?.baseScore != null) {
    const v = v2.vectorString ? ` (${v2.vectorString})` : "";
    return `CVSS v2 base ${v2.baseScore}${v}`;
  }
  return "";
}

function titleFromCve(id: string, desc: string): string {
  if (!desc) return id;
  const oneLine = desc.replace(/\s+/g, " ").trim();
  const short = truncateForLlm(oneLine, 140);
  return `${id} — ${short}`;
}

/**
 * 直近 lookbackDays 日（UTC 基準で期間を切る）の CVE を NVD から取得し、新しい順に最大 maxItems 件に絞る。
 */
export async function fetchNvdCveRowsAsNormalized(opts: {
  lookbackDays: number;
  maxItems: number;
  apiKey?: string;
}): Promise<NvdNormalizedRow[]> {
  const lookbackDays = Math.max(1, opts.lookbackDays);
  const maxItems = Math.max(1, opts.maxItems);
  const pubEnd = new Date();
  const pubStart = new Date(pubEnd.getTime() - lookbackDays * 86_400_000);
  const u = new URL("https://services.nvd.nist.gov/rest/json/cves/2.0");
  u.searchParams.set("pubStartDate", toNvdDateParam(pubStart));
  u.searchParams.set("pubEndDate", toNvdDateParam(pubEnd));
  u.searchParams.set("resultsPerPage", "2000");
  /** NVD 公式: API キーはクエリではなくヘッダー apiKey（値は大文字小文字を区別） */
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "kintone-security-collector-nvd/1.0 (batch)",
  };
  if (opts.apiKey) {
    headers.apiKey = opts.apiKey;
  }
  const res = await fetch(u.toString(), { headers });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`NVD API HTTP ${res.status}: ${bodyText.slice(0, 240)}`);
  }
  let data: NvdCveResponse;
  try {
    data = JSON.parse(bodyText) as NvdCveResponse;
  } catch {
    throw new Error(`NVD API 応答が JSON ではありません: ${bodyText.slice(0, 120)}`);
  }
  const vulns = data.vulnerabilities || [];
  const total = data.totalResults ?? vulns.length;
  if (total > vulns.length) {
    console.warn(
      "[NVD] 期間内 totalResults が 1 ページを超えています。先頭",
      vulns.length,
      "件のみ使用（totalResults=",
      total,
      "）。期間を短くするか NVD_MAX_PER_RUN で上限を調整してください。",
    );
  }

  const rows: NvdNormalizedRow[] = [];
  for (const v of vulns) {
    const cve = v.cve;
    if (!cve) continue;
    const id = cve.id?.trim();
    if (!id || !/^CVE-\d{4}-\d+$/i.test(id)) continue;
    const desc = pickEnglishDescription(cve);
    const published = (cve.published || "").trim();
    const ms = published ? new Date(published).getTime() : 0;
    const sortTimeMs = Number.isNaN(ms) ? 0 : ms;
    const publishedDate =
      sortTimeMs > 0
        ? new Date(sortTimeMs).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })
        : new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    const cvssLine = pickCvssLine(cve);
    const digestParts = [
      `CVE ID: ${id}`,
      desc ? `説明（英語）: ${desc}` : "",
      cvssLine,
      "出典: NIST NVD。ニュース記事ではなく脆弱性データベースの登録情報です。",
    ].filter(Boolean);
    const digestFullText = truncateForLlm(digestParts.join("\n"), 4000);
    rows.push({
      title: titleFromCve(id, desc),
      link: `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(id)}`,
      publishedDate,
      digestFullText,
      sortTimeMs,
      source: "nvd",
    });
  }
  rows.sort((a, b) => b.sortTimeMs - a.sortTimeMs);
  return rows.slice(0, maxItems);
}
