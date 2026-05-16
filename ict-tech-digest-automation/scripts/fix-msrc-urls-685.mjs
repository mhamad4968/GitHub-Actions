/**
 * 685 レコードの MSRC 個別 CVE URL（PostgreSQL/NGINX 等）を NVD に修正。
 * Usage: npx dotenv -e ../.env -e ../.env.proxy -- node scripts/fix-msrc-urls-685.mjs [--dry-run]
 */
import "dotenv/config";

const dryRun = process.argv.includes("--dry-run");
const token = process.env.KINTONE_API_TOKEN_ICT_COLLECT;
const base = (process.env.KINTONE_BASE_URL || "https://jbis-kintone.cybozu.com").replace(/\/+$/, "");
const app = process.env.ICT_DIGEST_STORE_APP_ID || "685";

const MSRC_VULN_PAGE_RE =
  /^https?:\/\/msrc\.microsoft\.com\/update-guide\/vulnerability\/(CVE-\d{4}-\d+)\/?$/i;
const NON_MS_PRODUCT_RE =
  /postgresql|postgres\b|nginx\b|linux\s+kernel|apache\s+http|openssl\b|mariadb|mysql\b|openssh|docker\b|kubernetes|vmware|fortinet|ivanti|wordpress|tomcat\b|jetty|jenkins|gitlab|jira\b/i;

function resolveArticleUrl(url, title, overview) {
  const u = String(url || "").trim();
  const m = MSRC_VULN_PAGE_RE.exec(u);
  if (!m) return u;
  if (NON_MS_PRODUCT_RE.test(`${title}\n${overview}`)) {
    return `https://nvd.nist.gov/vuln/detail/${m[1].toUpperCase()}`;
  }
  return u;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || String(res.status));
  return json;
}

let offset = 0;
let fixed = 0;
while (true) {
  const q = `url like "msrc.microsoft.com" order by レコード番号 asc limit 100 offset ${offset}`;
  const data = await fetchJson(`${base}/k/v1/records.json?app=${app}&query=${encodeURIComponent(q)}`, {
    headers: { "X-Cybozu-API-Token": token },
  });
  const records = data.records || [];
  if (records.length === 0) break;

  for (const rec of records) {
    const id = rec.$id?.value;
    const rev = rec.$revision?.value;
    const title = rec.title?.value || "";
    const overview = rec.overview?.value || "";
    const url = rec.url?.value || "";
    const next = resolveArticleUrl(url, title, overview);
    if (next === url) continue;
    console.log(`[fix-msrc] id=${id}\n  ${url}\n  → ${next}`);
    if (!dryRun) {
      await fetchJson(`${base}/k/v1/record.json`, {
        method: "PUT",
        headers: {
          "X-Cybozu-API-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app,
          id,
          revision: rev,
          record: { url: { value: next } },
        }),
      });
    }
    fixed++;
  }
  if (records.length < 100) break;
  offset += 100;
}
console.log(`[fix-msrc] ${dryRun ? "dry-run " : ""}done fixed=${fixed}`);
