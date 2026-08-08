#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(repoRoot, "scripts", "cio-task-score-spec.mjs");
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cio-task-score-"));
const specPath = path.join(
  fixtureRoot,
  "templates",
  "yojitsu-budget-lite",
  "SPEC.md",
);
const backlogPath = path.join(
  fixtureRoot,
  "templates",
  "yojitsu-budget-lite",
  "docs",
  "yojitsu-feature-backlog.md",
);
const checkpointPath = path.join(
  fixtureRoot,
  "chat-sessions",
  "checkpoint-latest.md",
);
const scoresPath = path.join(
  fixtureRoot,
  "docs",
  "handoff",
  "spec-task-scores.json",
);
const checkpointTopTask = "fixture checkpoint task";
const specFixture = Buffer.from(
  [
    "# Fixture SPEC",
    "",
    "- [ ] verify fixture task",
    "",
    "<!-- CIO-TASK-PRIORITY:AUTO:BEGIN -->",
    "existing priority table",
    "<!-- CIO-TASK-PRIORITY:AUTO:END -->",
    "",
  ].join("\n"),
);
const initialScores = Buffer.from('{"fixture":"unchanged-until-write"}\n');

fs.mkdirSync(path.dirname(specPath), { recursive: true });
fs.mkdirSync(path.dirname(backlogPath), { recursive: true });
fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
fs.mkdirSync(path.dirname(scoresPath), { recursive: true });
fs.writeFileSync(specPath, specFixture);
fs.writeFileSync(
  backlogPath,
  "| ID | Summary | Owner | Status |\n| B-1 | fixture backlog task | AI | pending |\n",
);
fs.writeFileSync(checkpointPath, `# Fixture checkpoint\n**次の1手**: ${checkpointTopTask}\n`);
fs.writeFileSync(scoresPath, initialScores);

function run(args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: fixtureRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CIO_TASK_SCORE_ROOT: fixtureRoot,
    },
  });
  assert.equal(
    result.status,
    0,
    `score command failed (${args.join(" ")}):\n${result.stdout}\n${result.stderr}`,
  );
  return result;
}

try {
  const handoffResult = run(["--handoff-only"]);
  assert.match(handoffResult.stdout, /output mode:\s+handoff-only/);
  assert.deepEqual(
    fs.readFileSync(specPath),
    specFixture,
    "--handoff-only must leave SPEC byte-identical",
  );

  const writtenScores = fs.readFileSync(scoresPath);
  const payload = JSON.parse(writtenScores.toString("utf8"));
  assert.equal(payload.topTask, checkpointTopTask);
  assert.equal(payload.tasks[0].kind, "work");
  assert.ok(
    Array.isArray(payload.tasks) && payload.tasks.length > 0,
    "tasks must be non-empty",
  );
  assert.equal(payload.tasks[0].source, "checkpoint");
  assert.equal(payload.tasks[0].text, checkpointTopTask);

  // constraint tagging smoke
  fs.writeFileSync(
    checkpointPath,
    "# Fixture checkpoint\n**次の1手**: SKYSEA配信はしない。触らない。\n",
  );
  const constraintRun = run(["--handoff-only"]);
  const constraintPayload = JSON.parse(fs.readFileSync(scoresPath, "utf8"));
  assert.equal(constraintPayload.topTaskKind, "constraint");
  assert.match(constraintRun.stdout, /topWork:/);

  const specBeforeDryRun = fs.readFileSync(specPath);
  const scoresBeforeDryRun = fs.readFileSync(scoresPath);
  const dryRunResult = run(["--dry-run"]);
  assert.match(dryRunResult.stdout, /output mode:\s+normal\s+\(dry-run\)/);
  assert.deepEqual(
    fs.readFileSync(specPath),
    specBeforeDryRun,
    "normal --dry-run must not modify SPEC",
  );
  assert.deepEqual(
    fs.readFileSync(scoresPath),
    scoresBeforeDryRun,
    "normal --dry-run must not modify score JSON",
  );

  console.log("[test-cio-task-score-handoff-only] OK");
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
