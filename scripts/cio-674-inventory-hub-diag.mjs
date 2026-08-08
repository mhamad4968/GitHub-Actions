#!/usr/bin/env node
/**
 * 674 棚卸状況一覧向け live 診断（O1 / R2）
 * - 670 キャンペーン期間での済／未了
 * - 年次 5/1〜翌4/30 での済／未了（参考）
 * - マスタ外（未一致）件数
 *
 *   npm run cio:674:inventory-hub-diag
 */
import "dotenv/config";

const APP = 674;
const APP_ENV = 670;
const base = process.env.KINTONE_BASE_URL.replace(/\/+$/, "").replace(/\/k$/, "");
const auth = {
  "X-Cybozu-Authorization": Buffer.from(
    `${process.env.KINTONE_USERNAME}:${process.env.KINTONE_PASSWORD}`
  ).toString("base64"),
};

const DEPTS = new Set([
  "役員室",
  "顧問室",
  "経理部",
  "総務部",
  "経営企画部",
  "人事研修部",
  "人事研修部出向者",
  "安全推進部",
  "施工推進部",
  "メンテナンス技術部",
  "塗装技術部",
  "品質管理部",
  "東北支店",
  "仙台営業所",
  "秋田営業所",
  "盛岡営業所",
  "関越支店",
  "新潟営業所",
  "長野営業所",
  "高崎営業所",
  "東京支店",
  "水戸営業所",
  "千葉営業所",
  "東海支店",
  "東京営業所",
  "静岡営業所",
  "名古屋営業所",
  "関西営業所",
  "札幌支店",
  "首都圏支店",
  "鉄構支店",
  "湾岸工事所",
]);
const ALIAS = { 人事研修部付出向者: "人事研修部出向者" };

function n(s) {
  return String(s || "")
    .normalize("NFKC")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function can(d) {
  d = n(d);
  return ALIAS[d] || d;
}
function parseYmd(s) {
  const m = String(s || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}
function fiscalBounds(today = new Date()) {
  const y = today.getFullYear();
  const mo = today.getMonth() + 1;
  if (mo >= 5) return { start: `${y}-05-01`, end: `${y + 1}-04-30` };
  return { start: `${y - 1}-05-01`, end: `${y}-04-30` };
}

async function getRecords(app, query, fields) {
  const all = [];
  let offset = 0;
  for (;;) {
    const u = new URL(`${base}/k/v1/records.json`);
    u.searchParams.set("app", String(app));
    u.searchParams.set("query", `${query} limit 500 offset ${offset}`);
    for (const f of fields) u.searchParams.append("fields", f);
    const res = await fetch(u, { headers: auth });
    const j = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(j));
    const recs = j.records || [];
    all.push(...recs);
    if (recs.length < 500) break;
    offset += 500;
  }
  return all;
}

const envRecs = await getRecords(
  APP_ENV,
  'order by レコード番号 desc',
  ["setting_key", "setting_value"]
);
const envMap = Object.create(null);
for (const r of envRecs) {
  const k = r.setting_key?.value || "";
  if (k && !Object.prototype.hasOwnProperty.call(envMap, k)) {
    envMap[k] = String(r.setting_value?.value || "").trim();
  }
}
const campaign = {
  start: parseYmd(envMap.PC_INVENTORY_PERIOD_START) || "(未設定)",
  end: parseYmd(envMap.PC_INVENTORY_PERIOD_END) || "(未設定)",
};
const fiscal = fiscalBounds();

const targets = await getRecords(
  APP,
  '(pc_status in ("利用中", "保管")) and (account_type in ("個人", "共有", "JR端末")) order by $id asc',
  ["$id", "pc_name", "group_name", "dept_name", "latest_inventory_date"]
);

function tally(bounds) {
  let done = 0;
  let pending = 0;
  let blankAff = 0;
  let unmatched = 0;
  const unmatchedSamples = [];
  for (const r of targets) {
    const g = n(r.group_name?.value);
    const d = can(r.dept_name?.value);
    const date = parseYmd(r.latest_inventory_date?.value);
    if (!g && !d) {
      blankAff++;
      continue;
    }
    if (!DEPTS.has(d)) {
      unmatched++;
      if (unmatchedSamples.length < 10) {
        unmatchedSamples.push({
          id: r.$id?.value,
          pc: r.pc_name?.value,
          group: g,
          dept: d,
        });
      }
    }
    const inPeriod =
      bounds.start &&
      bounds.end &&
      date &&
      date >= bounds.start &&
      date <= bounds.end;
    if (inPeriod) done++;
    else pending++;
  }
  return { done, pending, blankAff, unmatched, unmatchedSamples };
}

const c = tally(campaign);
const f = tally(fiscal);

console.log("=== 674 inventory hub diag ===");
console.log("targets", targets.length);
console.log("campaign(670)", campaign);
console.log("  done", c.done, "pending", c.pending, "blankAff(skip)", c.blankAff, "unmatched", c.unmatched);
console.log("fiscal(year)", fiscal);
console.log("  done", f.done, "pending", f.pending, "blankAff(skip)", f.blankAff, "unmatched", f.unmatched);
if (c.unmatchedSamples.length) {
  console.log("unmatched samples:", JSON.stringify(c.unmatchedSamples, null, 2));
}
if (c.unmatched > 0) {
  console.log("[cio:674:inventory-hub-diag] WARN unmatched>0 — R2: 集計外注記またはマスタ追記");
  process.exitCode = 0;
} else {
  console.log("[cio:674:inventory-hub-diag] OK unmatched=0");
}
