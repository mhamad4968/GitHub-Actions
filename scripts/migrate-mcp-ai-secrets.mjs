#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildWindowsMcp } from "./sync-cursor-mcp-windows-from-wsl.mjs";

export const SECRET_FILE =
  "/home/mhamada202408224/.config/cursor-mcp/ai-secrets.env";
export const TARGETS = Object.freeze([
  ["kimi", "MOONSHOT_API_KEY"],
  ["deepseek", "DEEPSEEK_API_KEY"],
  ["openrouter", "OPENROUTER_API_KEY"],
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureWslJson = process.env.MCP_AI_WSL_JSON;
const fixtureSecretFile = process.env.MCP_AI_SECRET_FILE;
const fixtureSecretWsl = process.env.MCP_AI_SECRET_FILE_WSL;
const windowsJson =
  process.env.MCP_AI_WINDOWS_JSON ||
  path.join(process.env.USERPROFILE || os.homedir(), ".cursor", "mcp.json");

function fail(message) {
  throw new Error(message);
}

function runWsl(args, input) {
  const result = spawnSync("wsl.exe", ["-d", "Ubuntu", "-e", ...args], {
    encoding: "utf8",
    input,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) fail("WSL file operation failed");
  return result.stdout;
}

function readWslFile(wslPath) {
  if (fixtureWslJson && wslPath.endsWith("/mcp.json"))
    return fs.readFileSync(fixtureWslJson, "utf8");
  if (fixtureSecretFile && wslPath === SECRET_FILE) {
    return fs.existsSync(fixtureSecretFile)
      ? fs.readFileSync(fixtureSecretFile, "utf8")
      : "";
  }
  if (fixtureSecretWsl && wslPath === SECRET_FILE)
    return runWsl(["cat", fixtureSecretWsl]);
  return runWsl(["cat", wslPath]);
}

function wslFileExists(wslPath) {
  if (fixtureSecretFile && wslPath === SECRET_FILE)
    return fs.existsSync(fixtureSecretFile);
  if (fixtureSecretWsl && wslPath === SECRET_FILE) {
    const result = spawnSync(
      "wsl.exe",
      ["-d", "Ubuntu", "-e", "test", "-f", fixtureSecretWsl],
      { encoding: "utf8", windowsHide: true },
    );
    return result.status === 0;
  }
  if (fixtureWslJson && wslPath.endsWith("/mcp.json"))
    return fs.existsSync(fixtureWslJson);
  const result = spawnSync(
    "wsl.exe",
    ["-d", "Ubuntu", "-e", "test", "-f", wslPath],
    { encoding: "utf8", windowsHide: true },
  );
  return result.status === 0;
}

function wslFileMode(wslPath) {
  if (fixtureSecretFile && wslPath === SECRET_FILE)
    return (fs.statSync(fixtureSecretFile).mode & 0o777).toString(8);
  if (fixtureSecretWsl && wslPath === SECRET_FILE)
    return runWsl(["stat", "-c", "%a", fixtureSecretWsl]).trim();
  if (fixtureWslJson && wslPath.endsWith("/mcp.json"))
    return (fs.statSync(fixtureWslJson).mode & 0o777).toString(8);
  return runWsl(["stat", "-c", "%a", wslPath]).trim();
}

function removeWslFile(wslPath) {
  if (fixtureSecretFile && wslPath === SECRET_FILE) {
    fs.rmSync(fixtureSecretFile, { force: true });
    return;
  }
  if (fixtureSecretWsl && wslPath === SECRET_FILE) {
    runWsl(["rm", "-f", "--", fixtureSecretWsl]);
    return;
  }
  runWsl(["rm", "-f", "--", wslPath]);
}

function atomicLocalWrite(file, content, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, content, { encoding: "utf8", mode });
  fs.chmodSync(temp, mode);
  fs.renameSync(temp, file);
}

function atomicWslWrite(wslPath, content, mode = "600") {
  if (fixtureWslJson && wslPath.endsWith("/mcp.json")) {
    atomicLocalWrite(fixtureWslJson, content, Number.parseInt(mode, 8));
    return;
  }
  if (fixtureSecretFile && wslPath === SECRET_FILE) {
    atomicLocalWrite(fixtureSecretFile, content, Number.parseInt(mode, 8));
    return;
  }
  const targetPath =
    fixtureSecretWsl && wslPath === SECRET_FILE ? fixtureSecretWsl : wslPath;
  runWsl(
    [
      "bash",
      "-c",
      'set -eu; target="$1"; dir="${target%/*}"; mkdir -p "$dir"; ' +
        'umask 077; tmp=$(mktemp "$dir/.ai-secrets.XXXXXX"); ' +
        'cat > "$tmp"; chmod "$2" "$tmp"; mv -f "$tmp" "$target"',
      "migrate-mcp-ai-secrets",
      targetPath,
      mode,
    ],
    content,
  );
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function unquoteShellValue(raw) {
  const value = raw.trim();
  if (!value.startsWith("'") || !value.endsWith("'"))
    fail("Secret file has invalid quoting");
  return value.slice(1, -1).replace(/'\\''/g, "'");
}

function parseSecretFile(text, { requireAll = true } = {}) {
  const values = {};
  for (const [, key] of TARGETS) {
    const line = text
      .split(/\r?\n/)
      .find((candidate) => candidate.startsWith(`export ${key}=`));
    if (!line) {
      if (requireAll) fail(`Secret file is missing ${key}`);
      continue;
    }
    const value = unquoteShellValue(line.slice(`export ${key}=`.length));
    if (!value) fail(`Secret file has an empty ${key}`);
    values[key] = value;
  }
  return values;
}

function extractValues(config, label) {
  const values = {};
  for (const [server, key] of TARGETS) {
    const value = config?.mcpServers?.[server]?.env?.[key];
    if (typeof value !== "string" || value.length === 0) {
      fail(`${label} is missing required ${key}`);
    }
    values[key] = value;
  }
  return values;
}

function mergeSecretFile(existing, values) {
  const targetKeys = new Set(TARGETS.map(([, key]) => key));
  const kept = existing.split(/\r?\n/).filter((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=/);
    return !match || !targetKeys.has(match[1]);
  });
  while (kept.length && kept.at(-1) === "") kept.pop();
  if (kept.length) kept.push("");
  for (const [, key] of TARGETS)
    kept.push(`export ${key}=${shellQuote(values[key])}`);
  return `${kept.join("\n")}\n`;
}

function launcherCommand(server) {
  if (server.command === "bash" && Array.isArray(server.args)) {
    const lcIndex = server.args.indexOf("-lc");
    if (lcIndex >= 0 && typeof server.args[lcIndex + 1] === "string") {
      return {
        existingShell: true,
        index: lcIndex + 1,
        command: server.args[lcIndex + 1],
      };
    }
  }
  if (
    typeof server.command !== "string" ||
    !server.command ||
    !Array.isArray(server.args)
  ) {
    fail("AI server launcher has invalid command or args");
  }
  return {
    existingShell: false,
    command: [server.command, ...server.args].map(shellQuote).join(" "),
  };
}

export function wrapWslLaunchers(config) {
  const result = structuredClone(config);
  const prefix = `set -a && source ${SECRET_FILE} && set +a`;
  for (const [name, key] of TARGETS) {
    const server = result?.mcpServers?.[name];
    if (!server || typeof server !== "object")
      fail(`WSL config is missing ${name} server`);
    if (
      launcherText(server).includes(`source ${SECRET_FILE}`) &&
      !Object.hasOwn(server.env || {}, key)
    ) {
      continue;
    }
    const launch = launcherCommand(server);
    if (launch.existingShell) {
      server.args[launch.index] = `${prefix} && ${launch.command}`;
    } else {
      server.command = "bash";
      server.args = ["-lc", `${prefix} && exec ${launch.command}`];
    }
    if (server.env && typeof server.env === "object") {
      delete server.env[key];
      if (Object.keys(server.env).length === 0) delete server.env;
    }
  }
  return result;
}

function launcherText(server) {
  return [server?.command, ...(Array.isArray(server?.args) ? server.args : [])]
    .filter((part) => typeof part === "string")
    .join(" ");
}

function containsAnyValue(text, values) {
  return Object.values(values).some((value) => value && text.includes(value));
}

function isRecognizedBackup(name) {
  return /^mcp\.json\.bak(?:$|[-.].+)$/.test(name);
}

function pruneLocalBackups(dir, values) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!isRecognizedBackup(name)) continue;
    const file = path.join(dir, name);
    if (
      fs.lstatSync(file).isFile() &&
      containsAnyValue(fs.readFileSync(file, "utf8"), values)
    ) {
      fs.unlinkSync(file);
      count += 1;
    }
  }
  return count;
}

