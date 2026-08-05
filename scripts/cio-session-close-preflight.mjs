#!/usr/bin/env node
/**
 * S-CLOSE-PREFLIGHT-01 — 締め前に bridge / Rank1 / #D-CLOSE-02 を先に緑化する
 *
 * Usage:
 *   npm run cio:session:close-preflight
 *   node scripts/cio-session-close-preflight.mjs [--skip-export] [--skip-score]
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skipExport = process.argv.includes('--skip-export');
const skipScore = process.argv.includes('--skip-score');

function fail(msg) {
  console.error(`[cio:session:close-preflight] NG ${msg}`);
  console.error(
    '[cio:session:close-preflight] ONEPASS (S-CLOSE-ONEPASS-01): git-heal / 手書き **Git** / PowerShell Set-Content を挟まず、原因1件を直してから本コマンドまたは close-git を再実行',
  );
  process.exit(1);
}

function runNpm(script, args = []) {
  const r = runNpmScriptSync(root, script, args, { stdio: 'inherit' });
  return r.status === 0;
}

function runNode(rel, args = []) {
  const r = spawnSync(process.execPath, [path.join(root, rel), ...args], {
    cwd: root,
    stdio: 'inherit',
  });
  return r.status === 0;
}

console.log('=== cio:session:close-preflight（S-CLOSE-PREFLIGHT-01）===');

if (!skipExport) {
  if (!runNpm('cio:session:export-handoff')) fail('export-handoff');
}
if (!skipScore) {
  if (!runNpm('cio:task:score-handoff')) fail('task:score-handoff');
  // score が bridge と揃うよう再 export（Rank1 更新後）
  if (!skipExport && !runNpm('cio:session:export-handoff')) fail('export-handoff after score');
}

if (!runNode('scripts/verify-session-close-handoff-freshness.mjs')) {
  fail('#D-CLOSE-02 freshness');
}
if (!runNpm('verify:session-handoff-integrity', ['--validate-export'])) {
  fail('handoff --validate-export（Rank1 / checkpoint 乖離）');
}

console.log('[cio:session:close-preflight] OK');
process.exit(0);
