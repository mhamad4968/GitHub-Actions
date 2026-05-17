/**
 * 記事 URL の国内/海外判定（ICT 掲示板 v2.1）
 */
import { DX_DOMESTIC_ONLY_CATEGORY, type IctCategory } from "./field-codes.js";

export { DX_DOMESTIC_ONLY_CATEGORY };

/** 日本向けメディア（.com 等でも国内扱い） */
const DOMESTIC_HOSTS = new Set([
  "qiita.com",
  "www.qiita.com",
  "zenn.dev",
  "b.hatena.ne.jp",
  "codezine.jp",
  "www.codezine.jp",
  "japan.cnet.com",
  "feeds.japan.cnet.com",
  "japan.zdnet.com",
  "feeds.japan.zdnet.com",
  "ascii.jp",
  "www.ascii.jp",
  "xtech.nikkei.com",
  "www.nikkei.com",
  "ipa.go.jp",
  "www.ipa.go.jp",
  "scan.netsecurity.ne.jp",
  "www.netsecurity.ne.jp",
  "pc.watch.impress.co.jp",
  "internet.watch.impress.co.jp",
  "forest.watch.impress.co.jp",
  "www.itmedia.co.jp",
  "rss.itmedia.co.jp",
  "www.atmarkit.co.jp",
]);

/** 海外公式（パッチ/CVE 等・DX カテゴリ不可） */
const INTERNATIONAL_HOSTS = new Set([
  "msrc.microsoft.com",
  "www.microsoft.com",
  "microsoft.com",
  "blogs.windows.com",
  "www.windows.com",
  "nvd.nist.gov",
  "api.msrc.microsoft.com",
]);

/**
 * 記事 URL が国内ソースか（日本の情シス・DX 文脈に直結しうるか）
 */
export function isDomesticArticleUrl(url: string): boolean {
  let host: string;
  try {
    host = new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return false;
  }

  if (DOMESTIC_HOSTS.has(host)) return true;
  if (INTERNATIONAL_HOSTS.has(host)) return false;

  if (host.endsWith(".go.jp")) return true;
  if (host.endsWith(".jp")) return true;

  // japan.*.com（CNET/ZDNet Japan 等）
  if (/\.japan\./i.test(host) || host.startsWith("japan.")) return true;

  // itmedia / impress / nikkei サブドメイン
  if (host.includes("itmedia.co.jp") || host.endsWith(".impress.co.jp")) return true;
  if (host.includes("nikkei.com")) return true;

  return false;
}

export type PickWithScore = {
  url: string;
  category: IctCategory;
  importanceScore: number;
};

/** 国内ソースにスコア加点（同等なら国内を上げる） */
export function applyDomesticScoreBoost<T extends PickWithScore>(picks: T[]): T[] {
  return picks.map((p) => ({
    ...p,
    importanceScore: p.importanceScore + (isDomesticArticleUrl(p.url) ? 5 : 0),
  }));
}

/** DX人材・IT資格・組織は国内 URL のみ残す */
export function filterPicksBySourceRegion<T extends PickWithScore & { title?: string }>(
  picks: T[],
): T[] {
  return picks.filter((p) => {
    if (p.category !== DX_DOMESTIC_ONLY_CATEGORY) return true;
    if (isDomesticArticleUrl(p.url)) return true;
    console.warn(
      `[Gemini厳選] 国内限定カテゴリのためスキップ（海外URL）: category=${p.category} url=${p.url}`,
    );
    return false;
  });
}
