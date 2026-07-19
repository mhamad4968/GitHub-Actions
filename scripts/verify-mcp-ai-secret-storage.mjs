#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SECRET_FILE, TARGETS } from "./migrate-mcp-ai-secrets.mjs";

function wsl(args) {
  const result = spawnSync("wsl.exe", ["-d", "Ubuntu", "-e", ...args], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error("WSL verification operation failed");
  return result.stdout;
}

function fixtureOrWslFile(envName, wslPath) {
  const fixture = process.env[envName];
  if (fixture) return fs.readFileSync(fixture, "utf8");
  if (envName === "MCP_AI_SECRET_FILE" && process.env.MCP_AI_SECRET_FILE_WSL)
    return wsl(["cat", process.env.MCP_AI_SECRET_FILE_WSL]);
  return wsl(["cat", wslPath]);
}

function secretMode() {
  if (process.env.MCP_AI_SECRET_FILE) {
    return (fs.statSync(process.env.MCP_AI_SECRET_FILE).mode & 0o777).toString(
      8,
    );
  }
  if (process.env.MCP_AI_SECRET_FILE_WSL)
    return wsl([
      "stat",
      "-c",
      "%a",
      process.env.MCP_AI_SECRET_FILE_WSL,
    ]).trim();
  return wsl(["stat", "-c", "%a", SECRET_FILE]).trim();
}

function unquoteShellValue(raw) {
  const value = raw.trim();
  if (!value.startsWith("'") || !value.endsWith("'")) {
    throw new Error("Secret file values must use approved shell quoting");
  }
  return value.slice(1, -1).replace(/'\\''/g, "'");
}

function parseSecrets(text) {
  const values = {};
  for (const [, key] of TARGETS) {
    const line = text
      .split(/\r?\n/)
      .find((candidate) => candidate.startsWith(`export ${key}=`));
    if (!line) throw new Error(`Secret file is missing ${key}`);
    const value = unquoteShellValue(line.slice(`export ${key}=`.length));
    if (!value) throw new Error(`Secret file has an empty ${key}`);
    values[key] = value;
  }
  return values;
}

function launcherText(server) {
  return [server?.command, ...(Array.isArray(server?.args) ? server.args : [])]
    .filter((part) => typeof part === "string")
    .join(" ");
}

function validateConfig(label, text, values) {
  const config = JSON.parse(text);
  for (const [serverName, key] of TARGETS) {
    const server = config?.mcpServers?.[serverName];
    if (!server) throw new Error(`${label} config is missing ${serverName}`);
    if (Object.hasOwn(server.env || {}, key)) {
      throw new Error(`${label} config still has target secret env keys`);
    }
    if (!launcherText(server).includes(`source ${SECRET_FILE}`)) {
      throw new Error(
        `${label} ${serverName} launcher does not source approved file`,
      );
    }
    if (new RegExp(`${key}\\s*=`).test(text)) {
      throw new Error(`${label} config contains a direct secret assignment`);
    }
  }
  for (const value of Object.values(values)) {
    if (text.includes(value))
      throw new Error(`${label} config contains a secret value`);
  }
}

export function verify() {
  const secretText = fixtureOrWslFile("MCP_AI_SECRET_FILE", SECRET_FILE);
  if (secretMode() !== "600") throw new Error("Secret file mode must be 0600");
  const values = parseSecrets(secretText);
  const wslText = fixtureOrWslFile(
    "MCP_AI_WSL_JSON",
    "/home/mhamada202408224/.cursor/mcp.json",
  );
  const windowsPath =
    process.env.MCP_AI_WINDOWS_JSON ||
    path.join(process.env.USERPROFILE || os.homedir(), ".cursor", "mcp.json");
  const windowsText = fs.readFileSync(windowsPath, "utf8");
  validateConfig("WSL", wslText, values);
  validateConfig("Windows", windowsText, values);
  console.log(
    "[verify-mcp-ai-secret-storage] OK: secure storage checks passed",
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    verify();
  } catch (error) {
    console.error(`[verify-mcp-ai-secret-storage] ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
