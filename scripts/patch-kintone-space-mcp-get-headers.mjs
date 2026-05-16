#!/usr/bin/env node
/**
 * Cybozu GET /k/v1/*.json は Content-Type: application/json があると CB_IL02 になりうる。
 * WSL 上の ~/.cursor/kintone-space-mcp/index.mjs の kintoneApi を修正する（バックアップ付き）。
 */
import fs from "node:fs";
import path from "node:path";

const home = process.env.HOME || process.env.USERPROFILE || "";
const target = path.join(
  home,
  ".cursor",
  "kintone-space-mcp",
  "index.mjs",
);

if (!fs.existsSync(target)) {
  console.error(`[patch-kintone-space-mcp] skip: not found ${target}`);
  process.exit(0);
}

let s = fs.readFileSync(target, "utf8");
const from = `  const opts = {
    method,
    headers: {
      "X-Cybozu-Authorization": Buffer.from(\`\${USER}:\${PASS}\`).toString("base64"),
      "Content-Type": "application/json",
    },
  };`;
const to = `  const opts = {
    method,
    headers: {
      "X-Cybozu-Authorization": Buffer.from(\`\${USER}:\${PASS}\`).toString("base64"),
      ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
    },
  };`;

if (!s.includes(from)) {
  if (s.includes('...(method === "GET"')) {
    console.log("[patch-kintone-space-mcp] already patched");
    process.exit(0);
  }
  console.error("[patch-kintone-space-mcp] pattern not found; manual check needed");
  process.exit(1);
}

const bak = `${target}.bak-${new Date().toISOString().slice(0, 10)}`;
fs.copyFileSync(target, bak);
s = s.replace(from, to);
fs.writeFileSync(target, s, "utf8");
console.log(`[patch-kintone-space-mcp] OK → ${target} (backup ${bak})`);
