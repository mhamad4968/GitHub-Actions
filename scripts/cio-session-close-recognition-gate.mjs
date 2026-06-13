#!/usr/bin/env node
/**
 * セッション締め — 完了認識同期ゲート（R19）
 *
 * Usage:
 *   npm run cio:session:close-recognition-gate
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(rel, args = []) {
  const r = spawnSync(process.execPath, [rel, ...args], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(typeof r.status === 'number' ? r.status : 2);
}

function main() {
  console.log('=== cio:session:close-recognition-gate (R19) ===');
  console.log('正本: docs/runbooks/cio-project-closure-governance.md §A\n');

  run('scripts/verify-checkpoint-project-closure.mjs');
  run('scripts/verify-session-close-git-warn.mjs');

  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const closeReport = path.join(root, `chat-sessions/SESSION-CLOSE-REPORT-${ymd}.txt`);
  const hasClose = fs.existsSync(closeReport);
  if (!hasClose) {
    console.warn('[cio:session:close-recognition-gate] WARN: 当日 SESSION-CLOSE-REPORT 無し（プロジェクト完了日でないなら省略可）');
  }

  console.log('\n[cio:session:close-recognition-gate] OK — 続けて desktop:sync-and-verify + commit/push');
  process.exit(0);
}

main();
