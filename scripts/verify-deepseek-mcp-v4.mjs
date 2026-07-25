#!/usr/bin/env node
/**
 * verify-deepseek-mcp-v4.mjs
 * DeepSeek MCP が廃止モデル deepseek-chat 既定の upstream に戻っていないか検査。
 *
 * 検査対象:
 *   - %USERPROFILE%\.cursor\mcp.json の deepseek エントリ
 *   - （任意）WSL ~/.cursor/mcp.json（読めるとき）
 *
 * 合格条件:
 *   - deepseek サーバが存在
 *   - args/command 連結文字列に `mcp-deepseek-v4/entry.mjs` を含む
 *   - `mcp-deepseek@latest` 単独起動を含まない（ラッパ経由なら OK）
 *
 * exit 0=OK / 2=NG
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

function loadJson(p) {
  if (!p || !fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function deepseekBlob(j) {
  return j?.mcpServers?.deepseek || null;
}

function serializeServer(s) {
  if (!s || typeof s !== "object") return "";
  const parts = [s.command, ...(Array.isArray(s.args) ? s.args : [])];
  return parts.filter(Boolean).join(" ");
}

function check(label, server) {
  if (!server) {
    return { ok: false, detail: `${label}: deepseek missing` };
  }
  const blob = serializeServer(server);
  const hasWrapper = blob.includes("mcp-deepseek-v4/entry.mjs");
  const hasLegacy =
    /mcp-deepseek@latest/.test(blob) && !blob.includes("mcp-deepseek-v4");
  if (hasLegacy) {
    return {
      ok: false,
      detail: `${label}: still launches mcp-deepseek@latest (deepseek-chat default)`,
    };
  }
  if (!hasWrapper) {
    return {
      ok: false,
      detail: `${label}: missing scripts/mcp-deepseek-v4/entry.mjs`,
    };
  }
  const env = server.env && typeof server.env === "object" ? server.env : {};
  const thinkingDefault = String(
    env.DEEPSEEK_THINKING_DEFAULT || "",
  ).toLowerCase();
  const blobHasThinkingOff =
    /DEEPSEEK_THINKING_DEFAULT=disabled/.test(blob) ||
    thinkingDefault === "disabled";
  if (!blobHasThinkingOff) {
    return {
      ok: false,
      detail: `${label}: missing DEEPSEEK_THINKING_DEFAULT=disabled (#S-DS-EMPTY-01)`,
    };
  }
  return { ok: true, detail: `${label}: v4 wrapper OK + thinking default off` };
}

const home = process.env.USERPROFILE || process.env.HOME || "";
const winMcp = home ? path.join(home, ".cursor", "mcp.json") : "";
const checks = [];

const winJ = loadJson(winMcp);
checks.push(check("Windows mcp.json", deepseekBlob(winJ)));

const wsl = spawnSync(
  "wsl.exe",
  ["-d", "Ubuntu", "-e", "cat", "/home/mhamada202408224/.cursor/mcp.json"],
  { encoding: "utf8" },
);
if (wsl.status === 0 && (wsl.stdout || "").trim()) {
  try {
    const wslJ = JSON.parse(wsl.stdout);
    checks.push(check("WSL mcp.json", deepseekBlob(wslJ)));
  } catch (e) {
    console.warn("[verify:deepseek-mcp-v4] WARN WSL parse:", e.message);
  }
} else {
  console.warn("[verify:deepseek-mcp-v4] WARN WSL mcp.json unreadable (skip)");
}

let ng = 0;
for (const c of checks) {
  if (c.ok) console.log(`[verify:deepseek-mcp-v4] OK ${c.detail}`);
  else {
    console.error(`[verify:deepseek-mcp-v4] NG ${c.detail}`);
    ng += 1;
  }
}

if (ng) {
  console.error(
    "  → fix: scripts/mcp-deepseek-v4 + sync-cursor-mcp-windows-from-wsl.mjs + WSL ~/.cursor/mcp.json",
  );
  process.exit(2);
}
console.log("[verify:deepseek-mcp-v4] OK");
process.exit(0);
