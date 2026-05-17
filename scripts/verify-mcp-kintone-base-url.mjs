#!/usr/bin/env node
/**
 * kintone 系 MCP の KINTONE_BASE_URL 整合検査（秘密は出さない・ホスト名のみ表示）
 *
 * - %USERPROFILE%\.cursor\mcp.json とリポ .cursor/mcp.json を読む
 * - kintone / kintone-space の env.KINTONE_BASE_URL を収集
 * - プレースホルダ（cybozu.com 汎用 LP）・ファイル間不一致を NG
 *
 * 終了: 0=OK / 2=NG
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function hostFromUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return "";
  }
}

function isPlaceholderHost(host) {
  if (!host) return true;
  if (host === "cybozu.com" || host === "www.cybozu.com") return true;
  return false;
}

function loadHosts(filePath) {
  const out = { kintone: "", "kintone-space": "" };
  if (!fs.existsSync(filePath)) return out;
  const j = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const servers = j.mcpServers || {};
  for (const name of Object.keys(out)) {
    const env = servers[name]?.env;
    if (env?.KINTONE_BASE_URL) {
      out[name] = hostFromUrl(env.KINTONE_BASE_URL);
    }
  }
  return out;
}

const home = process.env.USERPROFILE || process.env.HOME || "";
const paths = [
  home ? path.join(home, ".cursor", "mcp.json") : "",
  path.join(root, ".cursor", "mcp.json"),
].filter(Boolean);

const byFile = {};
for (const p of paths) {
  if (!fs.existsSync(p)) continue;
  byFile[p] = loadHosts(p);
}

const envHost = hostFromUrl(process.env.KINTONE_BASE_URL);
const allHosts = new Set();
if (envHost) allHosts.add(`env:${envHost}`);
for (const [file, hosts] of Object.entries(byFile)) {
  for (const [srv, h] of Object.entries(hosts)) {
    if (h) allHosts.add(`${path.basename(file)}:${srv}:${h}`);
  }
}

const uniqueHosts = [
  ...new Set([
    envHost,
    ...Object.values(byFile).flatMap((h) => Object.values(h)),
  ].filter(Boolean)),
];

let fail = 0;

console.log("[verify-mcp-kintone-base-url] unique hosts:", uniqueHosts.join(" | ") || "(none)");

for (const h of uniqueHosts) {
  if (isPlaceholderHost(h)) {
    console.error("[verify-mcp-kintone-base-url] NG placeholder host:", h);
    fail++;
  }
}

if (uniqueHosts.length > 1) {
  console.error(
    "[verify-mcp-kintone-base-url] NG mismatch across sources:",
    uniqueHosts.join(" vs "),
  );
  fail++;
}

if (uniqueHosts.length === 0) {
  console.error("[verify-mcp-kintone-base-url] NG no KINTONE_BASE_URL in mcp.json or env");
  fail++;
}

for (const [file, hosts] of Object.entries(byFile)) {
  const k = hosts.kintone;
  const ks = hosts["kintone-space"];
  if (k && ks && k !== ks) {
    console.error(
      `[verify-mcp-kintone-base-url] NG ${path.basename(file)}: kintone host != kintone-space host`,
    );
    fail++;
  }
}

if (fail) {
  console.error(
    "  → WSL 正本 ~/.cursor/mcp.json を jbis テナントに揃え、npm run mcp:sync-cursor-windows",
  );
  process.exit(2);
}

console.log("[verify-mcp-kintone-base-url] OK");
process.exit(0);
