#!/usr/bin/env node
/**
 * 674 deploy 前の短縮ゲート: session clock + preflight stamp + §50-3-8 stamp 有無
 *
 *   npm run cio:deploy-ready:674
 *   npm run cio:deploy-ready:674 -- --note "reason"
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const noteIdx = process.argv.indexOf('--note');
const note =
  noteIdx >= 0 && process.argv[noteIdx + 1]
    ? process.argv[noteIdx + 1]
    : 'deploy-ready:674';

function run(npmArgs) {
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', npmArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

const clockPath = path.join(root, 'chat-sessions', 'SESSION-CLOCK.md');
const clockText = fs.existsSync(clockPath) ? fs.readFileSync(clockPath, 'utf8') : '';
if (/開始:\s*未設定/.test(clockText) || !/開始:\s*\d{4}-\d{2}-\d{2}/.test(clockText)) {
  console.log('[cio:deploy-ready:674] SESSION-CLOCK 未設定 → session:clock:set');
  run(['run', 'session:clock:set']);
} else {
  console.log('[cio:deploy-ready:674] SESSION-CLOCK OK');
}

const stamp5038 = path.join(root, 'logs', 'cio-four-ai-governance', '5038-stamp.json');
if (!fs.existsSync(stamp5038)) {
  console.log('[cio:deploy-ready:674] 5038 stamp なし → guard:5038');
  run(['run', 'cio:guard:5038', '--', '--stamp', '--text', note]);
} else {
  console.log('[cio:deploy-ready:674] 5038 stamp present');
}

run(['run', 'cio:preflight:674', '--', '--note', note]);
console.log('[cio:deploy-ready:674] inventory hub diag (O1・失敗しても止めない)');
{
  const r = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'cio:674:inventory-hub-diag'],
    { cwd: root, stdio: 'inherit', shell: false },
  );
  if (r.status !== 0) {
    console.warn('[cio:deploy-ready:674] inventory-hub-diag exit', r.status, '— 続行可');
  }
}
console.log('[cio:deploy-ready:674] OK — 続けて npm run deploy:674');
