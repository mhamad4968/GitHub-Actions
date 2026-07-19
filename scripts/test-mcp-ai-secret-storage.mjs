#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildWindowsMcp,
  AI_SECRET_FILE,
} from "./sync-cursor-mcp-windows-from-wsl.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const migrationScript = path.join(scriptDir, "migrate-mcp-ai-secrets.mjs");
const verifierScript = path.join(scriptDir, "verify-mcp-ai-secret-storage.mjs");
const syncScript = path.join(
  scriptDir,
  "sync-cursor-mcp-windows-from-wsl.mjs",
);
const fakeValues = Object.freeze({
  MOONSHOT_API_KEY: "FAKE_TEST_MOONSHOT_VALUE",
  DEEPSEEK_API_KEY: "FAKE_TEST_DEEPSEEK_VALUE",
  OPENROUTER_API_KEY: "FAKE_TEST_OPENROUTER_VALUE",
});
const targets = [
  ["kimi", "MOONSHOT_API_KEY"],
  ["deepseek", "DEEPSEEK_API_KEY"],
  ["openrouter", "OPENROUTER_API_KEY"],
];

function fixtureConfig(overrides = {}) {
  const mcpServers = {};
  for (const [server, key] of targets) {
    mcpServers[server] = {
      command: "npx",
      args: ["-y", `obviously-fake-${server}-package`],
      env: {
        [key]: overrides[key] || fakeValues[key],
        KEEP_ME: `${server}-nonsecret`,
      },
    };
  }
  return { mcpServers };
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function run(script, args, env) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
    windowsHide: true,
  });
}

function wsl(args, input) {
  const result = spawnSync("wsl.exe", ["-d", "Ubuntu", "-e", ...args], {
    encoding: "utf8",
    input,
    windowsHide: true,
  });
  assert.equal(result.status, 0, "isolated WSL fixture operation failed");
  return result.stdout;
}