function pruneWslBackups(values) {
  if (fixtureWslJson)
    return pruneLocalBackups(path.dirname(fixtureWslJson), values);
  const dir = "/home/mhamada202408224/.cursor";
  const names = runWsl(["find", dir, "-maxdepth", "1", "-type", "f", "-printf", "%f\n"])
    .split(/\r?\n/)
    .filter((name) => name && isRecognizedBackup(name));
  let count = 0;
  for (const name of names) {
    const file = `${dir}/${name}`;
    const content = runWsl(["cat", file]);
    if (containsAnyValue(content, values)) {
      runWsl(["rm", "--", file]);
      count += 1;
    }
  }
  return count;
}

function invokeWindowsSync() {
  if (fixtureWslJson && process.env.MCP_AI_FORCE_SYNC_FAILURE === "1")
    fail("Windows MCP synchronization failed");
  const env = {
    ...process.env,
    CURSOR_MCP_WINDOWS_JSON: windowsJson,
    CURSOR_MCP_NO_BACKUP: "1",
    ...(fixtureWslJson ? { CURSOR_MCP_WSL_JSON: fixtureWslJson } : {}),
  };
  const result = spawnSync(
    process.execPath,
    [path.join(scriptDir, "sync-cursor-mcp-windows-from-wsl.mjs")],
    {
      encoding: "utf8",
      env,
      windowsHide: true,
    },
  );
  if (result.status !== 0) fail("Windows MCP synchronization failed");
}

