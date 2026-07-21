/**
 * Phase6 PRE-LIVE hardening — カスタマイズ deploy planner/orchestrator のオフラインテスト。
 * ネットワーク・資格情報・kintone 呼び出しは一切なし。
 */
import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BUILD_SCRIPT,
  CUSTOMIZE_JS_PATHS,
  DEPLOY_SCRIPT,
  SYNC_SCRIPT,
  assertExecutableCustomizationPlan,
  buildCustomizationDeployPlan,
  evaluateAppReadiness,
} from "./customization-deploy.mjs";
import {
  APP1_NAME,
  APP2_NAME,
  APP3_NAME,
  APP_DEFS,
  APP_ORDER,
  IMPLEMENTATION_GO_ENV,
} from "./kintone.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..", "..");
const ORCHESTRATOR_PATH = path.join(ROOT, "scripts", "jikkou-yosan-v2-deploy-customizations.mjs");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");

function nullState() {
  const apps = {};
  for (const appKey of APP_ORDER) {
    apps[appKey] = {
      name: APP_DEFS[appKey].name,
      appId: null,
      status: "uncreated",
      customizationStatus: "unconfigured",
      updatedAt: null,
      error: null,
    };
  }
  return { apps };
}

function deployedState() {
  const state = nullState();
  state.apps.app1 = { ...state.apps.app1, appId: 801, status: "deployed" };
  state.apps.app2 = { ...state.apps.app2, appId: 802, status: "deployed" };
  state.apps.app3 = { ...state.apps.app3, appId: 803, status: "deployed" };
  return state;
}

function spawnOrchestratorWithoutCredentials(args = [], extraEnv = {}) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toUpperCase().startsWith("KINTONE")) continue;
    if (k === IMPLEMENTATION_GO_ENV) continue;
    env[k] = v;
  }
  Object.assign(env, extraEnv);
  return spawnSync(process.execPath, [ORCHESTRATOR_PATH, ...args], { env, encoding: "utf8" });
}

function spawnOrchestratorWithTestState(state, args = [], extraEnv = {}) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "jikkou-yosan-v2-phase6-"));
  const statePath = path.join(tempDir, "state.json");
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  try {
    return spawnOrchestratorWithoutCredentials(args, {
      NODE_ENV: "test",
      JIKKOU_YOSAN_V2_TEST_STATE_PATH: statePath,
      ...extraEnv,
    });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Fixed customize paths — never 735/736
// ---------------------------------------------------------------------------

test("customize JS paths are exactly the three v2 app bundles and never touch customize/736", () => {
  assert.deepEqual(CUSTOMIZE_JS_PATHS, {
    app1: "customize/jikkou-yosan-v2-app1/desktop.js",
    app2: "customize/jikkou-yosan-v2-app2/desktop.js",
    app3: "customize/jikkou-yosan-v2-app3/desktop.js",
  });
  for (const p of Object.values(CUSTOMIZE_JS_PATHS)) {
    assert.doesNotMatch(p, /735|736/, "customize paths must never reference 735/736");
  }
});

// ---------------------------------------------------------------------------
// Planner: null state refusal, forbidden IDs, command order
// ---------------------------------------------------------------------------

test("null-state plan is NOT executable and lists every blocker", () => {
  const plan = buildCustomizationDeployPlan(nullState());
  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.network, "none");
  assert.equal(plan.executable, false);
  for (const appKey of APP_ORDER) {
    assert.ok(
      plan.blockers.some((b) => b.includes(`${appKey}: appId is null`)),
      `${appKey}: null appId must be a blocker`,
    );
    assert.ok(
      plan.blockers.some((b) => b.includes(`${appKey}: schema status must be "deployed"`)),
      `${appKey}: non-deployed schema must be a blocker`,
    );
  }
});

test("assertExecutableCustomizationPlan refuses null state fail-closed", () => {
  assert.throws(
    () => assertExecutableCustomizationPlan(nullState()),
    /Customization deploy refused \(fail-closed\)/,
  );
});

test("plan refuses partially-deployed state (no partial customization deploy)", () => {
  const state = deployedState();
  state.apps.app2.status = "created";
  const plan = buildCustomizationDeployPlan(state);
  assert.equal(plan.executable, false);
  assert.throws(() => assertExecutableCustomizationPlan(state), /app2: schema status/);
});

test("forbidden 735/736 ids are blockers and assertExecutable throws", () => {
  const state = deployedState();
  state.apps.app3.appId = 736;
  const readiness = evaluateAppReadiness("app3", state.apps.app3);
  assert.equal(readiness.ready, false);
  assert.ok(readiness.blockers.some((b) => /FORBIDDEN/.test(b)));
  assert.throws(() => assertExecutableCustomizationPlan(state), /FORBIDDEN/);

  state.apps.app3.appId = 735;
  assert.throws(() => assertExecutableCustomizationPlan(state), /FORBIDDEN/);
});

