#!/usr/bin/env node
/**
 * AI 専用 kintone 資格情報を mcp.json（kintone / kintone-space）へ反映（値はログに出さない）
 *
 * 読み込み元（優先）: temp/kintone_ai_user.env → process.env KINTONE_AI_*
 * 用法: npm run kintone:ai-user:apply-mcp
 * 任意: --sync-dotenv  … リポ .env の KINTONE_USERNAME/PASSWORD も同値に（CEO GO 後）
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = path.join(root, "temp", "kintone_ai_user.env");
const SYNC_DOTENV = process.argv.includes("--sync-dotenv");
const WINDOWS_FALLBACK = "/mnt/c/Users/mhamada202408224/.cursor/mcp.json";

function loadVars() {
  const out = {};
  if (fs.existsSync(ENV_FILE)) {
    for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const i = s.indexOf("=");
      if (i === -1) continue;
      out[s.slice(0, i).trim()] = s.slice(i + 1).trim();
    }
  }
  if (process.env.KINTONE_AI_USERNAME) out.KINTONE_AI_USERNAME = process.env.KINTONE_AI_USERNAME;
  if (process.env.KINTONE_AI_PASSWORD) out.KINTONE_AI_PASSWORD = process.env.KINTONE_AI_PASSWORD;
  return out;
}

function targets() {
  const list = [path.join(os.homedir(), ".cursor", "mcp.json")];
  const repo = path.join(root, ".cursor", "mcp.json");
  if (fs.existsSync(repo)) list.push(repo);
  if (fs.existsSync(WINDOWS_FALLBACK)) {
    const abs = path.resolve(WINDOWS_FALLBACK);
    if (!list.map(path.resolve).includes(abs)) list.push(abs);
  }
  return list;
}

function applyMcp(mcpPath, username, password, baseUrl) {
  if (!fs.existsSync(mcpPath)) {
    console.warn("[apply-kintone-ai] skip (missing):", mcpPath);
    return 0;
  }
  const cfg = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
  const servers = cfg.mcpServers || {};
  let n = 0;
  for (const name of ["kintone", "kintone-space"]) {
    const srv = servers[name];
    if (!srv) continue;
    srv.env = srv.env && typeof srv.env === "object" ? srv.env : {};
    srv.env.KINTONE_USERNAME = username;
    srv.env.KINTONE_PASSWORD = password;
    if (baseUrl) srv.env.KINTONE_BASE_URL = baseUrl;
    n++;
  }
  if (n === 0) {
    console.warn("[apply-kintone-ai] no kintone servers in", mcpPath);
    return 0;
  }
  fs.writeFileSync(mcpPath, `${JSON.stringify(cfg, null, 2)}\n`, "utf8");
  console.log("[apply-kintone-ai] OK", path.basename(mcpPath), `(${n} servers)`);
  return n;
}

function syncDotenv(username, password) {
  const dotenvPath = path.join(root, ".env");
  if (!fs.existsSync(dotenvPath)) {
    console.warn("[apply-kintone-ai] .env not found — skip sync");
    return;
  }
  let text = fs.readFileSync(dotenvPath, "utf8");
  const setLine = (key, val) => {
    const re = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${val}`;
    text = re.test(text) ? text.replace(re, line) : `${text.replace(/\n?$/, "\n")}${line}\n`;
  };
  setLine("KINTONE_USERNAME", username);
  setLine("KINTONE_PASSWORD", password);
  fs.writeFileSync(dotenvPath, text, "utf8");
  console.log("[apply-kintone-ai] OK .env KINTONE_USERNAME/PASSWORD synced");
}

const vars = loadVars();
const username = vars.KINTONE_AI_USERNAME;
const password = vars.KINTONE_AI_PASSWORD;
const baseUrl = (process.env.KINTONE_BASE_URL || "").replace(/\/$/, "");

if (!username || !password) {
  console.error("[apply-kintone-ai] NG: KINTONE_AI_USERNAME/PASSWORD が未設定（temp/kintone_ai_user.env）");
  process.exit(2);
}

let total = 0;
for (const p of targets()) total += applyMcp(p, username, password, baseUrl);
if (total === 0) process.exit(1);

if (SYNC_DOTENV) syncDotenv(username, password);
console.log("[apply-kintone-ai] Cursor を Reload Window してください");
