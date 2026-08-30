/**
 * S0 — 既存値スキャン（読み取り専用）。G0 §16 listOnly 祖父候補用。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-s0-existing-value-scan.mjs
 *
 * 書込なし。736/予実コード不触。出力のみ。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { kintoneGetJson } from "./lib/kintone-read-client.mjs";

const APP1 = 756;
const APP2 = 757;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_JSON = path.join(
  ROOT,
  "docs/plans/2026-08-30-jikkou-yosan-v2-s0-existing-value-scan.json",
);
const OUT_MD = path.join(
  ROOT,
  "docs/plans/2026-08-30-jikkou-yosan-v2-s0-existing-value-scan.md",
);

/** G0 §6.2 契約工種 12 */
const MASTER_CONTRACT = Object.freeze([
  "橋桁修繕工",
  "塗替塗装工",
  "足場工",
  "中止補償",
  "線閉責任者",
  "工事安全専任管理者",
  "工事管理者(保)",
  "列車見張員",
  "交通整理員",
  "誘導員",
  "検電接地",
  "その他保安費",
]);

/** G0 §7 費目 7 */
const MASTER_HIMOKU = Object.freeze([
  "材料費",
  "外注費",
  "労務費",
  "仮設機械経費",
  "現場経費",
  "その他費用",
  "外注労務費",
]);

/** コード表のみ・メニューから外す（§7） */
const LEGACY_HIMOKU_DROP = Object.freeze([
  "工具･機械使用料",
  "諸経費",
  "法定福利費",
  "予備費",
]);

/** G0 §9.1 外注費の種別 5 */
const MASTER_OUTSOURCE_TYPES = Object.freeze([
  "材料費",
  "労務費",
  "仮設機械経費",
  "現場経費",
  "その他費用",
]);

async function fetchAll(app, fields, queryBase = "") {
  const all = [];
  let offset = 0;
  const limit = 500;
  for (;;) {
    const q = queryBase
      ? `${queryBase} limit ${limit} offset ${offset}`
      : `limit ${limit} offset ${offset}`;
    const params = new URLSearchParams({
      app: String(app),
      query: q,
      totalCount: "true",
    });
    for (const f of fields) params.append("fields", f);
    const data = await kintoneGetJson(`/k/v1/records.json?${params}`);
    const recs = data.records || [];
    all.push(...recs);
    if (recs.length < limit) break;
    offset += limit;
    if (offset > 50000) break;
  }
  return all;
}

function addCount(map, value) {
  const v = String(value ?? "").trim();
  if (!v) return;
  map.set(v, (map.get(v) || 0) + 1);
}

function sortedEntries(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"));
}

function classify(values, master, { alsoLegacyDrop = [] } = {}) {
  const masterSet = new Set(master);
  const dropSet = new Set(alsoLegacyDrop);
  const inMaster = [];
  const grandfather = [];
  const legacyDrop = [];
  for (const [v, n] of sortedEntries(values)) {
    if (masterSet.has(v)) inMaster.push({ value: v, count: n });
    else if (dropSet.has(v)) legacyDrop.push({ value: v, count: n });
    else grandfather.push({ value: v, count: n });
  }
  return { inMaster, grandfather, legacyDrop };
}

const parentFields = [
  "$id",
  "project_code",
  "project_name",
  "budget_version_id",
  "contract_lines",
  "summary_cost_lines",
];
const detailFields = [
  "$id",
  "budget_version_id",
  "work_type_name",
  "category",
  "name_1",
  "name_2",
  "name_3",
  "row_kind",
];

console.log("[S0] read-only scan start app=%s/%s", APP1, APP2);

const parents = await fetchAll(APP1, parentFields, "order by $id asc");
const details = await fetchAll(APP2, detailFields, "order by $id asc");

const contractWork = new Map();
const contractSection = new Map();
const himoku = new Map();
const name2ByHimoku = new Map();
const workType = new Map();
const summaryLineType = new Map();
const summaryWorkType = new Map();
const name3WhenMaterial = new Map();

let contractRows = 0;
let detailRows = 0;

for (const p of parents) {
  const lines = p.contract_lines?.value || [];
  for (const row of lines) {
    const v = row.value || {};
    addCount(contractWork, v.contract_work_name?.value);
    addCount(contractSection, v.contract_section?.value);
    contractRows += 1;
  }
  const sums = p.summary_cost_lines?.value || [];
  for (const row of sums) {
    const v = row.value || {};
    addCount(summaryLineType, v.summary_line_type?.value);
    addCount(summaryWorkType, v.summary_work_type_name?.value);
  }
}