function configState(config) {
  const legacy = TARGETS.every(
    ([server, key]) =>
      typeof config?.mcpServers?.[server]?.env?.[key] === "string" &&
      config.mcpServers[server].env[key].length > 0 &&
      !launcherText(config.mcpServers[server]).includes(`source ${SECRET_FILE}`),
  );
  const migrated = TARGETS.every(
    ([server, key]) =>
      !Object.hasOwn(config?.mcpServers?.[server]?.env || {}, key) &&
      launcherText(config?.mcpServers?.[server]).includes(
        `source ${SECRET_FILE}`,
      ) &&
      !new RegExp(`${key}\\s*=`).test(
        launcherText(config?.mcpServers?.[server]),
      ),
  );
  return legacy ? "legacy" : migrated ? "migrated" : "mixed";
}

function validateStaged(config, values, label) {
  const text = JSON.stringify(config);
  for (const [server, key] of TARGETS) {
    if (Object.hasOwn(config?.mcpServers?.[server]?.env || {}, key))
      fail(`${label} staged config contains target env keys`);
    if (!launcherText(config?.mcpServers?.[server]).includes(`source ${SECRET_FILE}`))
      fail(`${label} staged launcher is not approved`);
    if (
      new RegExp(`${key}\\s*=`).test(
        launcherText(config?.mcpServers?.[server]),
      )
    )
      fail(`${label} staged launcher contains a direct secret assignment`);
  }
  if (containsAnyValue(text, values))
    fail(`${label} staged config contains a migrated value`);
}

