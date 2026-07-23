/**
 * #S-NAME-01 — UI の名称候補プール／プロファイルが Excel 正本 JSON と一致するか検証。
 * #R-NAME-01 — 仮シード禁止の機械ゲート。
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(root, "scripts/data/jikkou-yosan-v2-excel-name-lists.json");
const uiPath = path.join(root, "customize/jikkou-yosan-v2-app1/desktop.ui.js");

function extractFrozenArray(source, constName) {
  const re = new RegExp(
    `const ${constName}\\s*=\\s*Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\)`,
  );
  const m = source.match(re);
  if (!m) throw new Error(`${constName} not found in desktop.ui.js`);
  const values = [];
  for (const line of m[1].split("\n")) {
    const qm = line.match(/"([^"]*)"/) || line.match(/'([^']*)'/);
    if (qm) values.push(qm[1]);
  }
  return values;
}

function sameSet(a, b, label) {
  const left = [...new Set(a)].sort();
  const right = [...new Set(b)].sort();
  assert.deepEqual(
    left,
    right,
    `${label}: UI≠Excel\nUI: ${JSON.stringify(left)}\nExcel: ${JSON.stringify(right)}`,
  );
}

const canon = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const ui = fs.readFileSync(uiPath, "utf8");

assert.ok(canon.profiles, "JSON must have profiles");
assert.equal(canon.defaultProfile, "kindLong");

sameSet(
  extractFrozenArray(ui, "JY2_POOL_KIND_CORE8"),
  canon.pools.kindCore8,
  "pool.kindCore8",
);
sameSet(
  extractFrozenArray(ui, "JY2_POOL_KIND_LONG"),
  canon.pools.kindLong,
  "pool.kindLong",
);
sameSet(
  extractFrozenArray(ui, "JY2_POOL_MATERIAL_CATS"),
  canon.pools.materialCats,
  "pool.materialCats",
);
sameSet(
  extractFrozenArray(ui, "JY2_POOL_PAINT_PRODUCTS"),
  canon.pools.paintProducts,
  "pool.paintProducts",
);
sameSet(extractFrozenArray(ui, "JY2_VENDOR_SEEDS"), canon.vendors, "vendors");

// legacy aliases still resolve to pools
assert.match(ui, /const JY2_NAME1_SEEDS = JY2_POOL_KIND_CORE8/);
assert.match(ui, /const JY2_NAME2_SEEDS = JY2_POOL_MATERIAL_CATS/);
assert.match(ui, /const JY2_NAME3_HINTS = JY2_POOL_PAINT_PRODUCTS/);

assert.match(ui, /const JY2_NAME_PROFILES = Object\.freeze/);
assert.match(ui, /function jy2ResolveNameProfile\b/);
assert.match(ui, /function jy2CollectDetailSuggestions\(detailModel, block\)/);
assert.match(ui, /jy2CollectDetailSuggestions\(detailModel, block\)/);

// profile keys present
for (const key of Object.keys(canon.profiles)) {
  assert.match(ui, new RegExp(`"${key}"\\s*:`), `profile ${key} missing in UI`);
}

// #R-NAME-01: レコード内値を name1/name2 候補に混ぜない
assert.match(ui, /name1:\s*\[\.\.\.profile\.name1\]\.sort/);
assert.match(ui, /name2:\s*\[\.\.\.profile\.name2\]\.sort/);
assert.doesNotMatch(
  ui,
  /if \(row\.name1\) name1\.add/,
  "must not pollute name1 candidates from row values (#R-NAME-01)",
);
assert.doesNotMatch(
  ui,
  /if \(row\.name2\) name2\.add/,
  "must not pollute name2 candidates from row values (#R-NAME-01)",
);

// workType code map size
for (const [code, profile] of Object.entries(canon.workTypeCodeToProfile)) {
  assert.match(
    ui,
    new RegExp(`"${code}"\\s*:\\s*"${profile}"`),
    `code map ${code}->${profile}`,
  );
}

console.log(
  "[verify:jikkou-name-lists-excel] OK — UI pools/profiles match Excel JSON",
);