test("command order is sync → build App1 → deploy app1 → app2 → app3, stop-on-first-failure semantics", () => {
  const plan = buildCustomizationDeployPlan(deployedState());
  assert.equal(plan.executable, true);
  assert.deepEqual(plan.blockers, []);
  assert.equal(plan.commands.length, 5);
  assert.deepEqual(plan.commands[0].argv, ["node", SYNC_SCRIPT]);
  assert.deepEqual(plan.commands[1].argv, ["node", BUILD_SCRIPT]);
  assert.deepEqual(plan.commands[2].argv, [
    "node",
    DEPLOY_SCRIPT,
    "801",
    "customize/jikkou-yosan-v2-app1/desktop.js",
  ]);
  assert.deepEqual(plan.commands[3].argv, [
    "node",
    DEPLOY_SCRIPT,
    "802",
    "customize/jikkou-yosan-v2-app2/desktop.js",
  ]);
  assert.deepEqual(plan.commands[4].argv, [
    "node",
    DEPLOY_SCRIPT,
    "803",
    "customize/jikkou-yosan-v2-app3/desktop.js",
  ]);
  assert.deepEqual(
    plan.commands.map((c) => c.step),
    [1, 2, 3, 4, 5],
  );
  for (const c of plan.commands) {
    assert.doesNotMatch(c.argv.join(" "), /\b73[56]\b/, "commands must never target 735/736");
  }
});

test("plan states that customization deploy keeps the read-only shell (B) and does not open record writes (C)", () => {
  const plan = buildCustomizationDeployPlan(deployedState());
  assert.match(plan.note, /fail-closed read-only/);
  assert.match(plan.note, /never changes ACL/);
  assert.match(plan.note, /stays NO/);
});

test("plan uses placeholders for unknown ids and is deterministic", () => {
  const plan1 = buildCustomizationDeployPlan(nullState());
  const plan2 = buildCustomizationDeployPlan(nullState());
  assert.deepEqual(plan1, plan2);
  assert.equal(plan1.commands[2].argv[2], "<APP1_ID>");
  assert.equal(plan1.commands[3].argv[2], "<APP2_ID>");
  assert.equal(plan1.commands[4].argv[2], "<APP3_ID>");
});

test("readiness rows expose exact names, paths, and statuses for the dry-run report", () => {
  const plan = buildCustomizationDeployPlan(deployedState());
  assert.deepEqual(
    plan.apps.map((a) => a.name),
    [APP1_NAME, APP2_NAME, APP3_NAME],
  );
  assert.deepEqual(
    plan.apps.map((a) => a.customizeJsPath),
    Object.values(CUSTOMIZE_JS_PATHS),
  );
  for (const a of plan.apps) {
    assert.equal(a.schemaStatus, "deployed");
    assert.equal(a.customizationStatus, "unconfigured", "plan must not claim customization deployed");
    assert.equal(a.ready, true);
  }
});

// ---------------------------------------------------------------------------
// Orchestrator CLI: dry-run default without credentials, strict gates
// ---------------------------------------------------------------------------

test("orchestrator default invocation is dry-run: exit 0 without credentials, no network claim", () => {
  const r1 = spawnOrchestratorWithoutCredentials();
  assert.equal(r1.status, 0, r1.stderr);
  assert.match(r1.stdout, /DRY-RUN/);
  assert.match(r1.stdout, /"network": "none"/);
  for (const p of Object.values(CUSTOMIZE_JS_PATHS)) {
    assert.ok(r1.stdout.includes(p), `dry-run must print ${p}`);
  }
  const r2 = spawnOrchestratorWithoutCredentials(["--dry-run"]);
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(r1.stdout, r2.stdout, "dry-run output must be deterministic");
});

test("orchestrator --execute without implementation GO aborts before credentials/network", () => {
  const r = spawnOrchestratorWithoutCredentials(["--execute"]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1/);
  assert.doesNotMatch(r.stderr, /Missing env var/, "GO gate must fire before credential read");
});

test("orchestrator --execute with GO=1 refuses an isolated null state before credentials/network", () => {
  const r = spawnOrchestratorWithTestState(nullState(), ["--execute"], {
    [IMPLEMENTATION_GO_ENV]: "1",
  });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Customization deploy refused \(fail-closed\)/);
  assert.match(r.stderr, /appId is null/);
  assert.doesNotMatch(r.stderr, /Missing env var/, "state gate must fire before credential read");
});

test("orchestrator rejects combined/unknown flags", () => {
  const bad = spawnOrchestratorWithoutCredentials(["--execute", "--dry-run"]);
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /must not be combined/);
  const unknown = spawnOrchestratorWithoutCredentials(["--apply"]);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown argument/);
});

test("orchestrator code (comments stripped) never references customize/736 or hardcoded paths", () => {
  const source = readFileSync(ORCHESTRATOR_PATH, "utf8");
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s\/\/[^\n]*$/gm, "");
  assert.doesNotMatch(code, /customize\//, "paths must come from customization-deploy.mjs only");
  assert.doesNotMatch(code, /73[56]/, "code must never reference app 735/736");
  assert.match(code, /customization-deploy\.mjs/);
  assert.match(code, /assertImplementationGo\(\)/);
  assert.match(code, /assertExecutableCustomizationPlan\(state\)/);
});

// ---------------------------------------------------------------------------
// package.json wiring
// ---------------------------------------------------------------------------

test("package.json exposes dry-run deploy-customizations plan and phase6 test scripts", () => {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"));
  assert.equal(
    pkg.scripts["jikkou-yosan:v2-deploy-customizations"],
    "node scripts/jikkou-yosan-v2-deploy-customizations.mjs",
  );
  assert.doesNotMatch(
    pkg.scripts["jikkou-yosan:v2-deploy-customizations"],
    /--execute/,
    "package script must stay dry-run only",
  );
  assert.match(
    pkg.scripts["jikkou-yosan:v2-phase6:test"],
    /phase6\.test\.mjs/,
  );
});
