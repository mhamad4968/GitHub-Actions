#!/usr/bin/env node
/**
 * Kimi MCP が lab wrapper（パス変換 + 実在モデル）で起動しているか。
 * 合格: mcp.json の kimi が mcp-kimi-wsl-path/entry.mjs を含み、
 *       kimi-api-mcp@latest 単独起動ではない。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadJson(p) {
  if (!p || !fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function serializeServer(s) {
  if (!s || typeof s !== "object") return "";
  const parts = [s.command, ...(Array.isArray(s.args) ? s.args : [])];
  return parts.filter(Boolean).join(" ");
}

function check(label, server) {
  if (!server) {
    return { ok: false, detail: `${label}: kimi missing` };
  }
  const blob = serializeServer(server);
  const hasWrapper = blob.includes("mcp-kimi-wsl-path/entry.mjs");
  const hasLegacy =
    /kimi-api-mcp@latest/.test(blob) && !blob.includes("mcp-kimi-wsl-path");
  if (hasLegacy) {
    return {
      ok: false,
      detail: `${label}: still launches kimi-api-mcp@latest (Windows path ENOENT / moonshot-v1-128k)`,
    };
  }
  if (!hasWrapper) {
    return {
      ok: false,
      detail: `${label}: missing scripts/mcp-kimi-wsl-path/entry.mjs`,
    };
  }
  const env = server.env && typeof server.env === "object" ? server.env : {};
  const model = String(env.MOONSHOT_MODEL || "");
  const blobHasModel =
    /MOONSHOT_MODEL=kimi-k2\.6/.test(blob) || model === "kimi-k2.6";
  if (!blobHasModel) {
    return {
      ok: false,
      detail: `${label}: missing MOONSHOT_MODEL=kimi-k2.6`,
    };
  }
  return { ok: true, detail: `${label}: wsl-path wrapper OK + kimi-k2.6` };
}

const home = process.env.USERPROFILE || process.env.HOME || "";
const winMcp = home ? path.join(home, ".cursor", "mcp.json") : "";
const checks = [];

const winJ = loadJson(winMcp);
checks.push(check("Windows mcp.json", winJ?.mcpServers?.kimi));

const syncSrc = fs.readFileSync(
  path.join(repoRoot, "scripts", "sync-cursor-mcp-windows-from-wsl.mjs"),
  "utf8",
);
if (!syncSrc.includes("mcp-kimi-wsl-path/entry.mjs")) {
  checks.push({
    ok: false,
    detail: "sync-cursor-mcp-windows-from-wsl.mjs: missing wrapper path",
  });
} else {
  checks.push({ ok: true, detail: "sync-cursor-mcp-windows-from-wsl.mjs: wrapper pinned" });
}

const wsl = spawnSync(
  "wsl.exe",
  ["-d", "Ubuntu", "-e", "cat", "/home/mhamada202408224/.cursor/mcp.json"],
  { encoding: "utf8" },
);
if (wsl.status === 0 && (wsl.stdout || "").trim()) {
  try {
    const wslJ = JSON.parse(wsl.stdout);
    checks.push(check("WSL mcp.json", wslJ?.mcpServers?.kimi));
  } catch (e) {
    console.warn("[verify:kimi-mcp-wsl-path] WARN WSL parse:", e.message);
  }
} else {
  console.warn("[verify:kimi-mcp-wsl-path] WARN WSL mcp.json unreadable (skip)");
}

let ng = 0;
for (const c of checks) {
  if (c.ok) console.log(`[verify:kimi-mcp-wsl-path] OK ${c.detail}`);
  else {
    console.error(`[verify:kimi-mcp-wsl-path] NG ${c.detail}`);
    ng += 1;
  }
}

if (ng) {
  console.error(
    "  → fix: scripts/mcp-kimi-wsl-path + sync-cursor-mcp-windows-from-wsl.mjs + WSL ~/.cursor/mcp.json",
  );
  process.exit(2);
}
console.log("[verify:kimi-mcp-wsl-path] OK");
process.exit(0);
