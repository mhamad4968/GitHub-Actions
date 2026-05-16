#!/usr/bin/env node
/**
 * Cursor ~/.cursor/mcp.json → Claude Desktop %APPDATA%/Claude/claude_desktop_config.json
 * - _meta を除去（Claude 側が未知キーで困るのを避ける）
 * - memory / sequential-thinking / kintone / playwright を WSL+npx に寄せる（Windows 直 npx との差分吸収）
 * - kimi / deepseek / openrouter の bash 行からインライン API キーを削り env のみに寄せる
 */
import fs from "node:fs";
import path from "node:path";

const home = process.env.USERPROFILE || "";
const appData = process.env.APPDATA || "";
const mcpPath = path.join(home, ".cursor", "mcp.json");
const outDir = path.join(appData, "Claude");
const outPath = path.join(outDir, "claude_desktop_config.json");

const j = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
for (const s of Object.values(j.mcpServers)) delete s._meta;

const wsl = "C:\\Windows\\System32\\wsl.exe";
const n24 = "/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin";

function wslBash(lc) {
  return { command: wsl, args: ["-d", "Ubuntu", "-e", "bash", "-lc", lc] };
}

j.mcpServers.memory = wslBash(`export PATH=${n24}:$PATH && exec npx -y @modelcontextprotocol/server-memory`);
j.mcpServers["sequential-thinking"] = wslBash(
  `export PATH=${n24}:$PATH && exec npx -y @modelcontextprotocol/server-sequential-thinking`,
);

const kPrev = j.mcpServers.kintone;
j.mcpServers.kintone = {
  ...wslBash(`export PATH=${n24}:$PATH && exec npx -y @kintone/mcp-server@latest`),
  env: kPrev?.env ? { ...kPrev.env } : undefined,
};

j.mcpServers.playwright = wslBash(`export PATH=${n24}:$PATH && exec npx -y @playwright/mcp@latest`);

for (const name of ["kimi", "deepseek", "openrouter"]) {
  const s = j.mcpServers[name];
  const args = s?.args;
  if (!Array.isArray(args) || args.length < 2) continue;
  const li = args.length - 1;
  if (typeof args[li] !== "string") continue;
  let lc = args[li];
  lc = lc.replace(/MOONSHOT_API_KEY="[^"]*"\s*/g, "");
  lc = lc.replace(/DEEPSEEK_API_KEY="[^"]*"\s*/g, "");
  lc = lc.replace(/OPENROUTER_API_KEY="[^"]*"\s*/g, "");
  args[li] = lc;
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(j, null, 2)}\n`, "utf8");
console.log(`[emit-claude-desktop-config] wrote ${outPath}`);
