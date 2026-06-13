#!/usr/bin/env node
/**
 * Windows cmd/PowerShell 一瞬フラッシュ回避 — 高頻度スクリプトの静的検査
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {{ rel: string, mustInclude: string[], mustNotInclude?: string[] }[]} */
const HOTPATHS = [
  {
    rel: 'scripts/lib/desktop-ai-emergency-sync-precheck.mjs',
    mustInclude: ['win-hidden-spawn', 'runPowerShellSync'],
    mustNotInclude: ["spawnSync(\n    'powershell'"],
  },
  {
    rel: 'scripts/cio-session-close-git.mjs',
    mustInclude: ['win-hidden-spawn', 'runNpmScriptSync'],
    mustNotInclude: ['shell: true'],
  },
  {
    rel: 'scripts/session-bootstrap-verify.mjs',
    mustInclude: ['win-hidden-spawn', 'runNpmScriptSync'],
    mustNotInclude: ['shell: true'],
  },
  {
    rel: 'scripts/cio-after-customize-change.mjs',
    mustInclude: ['win-hidden-spawn', 'runNpmScriptSync'],
    mustNotInclude: ['shell: true'],
  },
  {
    rel: '.cursor/hooks/session-end-autopilot.mjs',
    mustInclude: ['win-hidden-spawn', 'runNpmScriptSync'],
    mustNotInclude: ["execSync('npm run"],
  },
  {
    rel: 'scripts/desktop-sync-and-verify.mjs',
    mustInclude: ['runNpmScriptSync', 'runNodeScriptSync'],
  },
  {
    rel: 'scripts/sync-cursor-mcp-windows-from-wsl.mjs',
    mustInclude: ["'-WindowStyle'", "'Hidden'"],
  },
  {
    rel: 'scripts/lib/win-hidden-spawn.mjs',
    mustInclude: ['runNpmScriptSync', 'windowsHide'],
  },
];

function main() {
  const issues = [];
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const desktop = pkg.scripts?.['desktop:sync-and-verify'] || '';
  if (!desktop.includes('desktop-sync-and-verify.mjs')) {
    issues.push('package.json desktop:sync-and-verify が Node オーケストレータ未使用');
  }

  for (const { rel, mustInclude, mustNotInclude } of HOTPATHS) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      issues.push(`missing: ${rel}`);
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    for (const m of mustInclude) {
      if (!text.includes(m)) issues.push(`${rel} missing: ${m}`);
    }
    for (const bad of mustNotInclude || []) {
      if (text.includes(bad)) issues.push(`${rel} forbidden: ${bad}`);
    }
  }

  if (issues.length) {
    console.error('[verify-win-hidden-spawn-hotpaths] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify-win-hidden-spawn-hotpaths] OK 高頻度パス hidden spawn');
  process.exit(0);
}

main();
