#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  fillMissingApprovedAiEnv,
  loadApprovedAiSecrets,
  parseApprovedAiSecretEnv,
} from "./mcp-ai-secret-env.mjs";

const fake = Object.freeze({
  MOONSHOT_API_KEY: "FAKE_MOONSHOT_TEST_VALUE",
  DEEPSEEK_API_KEY: "FAKE_DEEP'SEEK_TEST_VALUE",
  OPENROUTER_API_KEY: "FAKE_OPENROUTER_TEST_VALUE",
});

function quoted(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function fixtureText(values = fake) {
  return [
    "export UNRELATED_TEST_VALUE='ignored'",
    `export MOONSHOT_API_KEY=${quoted(values.MOONSHOT_API_KEY)}`,
    `export DEEPSEEK_API_KEY=${quoted(values.DEEPSEEK_API_KEY)}`,
    `export OPENROUTER_API_KEY=${quoted(values.OPENROUTER_API_KEY)}`,
    "",
  ].join("\n");
}

function assertNoValues(text) {
  for (const value of Object.values(fake)) assert.equal(text.includes(value), false);
}

const parsed = parseApprovedAiSecretEnv(fixtureText());
assert.deepEqual(parsed, fake);
assert.equal(Object.hasOwn(parsed, "UNRELATED_TEST_VALUE"), false);

let windowsReadChecked = false;
assert.deepEqual(
  loadApprovedAiSecrets({
    env: {},
    platform: "win32",
    spawnSyncFn(command, args) {
      assert.equal(command, "wsl.exe");
      assert.deepEqual(args.slice(0, 5), ["-d", "Ubuntu", "-e", "cat", "/home/mhamada202408224/.config/cursor-mcp/ai-secrets.env"]);
      windowsReadChecked = true;
      return { status: 0, stdout: fixtureText() };
    },
  }),
  fake,
);
assert.equal(windowsReadChecked, true);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-ai-secret-env-"));
try {
  const fixture = path.join(temp, "ai-secrets.env");
  fs.writeFileSync(fixture, fixtureText(), "utf8");
  const options = {
    env: { MCP_AI_SECRET_FILE_FIXTURE: fixture },
    platform: "win32",
    spawnSyncFn() {
      throw new Error("fixture override must not invoke WSL");
    },
  };
  assert.deepEqual(loadApprovedAiSecrets(options), fake);

  const explicit = "EXPLICIT_PROCESS_VALUE";
  const targetEnv = { MOONSHOT_API_KEY: explicit };
  assert.equal(fillMissingApprovedAiEnv(targetEnv, options), 2);
  assert.equal(targetEnv.MOONSHOT_API_KEY, explicit);
  assert.equal(targetEnv.DEEPSEEK_API_KEY, fake.DEEPSEEK_API_KEY);
  assert.equal(targetEnv.OPENROUTER_API_KEY, fake.OPENROUTER_API_KEY);

  const missing = path.join(temp, "missing.env");
  assert.throws(
    () =>
      loadApprovedAiSecrets({
        env: { MCP_AI_SECRET_FILE_FIXTURE: missing },
        platform: "win32",
      }),
    (error) => {
      assertNoValues(error.message);
      return true;
    },
  );

  fs.writeFileSync(
    fixture,
    fixtureText().replace(
      `export DEEPSEEK_API_KEY=${quoted(fake.DEEPSEEK_API_KEY)}`,
      `export DEEPSEEK_API_KEY=${fake.DEEPSEEK_API_KEY}`,
    ),
    "utf8",
  );
  assert.throws(
    () => loadApprovedAiSecrets(options),
    (error) => {
      assert.match(error.message, /invalid shell quoting/);
      assertNoValues(error.message);
      return true;
    },
  );

  console.log("[mcp-ai-secret-env.test] OK");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
