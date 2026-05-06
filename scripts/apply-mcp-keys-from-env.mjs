#!/usr/bin/env node
/**
 * temp/mcp_keys.env の KEY=value だけを読み、mcp.json の
 * exa / brave-search / firecrawl / harness の env に反映する（構造は触らない）。
 * **空の値（= の右が空または空白のみ）はスキップ**し、mcp.json の既存値を消さない（誤実行での赤化防止）。
 *
 * 既定ターゲット（--target 省略時）:
 *   1) ~/.cursor/mcp.json（WSL ネイティブ Cursor 等）
 *   2) /mnt/c/Users/mhamada202408224/.cursor/mcp.json（存在すれば＝Windows 側 Cursor）
 *
 * 使い方:
 *   cd ~/kintone-ai-lab && npm run mcp:apply-keys
 *   node scripts/apply-mcp-keys-from-env.mjs --target=/path/to/mcp.json
 *   node scripts/apply-mcp-keys-from-env.mjs --env=C:\\Users\\...\\kintone-ai-lab\\temp\\mcp_keys.env
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const DEFAULT_ENV = path.join(REPO_ROOT, 'temp', 'mcp_keys.env');
const WINDOWS_MCP_FALLBACK = '/mnt/c/Users/mhamada202408224/.cursor/mcp.json';

/** env ファイルのキー名 → [mcpServers のキー, env 内の名前] */
const MAP = {
  EXA_API_KEY: ['exa', 'EXA_API_KEY'],
  BRAVE_API_KEY: ['brave-search', 'BRAVE_API_KEY'],
  FIRECRAWL_API_KEY: ['firecrawl', 'FIRECRAWL_API_KEY'],
  HARNESS_API_KEY: ['harness', 'HARNESS_API_KEY'],
};

function parseArgs() {
  const a = process.argv.slice(2);
  const targets = a.filter((x) => x.startsWith('--target=')).map((x) => x.slice('--target='.length));
  const envArg = a.find((x) => x.startsWith('--env='));
  return {
    envFile: envArg ? envArg.slice('--env='.length) : DEFAULT_ENV,
    targets,
  };
}

function defaultTargets() {
  const list = [path.join(os.homedir(), '.cursor', 'mcp.json')];
  if (fs.existsSync(WINDOWS_MCP_FALLBACK)) {
    const abs = path.resolve(WINDOWS_MCP_FALLBACK);
    const first = path.resolve(list[0]);
    if (abs !== first) list.push(WINDOWS_MCP_FALLBACK);
  }
  return list;
}

function loadEnvFile(fp) {
  if (!fs.existsSync(fp)) {
    throw new Error(`env ファイルがありません: ${fp}\n（temp/mcp_keys.env を作成し、= の右だけ埋めてください）`);
  }
  const out = {};
  for (const line of fs.readFileSync(fp, 'utf8').split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i === -1) continue;
    const k = s.slice(0, i).trim();
    const v = s.slice(i + 1).trim();
    out[k] = v;
  }
  return out;
}

function applyToFile(mcpJson, vars) {
  if (!fs.existsSync(mcpJson)) {
    console.warn(`[mcp:apply-keys] スキップ（ファイルなし）: ${mcpJson}`);
    return;
  }
  const raw = fs.readFileSync(mcpJson, 'utf8');
  const cfg = JSON.parse(raw);
  if (!cfg.mcpServers || typeof cfg.mcpServers !== 'object') {
    throw new Error(`mcp.json: mcpServers が無効です (${mcpJson})`);
  }

  let applied = 0;
  let skippedEmpty = 0;
  for (const [varName, [serverName, envKey]] of Object.entries(MAP)) {
    if (!(varName in vars)) continue;
    const val = vars[varName];
    if (typeof val === 'string' && val.trim() === '') {
      skippedEmpty++;
      console.warn(
        `[mcp:apply-keys] ⏭ ${varName} は空のためスキップ（mcp.json の既存値を消しません）。同期する場合は env の = の右を埋めてから再実行。`,
      );
      continue;
    }
    const srv = cfg.mcpServers[serverName];
    if (!srv) {
      console.warn(`[mcp:apply-keys] スキップ: サーバー "${serverName}" が ${mcpJson} にありません`);
      continue;
    }
    srv.env = srv.env && typeof srv.env === 'object' ? srv.env : {};
    srv.env[envKey] = val;
    applied++;
  }

  if (applied === 0) {
    console.log(`[mcp:apply-keys] ${mcpJson} は変更なし（反映 0 件、ファイルは書き込みません）`);
  } else {
    fs.writeFileSync(mcpJson, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
    console.log(`[mcp:apply-keys] ✅ ${mcpJson} に ${applied} 件の env を反映`);
  }
  if (skippedEmpty > 0) {
    console.warn(
      `[mcp:apply-keys] ${skippedEmpty} 件は env 空のため未反映（推奨: 災害復旧用に mcp.json と同値を temp/mcp_keys.env にコピーしておく）。`,
    );
  }
}

function main() {
  const { envFile, targets } = parseArgs();
  const vars = loadEnvFile(envFile);
  const list = targets.length ? targets : defaultTargets();
  console.log(`[mcp:apply-keys] 元: ${envFile}`);
  for (const mcpJson of list) {
    applyToFile(mcpJson, vars);
  }
}

main();
