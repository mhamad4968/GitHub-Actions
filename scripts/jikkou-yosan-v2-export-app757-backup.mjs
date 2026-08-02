/**
 * App757 内訳の予防退避（読み取り専用）。
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-export-app757-backup.mjs
 *
 * 出力: backups/756-app757-detail/（.gitignore 済み）
 */
import fs from "node:fs";
import path from "node:path";
import { kintoneGetJson } from "./lib/kintone-read-client.mjs";

const APP1 = 756;
const APP2 = 757;
const OUT_DIR = path.join("backups", "756-app757-detail");

async function fetchAll(app, queryBase, fields) {
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
    if (offset > 20000) break;
  }
  return all;
}

function slim(rec) {
  const o = {};
  for (const [k, v] of Object.entries(rec)) {
    o[k] = v && typeof v === "object" && "value" in v ? v.value : v;
  }
  return o;
}

const parentFields = [
  "$id",
  "$revision",
  "budget_version_id",
  "project_code",
  "project_name",
  "status",
  "Updated_datetime",
];
const detailFields = [
  "$id",
  "$revision",
  "budget_version_id",
  "stable_block_id",
  "block_no",
  "block_sort_order",
  "row_key",
  "row_kind",
  "row_sort_order",
  "work_type_code",
  "work_type_name",
  "category",
  "name_1",
  "name_2",
  "name_3",
  "name_spec_group",
  "quantity",
  "unit",
  "unit_price",
  "amount",
  "vendor_name",
  "remark",
  "Updated_datetime",
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const parents = await fetchAll(APP1, "order by $id asc", parentFields);
const byVersion = [];
for (const p of parents) {
  const bvid = p.budget_version_id?.value || "";
  if (!bvid) continue;
  const details = await fetchAll(
    APP2,
    `budget_version_id = "${bvid}" order by block_sort_order asc, row_sort_order asc`,
    detailFields,
  );
  byVersion.push({
    parentId: p.$id.value,
    revision: p.$revision.value,
    budget_version_id: bvid,
    project_code: p.project_code?.value || "",
    project_name: p.project_name?.value || "",
    status: p.status?.value || "",
    Updated_datetime: p.Updated_datetime?.value || "",
    detailCount: details.length,
    details: details.map(slim),
  });
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const payload = {
  exportedAt: new Date().toISOString(),
  purpose:
    "preventive App757 snapshot before cost-mgmt ops (Hamada GO 2026-08-02)",
  app1: APP1,
  app2: APP2,
  parentCount: parents.length,
  versionCount: byVersion.length,
  totalDetailRows: byVersion.reduce((n, v) => n + v.detailCount, 0),
  versions: byVersion,
};

const outPath = path.join(OUT_DIR, `app757-all-versions-${stamp}.json`);
const summaryPath = path.join(OUT_DIR, `app757-all-versions-${stamp}.summary.txt`);
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
const lines = [
  `exportedAt=${payload.exportedAt}`,
  `parents=${payload.parentCount}`,
  `versions=${payload.versionCount}`,
  `totalDetailRows=${payload.totalDetailRows}`,
  "",
  ...byVersion.map(
    (v) =>
      `parent#${v.parentId} ${v.budget_version_id} status=${v.status} details=${v.detailCount} ${v.project_name || v.project_code || ""}`,
  ),
];
fs.writeFileSync(summaryPath, `${lines.join("\n")}\n`, "utf8");
console.log(lines.join("\n"));
console.log(`wrote ${outPath}`);
console.log(`wrote ${summaryPath}`);