for (const d of details) {
  detailRows += 1;
  const n1 = d.name_1?.value || "";
  const n2 = d.name_2?.value || "";
  const n3 = d.name_3?.value || "";
  addCount(himoku, n1);
  addCount(workType, d.work_type_name?.value);
  if (n1) {
    if (!name2ByHimoku.has(n1)) name2ByHimoku.set(n1, new Map());
    addCount(name2ByHimoku.get(n1), n2);
  }
  if (n1 === "材料費" && (n2 === "塗料" || n2 === "その他材料")) {
    addCount(name3WhenMaterial, n3);
  }
}

const outsourceTypes = name2ByHimoku.get("外注費") || new Map();

const report = {
  scannedAt: new Date().toISOString(),
  timezoneNote: "JST wall-clock for session; ISO timestamps are UTC",
  apps: { app1: APP1, app2: APP2 },
  counts: {
    parents: parents.length,
    contractRows,
    detailRows,
    summaryCostRows: [...summaryLineType.values()].reduce((a, b) => a + b, 0),
  },
  masters: {
    contractWork: MASTER_CONTRACT,
    himoku: MASTER_HIMOKU,
    outsourceTypes: MASTER_OUTSOURCE_TYPES,
    legacyHimokuDrop: LEGACY_HIMOKU_DROP,
  },
  contract_work_name: classify(contractWork, MASTER_CONTRACT),
  contract_section: sortedEntries(contractSection).map(([value, count]) => ({
    value,
    count,
  })),
  name_1_himoku: classify(himoku, MASTER_HIMOKU, {
    alsoLegacyDrop: LEGACY_HIMOKU_DROP,
  }),
  name_2_when_outsource: classify(outsourceTypes, MASTER_OUTSOURCE_TYPES),
  name_2_by_himoku: Object.fromEntries(
    [...name2ByHimoku.entries()].map(([h, m]) => [
      h,
      sortedEntries(m).map(([value, count]) => ({ value, count })),
    ]),
  ),
  work_type_name: sortedEntries(workType).map(([value, count]) => ({
    value,
    count,
  })),
  summary_line_type: sortedEntries(summaryLineType).map(([value, count]) => ({
    value,
    count,
  })),
  summary_work_type_name: sortedEntries(summaryWorkType).map(([value, count]) => ({
    value,
    count,
  })),
  name_3_material_candidates: sortedEntries(name3WhenMaterial).map(
    ([value, count]) => ({ value, count }),
  ),
  listOnlyPolicy: {
    newRows: "master only",
    existingValues: "grandfather into options so save remains possible",
    orphanNotOfferedOnNewRows: true,
  },
};

fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + "\n", "utf8");

function mdList(title, items) {
  if (!items.length) return `### ${title}\n\n（なし）\n`;
  const lines = items.map((x) => `- \`${x.value}\` ×${x.count}`).join("\n");
  return `### ${title}\n\n${lines}\n`;
}

const md = `# S0 既存値スキャン — 実行予算 756/757（読取専用）

**日時**: ${report.scannedAt}  
**件数**: 親 ${report.counts.parents} / 請負行 ${report.counts.contractRows} / 内訳明細 ${report.counts.detailRows}  
**方針**: §16.1 listOnly 祖父（新規＝マスタのみ／既存値は選択肢に残す）

## 契約工種（contract_work_name）

${mdList("マスタ内", report.contract_work_name.inMaster)}
${mdList("祖父候補（マスタ外・保存維持）", report.contract_work_name.grandfather)}

## 費目（name_1）

${mdList("マスタ7内", report.name_1_himoku.inMaster)}
${mdList("レガシー削除候補（メニュー外・既存は祖父）", report.name_1_himoku.legacyDrop)}
${mdList("その他祖父", report.name_1_himoku.grandfather)}

## 外注費の種別（name_2 | 費目=外注費）

${mdList("マスタ5内", report.name_2_when_outsource.inMaster)}
${mdList("祖父候補", report.name_2_when_outsource.grandfather)}

## 材料（費目=材料費 かつ 種別=塗料/その他材料 の name_3）

${mdList("現行ユニーク", report.name_3_material_candidates)}

## 次手

S1: フィールド追加（ヘッダDD・事務所・休日・工種説明・総括材料列）。live deploy しない。

JSON: \`${path.relative(ROOT, OUT_JSON)}\`
`;

fs.writeFileSync(OUT_MD, md, "utf8");

console.log("[S0] OK parents=%d contractRows=%d details=%d", parents.length, contractRows, detailRows);
console.log("[S0] contract grandfather=%d himoku grandfather=%d legacyDrop=%d",
  report.contract_work_name.grandfather.length,
  report.name_1_himoku.grandfather.length,
  report.name_1_himoku.legacyDrop.length,
);
console.log("[S0] wrote %s", path.relative(ROOT, OUT_MD));
console.log("[S0] wrote %s", path.relative(ROOT, OUT_JSON));