function assertNoValuesInOutput(result) {
  const output = `${result.stdout}${result.stderr}`;
  for (const value of Object.values(fakeValues))
    assert.equal(output.includes(value), false);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-ai-secret-storage-"));
const wslTemp = wsl(["mktemp", "-d", "/tmp/mcp-ai-secret-test.XXXXXX"]).trim();
try {
  const wslJson = path.join(temp, "wsl", "mcp.json");
  const windowsJson = path.join(temp, "windows", "mcp.json");
  const secretFile = `${wslTemp}/ai-secrets.env`;
  fs.mkdirSync(path.dirname(wslJson), { recursive: true });
  fs.mkdirSync(path.dirname(windowsJson), { recursive: true });
  writeJson(wslJson, fixtureConfig());
  writeJson(windowsJson, fixtureConfig());
  const env = {
    MCP_AI_WSL_JSON: wslJson,
    MCP_AI_WINDOWS_JSON: windowsJson,
    MCP_AI_SECRET_FILE_WSL: secretFile,
  };

  const dryRun = run(migrationScript, [], env);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.notEqual(
    spawnSync("wsl.exe", ["-d", "Ubuntu", "-e", "test", "-f", secretFile])
      .status,
    0,
  );
  assertNoValuesInOutput(dryRun);

  const conflictConfig = fixtureConfig({
    DEEPSEEK_API_KEY: "FAKE_TEST_CONFLICT_VALUE",
  });
  writeJson(windowsJson, conflictConfig);
  const conflict = run(migrationScript, ["--dry-run"], env);
  assert.notEqual(conflict.status, 0);
  assert.match(conflict.stderr, /conflict/);
  assert.equal(conflict.stderr.includes("FAKE_TEST_CONFLICT_VALUE"), false);
  assertNoValuesInOutput(conflict);

  writeJson(windowsJson, fixtureConfig());
  const apply = run(migrationScript, ["--apply"], env);
  assert.equal(apply.status, 0, apply.stderr);
  assertNoValuesInOutput(apply);
  assert.match(
    apply.stdout,
    /Provider-side rotation remains a separate authenticated action/,
  );
  assert.equal(wsl(["stat", "-c", "%a", secretFile]).trim(), "600");

  const migratedWsl = JSON.parse(fs.readFileSync(wslJson, "utf8"));
  const migratedWindows = JSON.parse(fs.readFileSync(windowsJson, "utf8"));
  for (const [server, key] of targets) {
    for (const config of [migratedWsl, migratedWindows]) {
      assert.equal(
        Object.hasOwn(config.mcpServers[server].env || {}, key),
        false,
      );
      assert.equal(
        config.mcpServers[server].env.KEEP_ME,
        `${server}-nonsecret`,
      );
      assert.match(
        config.mcpServers[server].args.join(" "),
        new RegExp(`source ${AI_SECRET_FILE}`),
      );
    }
  }
  for (const value of Object.values(fakeValues)) {
    assert.equal(fs.readFileSync(wslJson, "utf8").includes(value), false);
    assert.equal(fs.readFileSync(windowsJson, "utf8").includes(value), false);
  }

  const built = buildWindowsMcp(fixtureConfig().mcpServers);
  for (const [server, key] of targets) {
    assert.equal(Object.hasOwn(built.mcpServers[server].env || {}, key), false);
    assert.equal(built.mcpServers[server].env.KEEP_ME, `${server}-nonsecret`);
    assert.match(
      built.mcpServers[server].args.join(" "),
      new RegExp(`source ${AI_SECRET_FILE}`),
    );
  }

  const verifySuccess = run(verifierScript, [], env);
  assert.equal(verifySuccess.status, 0, verifySuccess.stderr);
  assertNoValuesInOutput(verifySuccess);

  const beforeRerun = {
    wsl: fs.readFileSync(wslJson, "utf8"),
    secret: wsl(["cat", secretFile]),
  };
  const rerun = run(migrationScript, ["--apply"], env);
  assert.equal(rerun.status, 0, rerun.stderr);
  assertNoValuesInOutput(rerun);
  assert.equal(fs.readFileSync(wslJson, "utf8"), beforeRerun.wsl);
  assert.equal(wsl(["cat", secretFile]), beforeRerun.secret);

  const broken = structuredClone(migratedWindows);
  broken.mcpServers.kimi.args = ["-lc", "exec obviously-fake-kimi-package"];
  writeJson(windowsJson, broken);
  const verifyFailure = run(verifierScript, [], env);
  assert.notEqual(verifyFailure.status, 0);
  assert.match(verifyFailure.stderr, /does not source approved file/);
  assertNoValuesInOutput(verifyFailure);

  const rollbackRoot = path.join(temp, "rollback");
  const rollbackWsl = path.join(rollbackRoot, "wsl", "mcp.json");
  const rollbackWindows = path.join(rollbackRoot, "windows", "mcp.json");
  const rollbackSecret = `${wslTemp}/rollback-ai-secrets.env`;
  fs.mkdirSync(path.dirname(rollbackWsl), { recursive: true });
  fs.mkdirSync(path.dirname(rollbackWindows), { recursive: true });
  writeJson(rollbackWsl, fixtureConfig());
  writeJson(rollbackWindows, fixtureConfig());
  const rollbackSecretOriginal = "export UNRELATED_TEST_SETTING='kept'\n";
  wsl(
    [
      "bash",
      "-c",
      'umask 077; cat > "$1"; chmod 640 "$1"',
      "fixture",
      rollbackSecret,
    ],
    rollbackSecretOriginal,
  );
  const rollbackWslOriginal = fs.readFileSync(rollbackWsl, "utf8");
  const rollbackWindowsOriginal = fs.readFileSync(rollbackWindows, "utf8");
  const secretBearingText = JSON.stringify(fakeValues);
  const backupForms = [
    "mcp.json.bak",
    "mcp.json.bak-old",
    "mcp.json.bak.older",
  ];
  for (const dir of [path.dirname(rollbackWsl), path.dirname(rollbackWindows)]) {
    for (const name of backupForms)
      fs.writeFileSync(path.join(dir, name), secretBearingText);
    fs.writeFileSync(path.join(dir, "mcp.json.bak-safe"), "no migrated values");
    fs.writeFileSync(path.join(dir, "mcp.json.backup"), secretBearingText);
  }
  const rollbackEnv = {
    MCP_AI_WSL_JSON: rollbackWsl,
    MCP_AI_WINDOWS_JSON: rollbackWindows,
    MCP_AI_SECRET_FILE_WSL: rollbackSecret,
    MCP_AI_FORCE_SYNC_FAILURE: "1",
  };
  const rollback = run(migrationScript, ["--apply"], rollbackEnv);
  assert.notEqual(rollback.status, 0);
  assert.match(rollback.stderr, /original files restored and backups cleaned/);
  assertNoValuesInOutput(rollback);
  assert.equal(fs.readFileSync(rollbackWsl, "utf8"), rollbackWslOriginal);
  assert.equal(
    fs.readFileSync(rollbackWindows, "utf8"),
    rollbackWindowsOriginal,
  );
  assert.equal(wsl(["cat", rollbackSecret]), rollbackSecretOriginal);
  assert.equal(wsl(["stat", "-c", "%a", rollbackSecret]).trim(), "640");
  for (const dir of [path.dirname(rollbackWsl), path.dirname(rollbackWindows)]) {
    for (const name of backupForms)
      assert.equal(fs.existsSync(path.join(dir, name)), false);
    assert.equal(fs.existsSync(path.join(dir, "mcp.json.bak-safe")), true);
    assert.equal(fs.existsSync(path.join(dir, "mcp.json.backup")), true);
  }

  const missingFixture = path.join(temp, "does-not-exist", "mcp.json");
  const syncFailure = run(syncScript, [], {
    CURSOR_MCP_WSL_JSON: missingFixture,
    CURSOR_MCP_WINDOWS_JSON: windowsJson,
  });
  assert.notEqual(syncFailure.status, 0);
  assert.match(syncFailure.stderr, /\[sync-cursor-mcp-windows\] ERROR:/);
  assertNoValuesInOutput(syncFailure);

  console.log("[test-mcp-ai-secret-storage] OK");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
  wsl(["rm", "-rf", "--", wslTemp]);
}
