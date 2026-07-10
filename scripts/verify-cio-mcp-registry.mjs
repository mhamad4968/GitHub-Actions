#!/usr/bin/env node
/**
 * CIO 統合統制 + 自律マルチエージェント向け: Cursor MCP レジストリに **必要サーバ名** が揃うか検査する。
 * - `%USERPROFILE%\.cursor\mcp.json` と **リポ** `.cursor/mcp.json` を読み、**mcpServers キーをマージ**（Cursor と同様の「名前の集合」）。
 * - 値（API キー等）は **一切出力しない**。
 *
 * 終了: 0=必須すべてあり / 2=必須欠落 / 1=推奨のみ欠落（--strict 時は 2）
 *
 * @see docs/mcp-status.md
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** CIO が第2者として呼ぶ系 + 調査・実装・検証の下限セット（名前は Cursor mcp.json のキーに合わせる） */
const REQUIRED_CIO = [
  'deepseek',
  'kimi',
  'openrouter',
  'memory',
  'sequential-thinking',
  'rag',
  'markdownify',
  'kintone',
  'playwright',
  'duckduckgo-search',
];

const RECOMMENDED = [
  'chrome-devtools',
  'shadcn-ui',
  'cve-search',
  'accessibility-scanner',
  'figma',
  'colors-fonts',
  'context7',
  'repo-tree',
  'eslint-mcp',
  'github',
  'kintone-dev',
  'kintone-space',
  'office-powerpoint',
  'office-word',
  'kintone-schema-mcp',
  'git-history-mcp',
];

function loadServers(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const j = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const raw = j.mcpServers || {};
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v && v.disabled === true) continue;
      out[k] = true;
    }
    return out;
  } catch (e) {
    console.warn(`[verify-cio-mcp-registry] WARN parse skip ${filePath}: ${e.message}`);
    return {};
  }
}

function mergeRegistry(paths) {
  const merged = {};
  for (const p of paths) {
    const s = loadServers(p);
    for (const k of Object.keys(s)) merged[k] = true;
  }
  return merged;
}

const strict = process.argv.includes('--strict');
const home = process.env.USERPROFILE || process.env.HOME || '';
const userMcp = home ? path.join(home, '.cursor', 'mcp.json') : '';
const repoMcp = path.join(root, '.cursor', 'mcp.json');

const paths = [userMcp, repoMcp].filter(Boolean);
const names = mergeRegistry(paths);

const presentPaths = paths.filter((p) => fs.existsSync(p));
console.log('[verify-cio-mcp-registry] files:', presentPaths.length ? presentPaths.join(' | ') : '(none)');
console.log('[verify-cio-mcp-registry] merged server count:', Object.keys(names).length);

const missingReq = REQUIRED_CIO.filter((n) => !names[n]);
const missingRec = RECOMMENDED.filter((n) => !names[n]);

if (missingReq.length) {
  console.error('[verify-cio-mcp-registry] NG missing required:', missingReq.join(', '));
  console.error('  → WSL 正本 ~/.cursor/mcp.json を整備し、Windows では npm run mcp:sync-cursor-windows');
  process.exit(2);
}

if (missingRec.length) {
  console.warn('[verify-cio-mcp-registry] WARN missing recommended:', missingRec.join(', '));
  if (strict) process.exit(2);
  process.exit(1);
}

console.log('[verify-cio-mcp-registry] OK (required CIO MCP names present)');

// タスクA — 方式B Composer silent fallback インターロック（ログ横断）
const guardScript = path.join(root, 'scripts', 'cio-composer-silent-fallback-guard.mjs');
if (fs.existsSync(guardScript)) {
  const g = spawnSync(process.execPath, [guardScript], { cwd: root, encoding: 'utf8' });
  if (g.status !== 0) {
    process.stderr.write(g.stderr || g.stdout || '');
    process.exit(1);
  }
  console.log('[verify-cio-mcp-registry] OK (composer silent-fallback interlock)');
}

process.exit(0);
