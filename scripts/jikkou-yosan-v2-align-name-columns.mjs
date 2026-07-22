/**
 * App2 既存行の name_1/2/3 を Excel U4 3列に付け替えるワンショット。
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-align-name-columns.mjs --budget-version-id bv-xxx [--apply]
 */
import { alignBlockDetailNameColumns } from "./lib/jikkou-yosan-v2/name-columns-excel-align.mjs";
import { getKintoneReadConfig, kintoneGetJson } from "./lib/kintone-read-client.mjs";

const APP2 = 757;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : "";
}
const budgetVersionId = arg("--budget-version-id");
const apply = process.argv.includes("--apply");
if (!budgetVersionId) {
  console.error("required: --budget-version-id bv-...");
  process.exit(2);
}

async function kintonePutRecords(records) {
  const { baseUrl, headers } = getKintoneReadConfig();
  const res = await fetch(`${baseUrl}/k/v1/records.json`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ app: APP2, records }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

const query = `budget_version_id = "${budgetVersionId}" order by block_no asc, row_sort_order asc limit 500`;
const params = new URLSearchParams({ app: String(APP2), query });
for (const code of [
  "$id",
  "$revision",
  "block_no",
  "row_kind",
  "row_sort_order",
  "stable_block_id",
  "name_1",
  "name_2",
  "name_3",
  "name_spec_group",
]) {
  params.append("fields", code);
}
const { records } = await kintoneGetJson(`/k/v1/records.json?${params}`);

const byBlock = new Map();
for (const rec of records) {
  const sid = rec.stable_block_id?.value || `bno-${rec.block_no?.value}`;
  if (!byBlock.has(sid)) byBlock.set(sid, []);
  byBlock.get(sid).push(rec);
}

const updates = [];
for (const list of byBlock.values()) {
  const shaped = list.map((rec) => ({
    id: rec.$id.value,
    revision: rec.$revision.value,
    row_kind: rec.row_kind?.value,
    name_1: rec.name_1?.value || "",
    name_2: rec.name_2?.value || "",
    name_3: rec.name_3?.value || "",
    name_spec_group: rec.name_spec_group?.value || "",
  }));
  const details = shaped.filter((r) => r.row_kind === "detail");
  const aligned = alignBlockDetailNameColumns(details);
  for (const row of aligned) {
    if (!row.changed) continue;
    updates.push({
      id: row.id,
      revision: row.revision,
      record: {
        name_1: { value: row.name_1 },
        name_2: { value: row.name_2 },
        name_3: { value: row.name_3 },
        name_spec_group: { value: row.name_spec_group },
      },
      preview: `${row.name_1} | ${row.name_2} | ${row.name_3}`,
    });
  }
}

console.log(
  `budget=${budgetVersionId} records=${records.length} updates=${updates.length} apply=${apply}`,
);
for (const u of updates.slice(0, 40)) {
  console.log(`  #${u.id}: ${u.preview}`);
}
if (updates.length > 40) console.log(`  ... +${updates.length - 40} more`);

if (!apply) {
  console.log("dry-run only. Re-run with --apply to PUT.");
  process.exit(0);
}

const chunk = 100;
for (let i = 0; i < updates.length; i += chunk) {
  const slice = updates.slice(i, i + chunk).map(({ id, revision, record }) => ({
    id,
    revision,
    record,
  }));
  await kintonePutRecords(slice);
  console.log(`PUT ${slice.length} rows`);
}
console.log("done");