export function migrate({ apply = false } = {}) {
  const wslPath = "/home/mhamada202408224/.cursor/mcp.json";
  const originalWslText = readWslFile(wslPath);
  const originalWindowsText = fs.readFileSync(windowsJson, "utf8");
  const wslConfig = JSON.parse(originalWslText);
  const winConfig = JSON.parse(originalWindowsText);
  const secretExisted = wslFileExists(SECRET_FILE);
  const originalSecretText = secretExisted ? readWslFile(SECRET_FILE) : "";
  const originalSecretMode = secretExisted ? wslFileMode(SECRET_FILE) : null;
  const originalWslMode = wslFileMode(wslPath);
  const originalWindowsMode = fs.statSync(windowsJson).mode & 0o777;
  const wslState = configState(wslConfig);
  const winState = configState(winConfig);

  let values;
  let stagedSecretText;
  let stagedWslConfig;
  if (wslState === "legacy" && winState === "legacy") {
    values = extractValues(wslConfig, "WSL config");
    const winValues = extractValues(winConfig, "Windows config");
    for (const [, key] of TARGETS) {
      if (values[key] !== winValues[key])
        fail(`Windows and WSL values conflict for ${key}`);
    }
    const existingTargets = parseSecretFile(originalSecretText, {
      requireAll: false,
    });
    const existingCount = Object.keys(existingTargets).length;
    if (existingCount !== 0 && existingCount !== TARGETS.length)
      fail("Mixed secret-file migration state detected");
    for (const [, key] of TARGETS) {
      if (existingTargets[key] && existingTargets[key] !== values[key])
        fail(`Secret file conflicts for ${key}`);
    }
    stagedSecretText = mergeSecretFile(originalSecretText, values);
    stagedWslConfig = wrapWslLaunchers(wslConfig);
  } else if (wslState === "migrated" && winState === "migrated") {
    if (!secretExisted || originalSecretMode !== "600")
      fail("Migrated state requires a mode 0600 secret file");
    values = parseSecretFile(originalSecretText);
    stagedSecretText = originalSecretText;
    stagedWslConfig = structuredClone(wslConfig);
    validateStaged(winConfig, values, "Windows");
  } else {
    fail("Mixed MCP AI secret migration state detected");
  }

  validateStaged(stagedWslConfig, values, "WSL");
  const stagedWindowsConfig = buildWindowsMcp(stagedWslConfig.mcpServers || {});
  validateStaged(stagedWindowsConfig, values, "Windows");
  const stagedWslText = `${JSON.stringify(stagedWslConfig, null, 2)}\n`;

  if (!apply) {
    console.log(
      "[migrate-mcp-ai-secrets] DRY RUN: validation passed; no files changed",
    );
    console.log(
      "[migrate-mcp-ai-secrets] Provider-side rotation remains a separate authenticated action",
    );
    return { applied: false, backupsDeleted: 0 };
  }

  let wroteAny = false;
  let deleted = 0;
  try {
    atomicWslWrite(SECRET_FILE, stagedSecretText, "600");
    wroteAny = true;
    atomicWslWrite(wslPath, stagedWslText, originalWslMode);
    invokeWindowsSync();
    const finalWindows = fs.readFileSync(windowsJson, "utf8");
    const finalWsl = readWslFile(wslPath);
    if (
      containsAnyValue(finalWindows, values) ||
      containsAnyValue(finalWsl, values)
    )
      fail("Post-migration secret-value verification failed");
    validateStaged(JSON.parse(finalWindows), values, "Windows");
    validateStaged(JSON.parse(finalWsl), values, "WSL");
    deleted =
      pruneLocalBackups(path.dirname(windowsJson), values) +
      pruneWslBackups(values);
  } catch {
    const rollbackErrors = [];
    if (wroteAny) {
      try {
        atomicWslWrite(wslPath, originalWslText, originalWslMode);
      } catch {
        rollbackErrors.push("WSL config");
      }
      try {
        atomicLocalWrite(
          windowsJson,
          originalWindowsText,
          originalWindowsMode,
        );
      } catch {
        rollbackErrors.push("Windows config");
      }
      try {
        if (secretExisted)
          atomicWslWrite(
            SECRET_FILE,
            originalSecretText,
            originalSecretMode,
          );
        else removeWslFile(SECRET_FILE);
      } catch {
        rollbackErrors.push("secret file");
      }
    }
    try {
      pruneLocalBackups(path.dirname(windowsJson), values);
      pruneWslBackups(values);
    } catch {
      rollbackErrors.push("backup cleanup");
    }
    if (rollbackErrors.length)
      fail("Migration failed; rollback or cleanup was incomplete");
    fail("Migration failed; original files restored and backups cleaned");
  }
  console.log(
    `[migrate-mcp-ai-secrets] APPLY OK; secret-bearing backups deleted: ${deleted}`,
  );
  console.log(
    "[migrate-mcp-ai-secrets] Provider-side rotation remains a separate authenticated action",
  );
  return { applied: true, backupsDeleted: deleted };
}

function main() {
  const apply = process.argv.includes("--apply");
  const unknown = process.argv
    .slice(2)
    .filter((arg) => arg !== "--apply" && arg !== "--dry-run");
  if (unknown.length) fail("Unknown argument");
  return migrate({ apply });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(`[migrate-mcp-ai-secrets] ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
