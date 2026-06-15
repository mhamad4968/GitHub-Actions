#!/usr/bin/env node
/**
 * プロジェクト v1 クローズ登録（checkpoint / handoff は別途更新または --sync-checkpoint）
 *
 * Usage:
 *   npm run cio:project:close -- --project jr-ipad-ledger --show
 *   npm run cio:project:close -- --verify
 *   npm run cio:project:close -- --completion-report docs/reports/....md
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findClosure, loadProjectClosures } from './lib/cio-project-closure.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs() {
  const out = { project: '', show: false, verify: false, completionReport: '', note: '' };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project') out.project = args[++i] || '';
    else if (args[i] === '--show') out.show = true;
    else if (args[i] === '--verify') out.verify = true;
    else if (args[i] === '--completion-report') out.completionReport = args[++i] || '';
    else if (args[i] === '--note') out.note = args[++i] || '';
  }
  return out;
}

function runNpm(script) {
  const r = spawnSync('npm', ['run', script, '--silent'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

function main() {
  const args = parseArgs();

  if (args.verify) {
    const steps = [
      'verify:kintone-project-close-gate',
      'verify:checkpoint-project-closure',
      'verify:github-constitution-gates',
    ];
    const failed = [];
    for (const s of steps) {
      const { ok, out } = runNpm(s);
      if (!ok) {
        failed.push(s);
        console.error(out.split('\n').slice(-8).join('\n'));
      }
    }
    if (failed.length) {
      console.error('[cio:project:close] --verify NG', failed.join(', '));
      process.exit(1);
    }
    console.log('[cio:project:close] --verify OK（CLOSED 前ゲート一括）');
    process.exit(0);
  }

  if (args.show || !args.project) {
    const c = findClosure(root, args.project || 'business-improvement');
    if (!c) {
      console.log('[cio:project:close] 未登録:', args.project || '(default business-improvement)');
      process.exit(0);
    }
    console.log(JSON.stringify(c, null, 2));
    process.exit(0);
  }

  console.error('[cio:project:close] 手動登録は data/cio-project-closures.json を正本として編集してください');
  console.error('  登録後: checkpoint/handoff 更新 → npm run cio:project:close -- --verify');
  process.exit(1);
}

main();
