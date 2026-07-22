/**
 * #S-NAME-01 — UI の JY2_NAME* シードが Excel 正本 JSON と一致するか検証。
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

sameSet(extractFrozenArray(ui, "JY2_NAME1_SEEDS"), canon.name1, "name1");
sameSet(extractFrozenArray(ui, "JY2_NAME2_SEEDS"), canon.name2, "name2");
sameSet(extractFrozenArray(ui, "JY2_NAME3_HINTS"), canon.name3Hints, "name3Hints");
sameSet(extractFrozenArray(ui, "JY2_VENDOR_SEEDS"), canon.vendors, "vendors");

// #R-NAME-01: レコード内値を name1/name2 候補に混ぜない
assert.match(ui, /name1:\s*\[\.\.\.JY2_NAME1_SEEDS\]\.sort/);
assert.match(ui, /name2:\s*\[\.\.\.JY2_NAME2_SEEDS\]\.sort/);
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

console.log("[verify:jikkou-name-lists-excel] OK — UI seeds match Excel JSON");
