#!/usr/bin/env node
/**
 * PC台帳(594) の ledger_record_id が入っているが、627 から当該 594 に
 * 1 件も紐付いていない（pc_594_record_id / pc_ledger_links）レコードを検出し、
 * 任意で ledger_record_id をクリアする。
 *
 * 前提: 627 が「真実の紐付け」、594 の番号は整合時のミラー。
 *
 * 環境変数（案A・他スクリプトと同様）:
 *   KINTONE_BASE_URL または KINTONE_DOMAIN
 *   KINTONE_USERNAME / KINTONE_PASSWORD
 *   任意: KINTONE_BASIC_AUTH_USERNAME / KINTONE_BASIC_AUTH_PASSWORD
 *
 * 実行:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/clear-594-orphan-ledger-record-id.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/clear-594-orphan-ledger-record-id.mjs --apply
 */
import "dotenv/config";

const APP_594 = 594;
const APP_627 = 627;
const FC_594_LEDGER = "ledger_record_id";
const FC_627_PC594 = "pc_594_record_id";
const FC_627_PC_SUBTABLE = "pc_ledger_links";
const FC_627_PC_SUB_594 = "pc_ledger_link_594_id";

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === "") throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

function apiOrigin() {
  const raw = process.env.KINTONE_BASE_URL?.trim();
  if (raw) {
    const u = raw.startsWith("http") ? raw : `https://${raw}`;
    return u.replace(/\/+$/, "").replace(/\/k$/i, "");
  }
  const d = requireEnv("KINTONE_DOMAIN").replace(/^https?:\/\//i, "").split("/")[0];
  return `https://${d}`;
}

const baseUrl = apiOrigin();
const user = requireEnv("KINTONE_USERNAME");
const pass = requireEnv("KINTONE_PASSWORD");

const headers = {
  "X-Cybozu-Authorization": Buffer.from(`${user}:${pass}`, "utf8").toString("base64"),
  "Content-Type": "application/json",
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, "utf8").toString("base64")}`;
}

function headersWithoutContentType() {
  const h = { ...headers };
  delete h["Content-Type"];
  return h;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${json?.code || ""} ${json?.message || text}`.trim());
  }
  return json;
}

/** @param {number} app */
async function getFieldType(app, code) {
  const url = new URL(`${baseUrl}/k/v1/app/form/fields.json`);
  url.searchParams.set("app", String(app));
  const j = await fetchJson(url.toString(), { method: "GET", headers: headersWithoutContentType() });
  const t = j.properties?.[code]?.type;
  return typeof t === "string" ? t : "";
}

/** @param {number} app */
async function getAllRecords(app, fields) {
  const out = [];
  for (let off = 0; off < 100000; off += 500) {
    const params = new URLSearchParams();
    params.set("app", String(app));
    params.set("query", `$id > 0 order by $id asc limit 500 offset ${off}`);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const url = `${baseUrl}/k/v1/records.json?${params.toString()}`;
    const j = await fetchJson(url, { method: "GET", headers: headersWithoutContentType() });
    const recs = j.records || [];
    out.push(...recs);
    if (recs.length < 500) break;
  }
  return out;
}

function normId(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}

function clearValueForLedgerFieldType(type) {
  if (type === "NUMBER") return null;
  return "";
}

/**
 * 627 全件から「少なくとも1件の627が参照している」594 の $id 集合を作る。
 * @param {unknown[]} recs627
 */
function buildLinked594IdSet(recs627) {
  const linked = new Set();
  for (const r of recs627) {
    const single = normId(r[FC_627_PC594]?.value);
    if (single) linked.add(single);
    const rows = r[FC_627_PC_SUBTABLE]?.value || [];
    for (const sr of rows) {
      const v = normId(sr?.value?.[FC_627_PC_SUB_594]?.value);
      if (v) linked.add(v);
    }
  }
  return linked;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const ledgerType = await getFieldType(APP_594, FC_594_LEDGER);
  const emptyVal = clearValueForLedgerFieldType(ledgerType);

  const [recs627, recs594] = await Promise.all([
    getAllRecords(APP_627, ["$id", FC_627_PC594, FC_627_PC_SUBTABLE]),
    getAllRecords(APP_594, ["$id", "$revision", FC_594_LEDGER]),
  ]);

  const linked594 = buildLinked594IdSet(recs627);
  /** @type {{ id: string; revision: string; ledger: string }[]} */
  const orphans = [];
  for (const r of recs594) {
    const id = normId(r.$id?.value);
    if (!id) continue;
    const ledger = normId(r[FC_594_LEDGER]?.value);
    if (!ledger) continue;
    if (linked594.has(id)) continue;
    orphans.push({
      id,
      revision: normId(r.$revision?.value),
      ledger,
    });
  }

  console.log(
    `[clear-594-orphan-ledger] 627リンクなし & ${FC_594_LEDGER} あり: ${orphans.length} 件（627=${recs627.length} 594=${recs594.length}）`,
  );
  for (const o of orphans) {
    console.log(`  594#$id=${o.id} ${FC_594_LEDGER}=${o.ledger}`);
  }

  if (!apply) {
    console.log("\n（ドライラン）--apply を付けると上記の ledger_record_id をクリアします。");
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const o of orphans) {
    try {
      const rec = await fetchJson(
        `${baseUrl}/k/v1/record.json?app=${APP_594}&id=${encodeURIComponent(o.id)}`,
        { method: "GET", headers: headersWithoutContentType() },
      );
      const rev = normId(rec.record?.$revision?.value);
      if (!rev) throw new Error("no revision");
      await fetchJson(`${baseUrl}/k/v1/record.json`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          app: APP_594,
          id: o.id,
          revision: rev,
          record: { [FC_594_LEDGER]: { value: emptyVal } },
        }),
      });
      console.log(`[apply] cleared 594 id=${o.id}`);
      ok++;
    } catch (e) {
      console.warn(`[apply] failed 594 id=${o.id}`, e?.message || e);
      fail++;
    }
  }
  console.log(`\n[clear-594-orphan-ledger] 完了 ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
