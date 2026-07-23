#!/usr/bin/env node
/**
 * 2026-07-23 夕反省 GO 実装の再発防止テスト（#R-UI / #S-UI / #S-SYNC / #D-CLOSE / #S-HANDOFF）
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

function run(rel, args = []) {
  return spawnSync(node, [path.join(root, rel), ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

// scripts exist
for (const rel of [
  "scripts/verify-jikkou-v2-chrome-css.mjs",
  "scripts/verify-jikkou-v2-ui-spec-same-turn.mjs",
  "scripts/verify-session-close-handoff-freshness.mjs",
  "docs/constitution/jikkou-yosan-v2-ui-chrome-invariants.md",
  "docs/runbooks/jikkou-yosan-v2-chrome-accept-checklist.md",
  "docs/approved-changes/2026-07-23-evening-reflection-hamada-go.md",
]) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

// #S-UI-01/02 live pass
{
  const r = run("scripts/verify-jikkou-v2-chrome-css.mjs");
  assert.equal(r.status, 0, r.stderr || r.stdout);
}

// #S-HANDOFF-01 --help must not write / exit 0
{
  const before = fs.readFileSync(
    path.join(root, "docs/handoff/latest-session-bridge.json"),
    "utf8",
  );
  const r = run("scripts/cio-session-export-handoff.mjs", ["--help"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout || "", /Usage:/);
  const after = fs.readFileSync(
    path.join(root, "docs/handoff/latest-session-bridge.json"),
    "utf8",
  );
  assert.equal(before, after, "--help must not mutate bridge (#S-HANDOFF-01)");
}

// unknown flag must exit non-zero without mutating
{
  const before = fs.readFileSync(
    path.join(root, "docs/handoff/latest-session-bridge.json"),
    "utf8",
  );
  const r = run("scripts/cio-session-export-handoff.mjs", ["--not-a-real-flag"]);
  assert.notEqual(r.status, 0);
  const after = fs.readFileSync(
    path.join(root, "docs/handoff/latest-session-bridge.json"),
    "utf8",
  );
  assert.equal(before, after, "unknown flag must not mutate bridge");
}

// #S-SYNC-01 parsers
{
  const mod = await import("./lib/cio-kintone-apps-portfolio-build.mjs");
  const machine =
    "| 756 | `2026-07-23-ver02-fixed-action-menu` | **90** | `ed56aa92-02a3-4fc4-8969-99d40cdfb0f5` | note |\n";
  assert.equal(
    mod.parsePortfolioMachineFileKey(machine, "756"),
    "ed56aa92-02a3-4fc4-8969-99d40cdfb0f5",
  );
  const detail =
    "| **実行予算** | **756** | `x` | [u](u) **BUILD=`b`** rev **90** / fileKey **`ed56aa92-02a3-4fc4-8969-99d40cdfb0f5`** |\n";
  assert.equal(
    mod.parsePortfolioDetailFileKey(detail, "756"),
    "ed56aa92-02a3-4fc4-8969-99d40cdfb0f5",
  );
}

// wiring: pre-commit + quality gates + workflow
{
  const pre = fs.readFileSync(path.join(root, "git-hooks/pre-commit"), "utf8");
  assert.match(pre, /verify-jikkou-v2-chrome-css/);
  assert.match(pre, /verify-jikkou-v2-ui-spec-same-turn/);
  const gates = JSON.parse(
    fs.readFileSync(path.join(root, "data/cio-app-quality-gates.json"), "utf8"),
  );
  assert.ok(gates.apps["756"], "756 deployGate required");
  assert.ok(
    gates.pushGate.steps.some((s) => s.script === "verify:jikkou-v2-chrome-css"),
  );
  const wf = fs.readFileSync(
    path.join(root, ".github/workflows/constitution-gates.yml"),
    "utf8",
  );
  assert.match(wf, /test-evening-improvements-2026-07-23/);
  const closeWarn = fs.readFileSync(
    path.join(root, "scripts/verify-session-close-git-warn.mjs"),
    "utf8",
  );
  assert.match(closeWarn, /verify-session-close-handoff-freshness/);
  const sync = fs.readFileSync(
    path.join(root, "scripts/verify-kintone-apps-live-build-sync.mjs"),
    "utf8",
  );
  assert.match(sync, /#S-SYNC-01/);
}

console.log("[test:evening-improvements-2026-07-23] OK");
