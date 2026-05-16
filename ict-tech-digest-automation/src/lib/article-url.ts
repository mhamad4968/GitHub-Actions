/**
 * 掲示板リンク先の正規化（MSRC Update Guide の非 Microsoft CVE は 404 になるため NVD へ）。
 */

const MSRC_VULN_PAGE_RE =
  /^https?:\/\/msrc\.microsoft\.com\/update-guide\/vulnerability\/(CVE-\d{4}-\d+)\/?$/i;

/** MSRC SUG に載らない OSS / 他ベンダー製品（タイトル・概要から判定） */
const NON_MS_PRODUCT_RE =
  /postgresql|postgres\b|nginx\b|linux\s+kernel|apache\s+http|openssl\b|mariadb|mysql\b|bind9|samba|openssh|curl\b|docker\b|kubernetes|vmware|fortinet|ivanti|palo\s*alto|f5\s+big-ip|cisco\s+ios|juniper|qnap|synology|wordpress|drupal|joomla|perl\b|python\b(?![\s\S]{0,40}windows)|ruby\b(?![\s\S]{0,40}windows)|node\.?js|npm\b|maven|gradle|git\b|subversion|svn\b|marimo|zabbix|grafana|jenkins|gitlab|github\s+enterprise|atlassian|confluence|jira\b|thinkphp|spring\s+framework|struts|tomcat\b|jetty|wildfly|weblogic|websphere/i;

export function extractCveIds(...texts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of texts) {
    const re = /CVE-\d{4}-\d+/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t || "")) !== null) {
      const id = m[0].toUpperCase();
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

export function nvdDetailUrl(cveId: string): string {
  return `https://nvd.nist.gov/vuln/detail/${cveId.toUpperCase()}`;
}

/**
 * MSRC の CVE 個別ページは Microsoft 製品のみ。PostgreSQL / NGINX 等は API・SPA とも 404。
 */
export function shouldPreferNvdOverMsrc(title: string, overview: string): boolean {
  const ctx = `${title}\n${overview}`;
  return NON_MS_PRODUCT_RE.test(ctx);
}

export function resolveArticleUrl(url: string, title: string, overview: string): string {
  const u = (url || "").trim();
  if (!u) return u;
  const m = MSRC_VULN_PAGE_RE.exec(u);
  if (!m) return u;
  const cve = m[1].toUpperCase();
  if (shouldPreferNvdOverMsrc(title, overview)) {
    return nvdDetailUrl(cve);
  }
  return u;
}

export function linkResolutionNote(url: string, title: string, overview: string): string | null {
  const resolved = resolveArticleUrl(url, title, overview);
  if (resolved === (url || "").trim()) return null;
  if (MSRC_VULN_PAGE_RE.test((url || "").trim())) {
    return "MSRC 個別ページは当該 CVE が掲載されないため NVD を表示しています";
  }
  return null;
}
