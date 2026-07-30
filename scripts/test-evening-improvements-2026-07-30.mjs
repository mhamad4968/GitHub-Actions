#!/usr/bin/env node
/**
 * 2026-07-30 夕反省 GO 針テスト（O/C/A・CON-01 Excel・依頼者核質問）
 * Excel 実ファイルの数式実行は対象外（文言・成果物の存在のみ）。
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

for (const rel of [
  "docs/approved-changes/2026-07-30-evening-reflection-hamada-go.md",
  "docs/runbooks/cio-ops-2026-07-30-evening-improvements.md",
  "docs/runbooks/requester-core-questions-template.md",
  ".cursor/rules/cio-ops-2026-07-30-evening-improvements.mdc",
]) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

{
  const scope = read("docs/runbooks/evening-reflection-scope.md");
  assert.match(scope, /#CON-01/);
  assert.match(scope, /Excel/);
  assert.match(scope, /式セル/);
  assert.match(scope, /§体制・運用・憲法/);
}

{
  const rb = read("docs/runbooks/cio-ops-2026-07-30-evening-improvements.md");
  assert.match(rb, /O-1/);
  assert.match(rb, /cio:pre-push-local-parity/);
  assert.match(rb, /SKIP_CIO_LOCAL_PARITY/);
  assert.match(rb, /smoke 全量ではない/);
  assert.match(rb, /C-1/);
  assert.match(rb, /alwaysApply/);
  assert.match(rb, /明示引数/);
}

{
  const tpl = read("docs/runbooks/requester-core-questions-template.md");
  assert.match(tpl, /3〜4/);
  assert.match(tpl, /R-ASK-01/);
}

{
  const mdc = read(".cursor/rules/cio-ops-2026-07-30-evening-improvements.mdc");
  const fm = mdc.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fm, "mdc frontmatter");
  assert.match(fm[1], /alwaysApply:\s*false/);
  assert.doesNotMatch(fm[1], /alwaysApply:\s*true/);
  assert.match(mdc, /#CON-01/);
  assert.match(mdc, /process\.env/);
}

{
  const gates = JSON.parse(read("data/cio-app-quality-gates.json"));
  const scripts = (gates.pushGate?.steps || []).map((s) => s.script);
  assert.ok(
    scripts.includes("cio:pre-push-local-parity"),
    "pushGate must include cio:pre-push-local-parity",
  );
}

{
  const yml = read(".github/workflows/constitution-gates.yml");
  assert.match(yml, /cio-chat-report-selfcheck\.mjs/);
  assert.match(yml, /test-evening-improvements-2026-07-26\.mjs/);
}

{
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.scripts["cio:pre-push-local-parity"]);
  assert.ok(pkg.scripts["test:evening-improvements-2026-07-30"]);
}

{
  const r = spawnSync(
    node,
    [path.join(root, "scripts/verify-ci-rule-integrity.mjs")],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
}

console.log("[test:evening-improvements-2026-07-30] OK");
