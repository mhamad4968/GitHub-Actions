#!/usr/bin/env node
/**
 * 2026-08-01 夕反省 GO 針テスト（756 Excel 並び/二重/区分・受入・MCP）
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coalesceReportRel } from "./lib/resolve-archived-report.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, coalesceReportRel(root, rel)), "utf8");
}

for (const rel of [
  "docs/approved-changes/2026-08-01-evening-reflection-hamada-go.md",
  "docs/runbooks/cio-ops-2026-08-01-evening-improvements.md",
  ".cursor/rules/cio-ops-2026-08-01-evening-improvements.mdc",
  "docs/reports/2026-08-01-evening-reflection.md",
]) {
  assert.ok(fs.existsSync(path.join(root, coalesceReportRel(root, rel))), `missing ${rel}`);
}

{
  const go = read("docs/approved-changes/2026-08-01-evening-reflection-hamada-go.md");
  assert.match(go, /すべて承認/);
  assert.match(go, /憲法本文/);
  assert.match(go, /S-DEDUP-01/);
  assert.match(go, /O-756-01/);
  assert.match(go, /M-1/);
}

{
  const rb = read("docs/runbooks/cio-ops-2026-08-01-evening-improvements.md");
  assert.match(rb, /R-EXCEL-PLACE-01/);
  assert.match(rb, /jy2CostMgmtDuplicateCodedBlockIdSet/);
  assert.match(rb, /jy2ResolveCostCategoryFromWorkType/);
  assert.match(rb, /1枠=1 deploy/);
  assert.match(rb, /gh run list/);
  assert.match(rb, /C-EXCEL-01/);
}

{
  const mdc = read(".cursor/rules/cio-ops-2026-08-01-evening-improvements.mdc");
  const fm = mdc.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fm, "mdc frontmatter");
  assert.match(fm[1], /alwaysApply:\s*false/);
  assert.doesNotMatch(fm[1], /alwaysApply:\s*true/);
}

{
  const scope = read("docs/runbooks/evening-reflection-scope.md");
  assert.match(scope, /C-EXCEL-02|756.*§体制|見た目.*§体制/);
}

{
  const spec = read(
    "docs/plans/2026-07-31-756-cost-mgmt-excel-table-structure-spec.md",
  );
  assert.match(spec, /区分もコード表 resolve|ENSURE で施工固定しない/);
  assert.match(spec, /10700.*名称枠|名称枠群.*10800/);
  assert.match(spec, /R-EXCEL-PLACE-01|コード番号順だけで名称枠を押し下げない/);
}

{
  const accept = read(
    "docs/runbooks/jikkou-yosan-v2-chrome-accept-checklist.md",
  );
  assert.match(accept, /O-756-01|#12/);
  assert.match(accept, /同一.*二重|二重なし/);
}

{
  const ui = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(ui, /jy2CostMgmtDuplicateCodedBlockIdSet/);
  assert.match(
    ui,
    /jy2CostMgmtEnsureCodedFrameList[\s\S]*?jy2ResolveCostCategoryFromWorkType/,
  );
  assert.match(ui, /costCategory:\s*expectedCategory/);
}

{
  const phase4d = read("scripts/lib/jikkou-yosan-v2/phase4d-ui.test.mjs");
  assert.match(phase4d, /jy2CostMgmtDuplicateCodedBlockIdSet/);
  assert.match(phase4d, /jy2ResolveCostCategoryFromWorkType/);
}

{
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.scripts["test:evening-improvements-2026-08-01"]);
}

console.log("[test:evening-improvements-2026-08-01] OK");
