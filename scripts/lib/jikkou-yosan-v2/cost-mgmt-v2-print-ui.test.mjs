import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ui = readFileSync(
  path.join(root, "customize/jikkou-yosan-v2-app1/desktop.ui.js"),
  "utf8",
);

test("cmv2 print uses a dedicated root and does not reuse the summary portal", () => {
  assert.match(ui, /JY2_CMV2_PRINT_ROOT_ID = "jy2-cmv2-print-root"/);
  assert.match(ui, /function jy2Cmv2OpenPrint\(/);
  assert.match(ui, /印刷（金額）/);
  assert.match(ui, /印刷（回数）/);
  assert.match(ui, /size:\$\{pageSize\}/);
  assert.match(ui, /A4 landscape/);
  assert.match(ui, /A4 portrait/);
  assert.match(ui, /jy2-cmv2-printing/);
  assert.doesNotMatch(ui, /function jy2Cmv2OpenPrint[\s\S]{0,800}jy2-print-portal/);
  assert.doesNotMatch(ui, /#jy2-cmv2-print-root[^"]*visibility:hidden/);
  assert.match(ui, /if \(tabId !== "summary"\) return;/);
});
