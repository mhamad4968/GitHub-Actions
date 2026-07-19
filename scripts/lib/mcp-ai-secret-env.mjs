import fs from "node:fs";
import { spawnSync } from "node:child_process";

export const AI_SECRET_FILE =
  "/home/mhamada202408224/.config/cursor-mcp/ai-secrets.env";

export const APPROVED_AI_ENV_KEYS = Object.freeze([
  "MOONSHOT_API_KEY",
  "DEEPSEEK_API_KEY",
  "OPENROUTER_API_KEY",
]);

function fail(message) {
  throw new Error(message);
}

function unquoteGeneratedShellValue(raw) {
  const value = raw.trim();
  if (value.length < 2 || value[0] !== "'" || value.at(-1) !== "'") {
    fail("AI secret file has invalid shell quoting");
  }
  const body = value.slice(1, -1);
  let result = "";
  for (let index = 0; index < body.length; ) {
    if (body[index] !== "'") {
      result += body[index];
      index += 1;
      continue;
    }
    if (body.startsWith("'\\''", index)) {
      result += "'";
      index += 4;
      continue;
    }
    fail("AI secret file has invalid shell quoting");
  }
  if (!result) fail("AI secret file has an empty approved value");
  return result;
}

export function parseApprovedAiSecretEnv(text) {
  if (typeof text !== "string") fail("AI secret file content is invalid");
  const approved = new Set(APPROVED_AI_ENV_KEYS);
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^export ([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      const mentionsApproved = APPROVED_AI_ENV_KEYS.some((key) =>
        new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`).test(line),
      );
      if (mentionsApproved) fail("AI secret file has invalid export syntax");
      continue;
    }
    const [, key, raw] = match;
    if (!approved.has(key)) continue;
    if (Object.hasOwn(values, key)) fail(`AI secret file has duplicate ${key}`);
    values[key] = unquoteGeneratedShellValue(raw);
  }
  for (const key of APPROVED_AI_ENV_KEYS) {
    if (!Object.hasOwn(values, key)) fail(`AI secret file is missing ${key}`);
  }
  return values;
}

function readApprovedAiSecretFile({
  env = process.env,
  platform = process.platform,
  readFileSync = fs.readFileSync,
  spawnSyncFn = spawnSync,
} = {}) {
  const fixture = env.MCP_AI_SECRET_FILE_FIXTURE;
  if (fixture) return readFileSync(fixture, "utf8");
  if (platform !== "win32") return readFileSync(AI_SECRET_FILE, "utf8");
  const result = spawnSyncFn(
    "wsl.exe",
    ["-d", "Ubuntu", "-e", "cat", AI_SECRET_FILE],
    {
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.status !== 0 || typeof result.stdout !== "string") {
    fail("Approved AI secret file is unavailable");
  }
  return result.stdout;
}

export function loadApprovedAiSecrets(options = {}) {
  return parseApprovedAiSecretEnv(readApprovedAiSecretFile(options));
}

export function fillMissingApprovedAiEnv(targetEnv = process.env, options = {}) {
  const missing = APPROVED_AI_ENV_KEYS.filter((key) => !targetEnv[key]);
  if (missing.length === 0) return 0;
  const values = loadApprovedAiSecrets(options);
  let filled = 0;
  for (const key of missing) {
    targetEnv[key] = values[key];
    filled += 1;
  }
  return filled;
}
