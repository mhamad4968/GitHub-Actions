#!/usr/bin/env node
/**
 * App 757 — 10800 内訳の費目/種別を仕様どおりに直す（customize deploy ではない）。
 *
 * 費目: 仮設機械経費
 * 種別: 仮設材･鉄道器材レンタル
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-rewrite-10800-himoku.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-rewrite-10800-himoku.mjs --apply
 */
import "dotenv/config";
import { getKintoneReadConfig, kintoneGetJson } from "./lib/kintone-read-client.mjs";

const APP2 = 757;
const OLD = "鎌ヶ谷資材使用料";
const HIMOKU = "仮設機械経費";
const TYPE = "仮設材･鉄道器材レンタル";
const DITTO = "〃";

function cell(rec, code) {
  const v = rec?.[code]?.value;
  return v == null ? "" : String(v);
}

function planRow(rec) {
  const name1 = cell(rec, "name_1");
  const name2 = cell(rec, "name_2");
  let next1 = name1;
  let next2 = name2;
  if (name1 !== DITTO && name1 === OLD) next1 = HIMOKU;
  if (name2 === OLD) next2 = TYPE;
  if (next1 === HIMOKU && name2 !== DITTO && !next2) next2 = TYPE;
  const changed = next1 !== name1 || next2 !== name2;
  return { changed, next1, next2, name1, name2 };
}

async function fetchQuery(query) {
  const all = [];
  let offset = 0;
  for (;;) {
    const paged = `${query} order by $id asc limit 500 offset ${offset}`;
    const params = new URLSearchParams({ app: String(APP2), query: paged });
    for (const code of [
      "$id",
      "$revision",
      "name_1",
      "name_2",
      "work_type_code",
      "row_kind",
      "stable_block_id",
    ]) {
      params.append("fields", code);
    }
    const { records } = await kintoneGetJson(`/k/v1/records.json?${params}`);
    const page = Array.isArray(records) ? records : [];
    all.push(...page);
    if (page.length < 500) break;
    offset += 500;
  }
  return all;
}

async function fetchAll() {
  const tagged = await fetchQuery(`work_type_code = "10800"`);
  const blockIds = [
    ...new Set(tagged.map((rec) => cell(rec, "stable_block_id")).filter(Boolean)),
  ];
  const byId = new Map();
  for (const rec of tagged) byId.set(rec.$id.value, rec);
  for (let i = 0; i < blockIds.length; i += 50) {
    const chunk = blockIds.slice(i, i + 50);
    const quoted = chunk.map((id) => `"${id.replace(/"/g, "")}"`).join(", ");
    const extra = await fetchQuery(`stable_block_id in (${quoted})`);
    for (const rec of extra) byId.set(rec.$id.value, rec);
  }
  return [...byId.values()].filter((rec) => cell(rec, "row_kind") === "detail");
}

async function putChunk(records) {
  const { baseUrl, headers } = getKintoneReadConfig();
  const res = await fetch(`${baseUrl}/k/v1/records.json`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ app: APP2, records }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json).slice(0, 800));
  return json;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const records = await fetchAll();
  const updates = [];
  for (const rec of records) {
    const plan = planRow(rec);
    if (!plan.changed) continue;
    updates.push({
      id: rec.$id.value,
      revision: rec.$revision.value,
      from: { name_1: plan.name1, name_2: plan.name2 },
      to: { name_1: plan.next1, name_2: plan.next2 },
      record: {
        name_1: { value: plan.next1 },
        name_2: { value: plan.next2 },
      },
    });
  }
  console.log(`[10800] scanned ${records.length} detail rows, updates ${updates.length}`);
  for (const row of updates.slice(0, 20)) {
    console.log(`  #${row.id} ${JSON.stringify(row.from)} → ${JSON.stringify(row.to)}`);
  }
  if (updates.length > 20) console.log(`  … ${updates.length - 20} more`);
  if (!apply) {
    console.log("[10800] dry-run — pass --apply to PUT");
    return;
  }
  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100).map((row) => ({
      id: row.id,
      revision: row.revision,
      record: row.record,
    }));
    await putChunk(chunk);
    console.log(`[10800] PUT ${i + chunk.length}/${updates.length}`);
  }
  console.log("[10800] apply done");
}

main().catch((e) => {
  console.error("[10800] FAIL", e.message);
  process.exit(1);
});
