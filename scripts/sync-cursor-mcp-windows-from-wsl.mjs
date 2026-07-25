#!/usr/bin/env node
/**
 * WSL 正本 ~/.cursor/mcp.json から、Windows Cursor が読む
 * C:\Users\<user>\.cursor\mcp.json を再生成する（単一ソース運用）。
 *
 * 背景: Windows 側だけ古い／誤生成されると Cursor MCP が赤になる（TSB-028）。
 * 正本は WSL の ~/.cursor/mcp.json とし、Windows は本スクリプトの出力に限定する。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  mergeRepoMcpOverlays,
  readRepoMcpOverlays,
} from "./lib/repo-mcp-overlays.mjs";
import { hiddenOpts } from "./lib/win-hidden-spawn.mjs";
import { pruneMcpJsonBackups } from "./lib/mcp-json-backup-retention.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const wslMcp =
  process.env.CURSOR_MCP_WSL_JSON ||
  path.join(os.homedir(), ".cursor", "mcp.json");
export const AI_SECRET_FILE =
  "/home/mhamada202408224/.config/cursor-mcp/ai-secrets.env";

function resolveWinMcpPath() {
  if (process.env.CURSOR_MCP_WINDOWS_JSON)
    return process.env.CURSOR_MCP_WINDOWS_JSON;
  if (process.platform === "win32" && process.env.USERPROFILE) {
    return path.join(process.env.USERPROFILE, ".cursor", "mcp.json");
  }
  return "/mnt/c/Users/mhamada202408224/.cursor/mcp.json";
}

const winMcp = resolveWinMcpPath();

function escSh(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$");
}

function winPathFromMnt(p) {
  if (typeof p !== "string") return p;
  if (p.startsWith("/mnt/c/")) {
    return `C:\\\\${p.slice(7).replace(/\//g, "\\\\")}`;
  }
  if (p.startsWith("/home/")) {
    const segs = p.split("/").filter(Boolean);
    const user = segs[1] || "mhamada202408224";
    const rest = segs.slice(2).join("\\\\");
    return `C:\\\\Users\\\\${user}\\\\${rest}`;
  }
  return p;
}

const wslExe = "C:\\\\Windows\\\\System32\\\\wsl.exe";

function wslBash(lc) {
  return { command: wslExe, args: ["-d", "Ubuntu", "-e", "bash", "-lc", lc] };
}

function withoutSensitiveEnv(server, sensitiveKey) {
  if (!server?.env || typeof server.env !== "object") return {};
  const env = { ...server.env };
  delete env[sensitiveKey];
  return Object.keys(env).length ? { env } : {};
}

function aiWindowsServer(server, sensitiveKey, packageCommand) {
  return {
    ...wslBash(
      `set -a && source ${AI_SECRET_FILE} && set +a && ` +
        `export PATH=/home/mhamada202408224/.nvm/versions/node/v25.8.2/bin:$PATH && ` +
        `exec ${packageCommand}`,
    ),
    ...withoutSensitiveEnv(server, sensitiveKey),
  };
}

export function buildWindowsMcp(S) {
  const out = { mcpServers: {} };

  out.mcpServers.github = {
    command: "powershell",
    args: [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-WindowStyle",
      "Hidden",
      "-File",
      "C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\mcp-github-wrapper.ps1",
    ],
    ...(S.github?._meta ? { _meta: S.github._meta } : {}),
  };

  out.mcpServers["office-powerpoint"] = {
    command:
      "C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-PowerPoint-MCP-Server\\\\.venv\\\\Scripts\\\\python.exe",
    args: [
      "C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-PowerPoint-MCP-Server\\\\ppt_mcp_server.py",
    ],
    cwd: "C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-PowerPoint-MCP-Server",
    ...(S["office-powerpoint"]?._meta
      ? { _meta: S["office-powerpoint"]._meta }
      : {}),
  };

  out.mcpServers["office-word"] = {
    command:
      "C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-Word-MCP-Server\\\\.venv\\\\Scripts\\\\python.exe",
    args: [
      "C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-Word-MCP-Server\\\\word_mcp_server.py",
    ],
    cwd: "C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-Word-MCP-Server",
    env: {
      PYTHONPATH:
        "C:\\\\Users\\\\mhamada202408224\\\\.cursor\\\\Office-Word-MCP-Server",
      MCP_TRANSPORT: "stdio",
    },
    ...(S["office-word"]?._meta ? { _meta: S["office-word"]._meta } : {}),
  };

  const fsSrv = S.filesystem;
  if (
    fsSrv &&
    typeof fsSrv.command === "string" &&
    Array.isArray(fsSrv.args) &&
    fsSrv.args.length >= 2
  ) {
    const fsArgs = fsSrv.args;
    out.mcpServers.filesystem = {
      command: fsSrv.command,
      args: [
        fsArgs[0],
        fsArgs[1],
        ...fsArgs.slice(2).map((p) => winPathFromMnt(p)),
      ],
    };
  }

  out.mcpServers.memory = { ...S.memory };
  if (S.fetch && typeof S.fetch.command === "string") {
    out.mcpServers.fetch = {
      command: "python",
      args: ["-m", "mcp_server_fetch"],
    };
  }
  out.mcpServers["sequential-thinking"] = { ...S["sequential-thinking"] };
  out.mcpServers.kintone = { ...S.kintone };

  out.mcpServers["kintone-dev"] = {
    command: wslExe,
    args: [
      "-d",
      "Ubuntu",
      "-e",
      "node",
      "/home/mhamada202408224/.cursor/kntn-dev-mcp/mcp-entry.mjs",
    ],
  };

  const ks = S["kintone-space"];
  const kb = ks?.env?.KINTONE_BASE_URL || "";
  const ku = ks?.env?.KINTONE_USERNAME || "";
  const kp = String(ks?.env?.KINTONE_PASSWORD || "");
  const ksp = kp.replace(/'/g, "'\\''");
  out.mcpServers["kintone-space"] = {
    ...wslBash(
      `export KINTONE_BASE_URL="${escSh(kb)}" KINTONE_USERNAME="${escSh(
        ku,
      )}" KINTONE_PASSWORD='${ksp}' && exec node /home/mhamada202408224/.cursor/kintone-space-mcp/index.mjs`,
    ),
    ...(ks?.env ? { env: { ...ks.env } } : {}),
  };

  out.mcpServers.playwright = { ...S.playwright };

  out.mcpServers["cve-search"] = wslBash(
    "cd /home/mhamada202408224/.cursor/cve-search_mcp && exec uv run main.py",
  );

  out.mcpServers.rag = wslBash(
    "export PATH=/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH " +
      "DB_PATH=/home/mhamada202408224/kintone-ai-lab/.rag/lancedb " +
      "CACHE_DIR=/home/mhamada202408224/kintone-ai-lab/.rag/models " +
      "BASE_DIR=/home/mhamada202408224/kintone-ai-lab && exec npx -y mcp-local-rag",
  );

  out.mcpServers["accessibility-scanner"] = wslBash(
    "export PATH=/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH && exec npx -y mcp-accessibility-scanner",
  );

  out.mcpServers["duckduckgo-search"] = wslBash(
    "export DDG_REGION=jp-ja PATH=/home/mhamada202408224/.local/bin:$PATH && exec /home/mhamada202408224/.local/bin/uvx duckduckgo-mcp-server",
  );

  out.mcpServers.kimi = aiWindowsServer(
    S.kimi,
    "MOONSHOT_API_KEY",
    "npx -y kimi-api-mcp@latest",
  );
  // 2026-07-25: upstream mcp-deepseek@latest defaults to deepseek-chat (API 400).
  // Lab wrapper defaults to deepseek-v4-flash — sync で Windows を旧 npx に戻さない。
  // #S-DS-EMPTY-01: DEEPSEEK_THINKING_DEFAULT=disabled（thinking ON + max_tokens≈400 → content空「无响应」）。
  // DEEPSEEK_* は bash -lc 内でも export（WSL へ Windows env が渡らない場合がある）。
  out.mcpServers.deepseek = {
    ...wslBash(
      `set -a && source ${AI_SECRET_FILE} && set +a && ` +
        `export PATH=/home/mhamada202408224/.nvm/versions/node/v25.8.2/bin:$PATH ` +
        `DEEPSEEK_DEFAULT_MODEL=deepseek-v4-flash DEEPSEEK_THINKING_DEFAULT=disabled && ` +
        `exec node /mnt/c/Users/mhamada202408224/kintone-ai-lab/scripts/mcp-deepseek-v4/entry.mjs`,
    ),
    env: {
      PATH: "/home/mhamada202408224/.nvm/versions/node/v25.8.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      DEEPSEEK_DEFAULT_MODEL: "deepseek-v4-flash",
      DEEPSEEK_THINKING_DEFAULT: "disabled",
    },
  };
  out.mcpServers.openrouter = aiWindowsServer(
    S.openrouter,
    "OPENROUTER_API_KEY",
    "npx -y @mcpservers/openrouterai@latest",
  );

  // TSB-029: @iflow-mcp/markdownify-mcp は npx 経由だと preinstall 欠落 tarball で即死しうる。
  // WSL では `npm install -g --ignore-scripts @iflow-mcp/markdownify-mcp@0.0.2` のうえ node 直起動（NVM 替え時はパス更新）。
  out.mcpServers.markdownify = wslBash(
    "exec env -i HOME=/home/mhamada202408224 PATH=/home/mhamada202408224/.local/bin:/usr/bin:/bin UV_PATH=/home/mhamada202408224/.local/bin/uv /home/mhamada202408224/.nvm/versions/node/v24.14.1/bin/node /home/mhamada202408224/.nvm/versions/node/v24.14.1/lib/node_modules/@iflow-mcp/markdownify-mcp/dist/index.js",
  );

  // chrome-devtools-mcp は Node 20+ 必須。Windows 正本は WSL の nvm Node 24 で npx 実行（Linux パスを command に置けない）。
  if (S["chrome-devtools"] && typeof S["chrome-devtools"] === "object") {
    out.mcpServers["chrome-devtools"] = wslBash(
      "export PATH=/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH && exec npx -y chrome-devtools-mcp@latest",
    );
  }
  if (S["shadcn-ui"] && typeof S["shadcn-ui"] === "object") {
    out.mcpServers["shadcn-ui"] = wslBash(
      "export PATH=/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH && exec npx -y @jpisnice/shadcn-ui-mcp-server",
    );
  }

  return out;
}

function loadWslCanonicalMcp() {
  if (process.env.CURSOR_MCP_WSL_JSON) {
    return JSON.parse(fs.readFileSync(process.env.CURSOR_MCP_WSL_JSON, "utf8"));
  }
  if (process.platform === "win32") {
    const r = spawnSync(
      "wsl.exe",
      ["-d", "Ubuntu", "-e", "cat", "/home/mhamada202408224/.cursor/mcp.json"],
      hiddenOpts({ encoding: "utf8" }),
    );
    if (r.status === 0 && (r.stdout || "").trim()) {
      return JSON.parse(r.stdout);
    }
    throw new Error("required WSL canonical mcp.json could not be read");
  }
  if (fs.existsSync(wslMcp)) {
    return JSON.parse(fs.readFileSync(wslMcp, "utf8"));
  }
  return null;
}

function atomicWrite(file, text) {
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, text, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temp, file);
}

export function main() {
  const canonical = loadWslCanonicalMcp();
  if (!canonical) {
    console.error(
      "[sync-cursor-mcp-windows] ERROR: missing WSL canonical ~/.cursor/mcp.json",
    );
    return 1;
  }

  if (!fs.existsSync(path.dirname(winMcp))) {
    console.error(
      "[sync-cursor-mcp-windows] ERROR: Windows .cursor path not mounted:",
      winMcp,
    );
    return 1;
  }

  const built = buildWindowsMcp(canonical.mcpServers || {});
  const overlays = readRepoMcpOverlays(repoRoot);
  mergeRepoMcpOverlays(built, overlays);

  const noBackup = process.env.CURSOR_MCP_NO_BACKUP === "1";
  if (!noBackup) {
    const bak = `${winMcp}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    if (fs.existsSync(winMcp)) {
      fs.copyFileSync(winMcp, bak);
    }
  }

  atomicWrite(winMcp, `${JSON.stringify(built, null, 2)}\n`);
  console.log(
    noBackup
      ? "[sync-cursor-mcp-windows] OK (backup suppressed)"
      : "[sync-cursor-mcp-windows] OK (backup created)",
  );
  if (!noBackup) {
    pruneMcpJsonBackups(path.dirname(winMcp), {
      logPrefix: "[sync-cursor-mcp-windows]",
    });
  }
  return 0;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`[sync-cursor-mcp-windows] ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
