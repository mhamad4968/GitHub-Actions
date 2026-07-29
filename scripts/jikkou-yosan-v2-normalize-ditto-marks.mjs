/**
 * App2 (757) 既存 detail 行の name_1/2/3 を U27 どおり「〃」に正規化する。
 * ブロック内で直前と同値、または空で継承できる継続行を「〃」にする。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-normalize-ditto-marks.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-normalize-ditto-marks.mjs --apply
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-normalize-ditto-marks.mjs --budget-version-id bv-xxx --apply
 */
import {
  DITTO_MARK,
  normalizeContinuedFieldsToDitto,
} from "./lib/jikkou-yosan-v2/detail-block-model.mjs";
import { getKintoneReadConfig, kintoneGetJson } from "./lib/kintone-read-client.mjs";

const APP2 = 757;
const apply = process.argv.includes("--apply");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : "";
}
const budgetVersionId = arg("--budget-version-id");

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

async function fetchAllDetailRecords() {
  const records = [];
  let offset = 0;
  const limit = 500;
  for (;;) {
    const clauses = ['row_kind in ("detail")'];
    if (budgetVersionId) {
      clauses.push(`budget_version_id = "${budgetVersionId}"`);
    }
    const query = `${clauses.join(" and ")} order by budget_version_id asc, block_sort_order asc, row_sort_order asc limit ${limit} offset ${offset}`;
    const params = new URLSearchParams({ app: String(APP2), query });
    for (const code of [
      "$id",
      "$revision",
      "budget_version_id",
      "stable_block_id",
      "block_sort_order",
      "row_sort_order",
      "row_kind",
      "name_1",
      "name_2",
      "name_3",
      "name_spec_group",
    ]) {
      params.append("fields", code);
    }
    const { records: page } = await kintoneGetJson(
      `/k/v1/records.json?${params}`,
    );
    records.push(...(page || []));
    if (!page || page.length < limit) break;
    offset += limit;
  }
  return records;
}

const all = await fetchAllDetailRecords();
const byKey = new Map();
for (const rec of all) {
  const bvid = rec.budget_version_id?.value || "";
  const sid = rec.stable_block_id?.value || "";
  const key = `${bvid}::${sid}`;
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(rec);
}

const updates = [];
let scannedBlocks = 0;
for (const list of byKey.values()) {
  scannedBlocks += 1;
  list.sort(
    (a, b) =>
      Number(a.row_sort_order?.value || 0) - Number(b.row_sort_order?.value || 0),
  );
  const rows = list.map((rec) => ({
    id: rec.$id.value,
    revision: rec.$revision.value,
    name1: rec.name_1?.value || "",
    name2: rec.name_2?.value || "",
    name3: rec.name_3?.value || "",
    nameSpecGroup: rec.name_spec_group?.value || "",
  }));
  const before = rows.map((r) => ({
    name1: r.name1,
    name2: r.name2,
    name3: r.name3,
  }));
  normalizeContinuedFieldsToDitto(rows);
  let group = null;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (row.name1 && row.name1 !== DITTO_MARK) group = row.name1;
    const nextGroup = group || "";
    const changed =
      row.name1 !== before[i].name1 ||
      row.name2 !== before[i].name2 ||
      row.name3 !== before[i].name3 ||
      nextGroup !== (row.nameSpecGroup || "");
    if (!changed) continue;
    updates.push({
      id: row.id,
      revision: row.revision,
      record: {
        name_1: { value: row.name1 || "" },
        name_2: { value: row.name2 || "" },
        name_3: { value: row.name3 || "" },
        name_spec_group: { value: nextGroup },
      },
      preview: {
        before: before[i],
        after: { name1: row.name1, name2: row.name2, name3: row.name3 },
      },
    });
  }
}

console.log(
  `[normalize-ditto] details=${all.length} blocks=${scannedBlocks} updates=${updates.length} mode=${apply ? "APPLY" : "dry-run"}`,
);
for (const u of updates.slice(0, 20)) {
  console.log(
    `  #${u.id}`,
    JSON.stringify(u.preview.before),
    "→",
    JSON.stringify(u.preview.after),
  );
}
if (updates.length > 20) console.log(`  ... +${updates.length - 20} more`);

if (!apply) {
  console.log("[normalize-ditto] dry-run only. Re-run with --apply to PUT.");
  process.exit(0);
}

const chunkSize = 100;
for (let i = 0; i < updates.length; i += chunkSize) {
  const chunk = updates.slice(i, i + chunkSize).map(({ id, revision, record }) => ({
    id,
    revision,
    record,
  }));
  await kintonePutRecords(chunk);
  console.log(`[normalize-ditto] PUT ${i + chunk.length}/${updates.length}`);
}
console.log("[normalize-ditto] DONE");
