#!/usr/bin/env node
/**
 * GHA / gates 是正後の handoff 1 行追記（#D-GHA-01）
 *
 *   npm run cio:handoff:gha-fix -- --cause "inventory 68≠66" --fix abc1234 --workflow constitution-gates
 *
 * @see docs/runbooks/gha-fix-handoff-one-liner.md
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendHandoffBlock,
  formatHandoffBlock,
} from './lib/cio-handoff-template.mjs';
import { readCheckpointNextTask } from './lib/cio-checkpoint-read.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : '';
}

function gitHead() {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  return r.status === 0 ? String(r.stdout).trim() : 'unknown';
}

function resolveFix(raw) {
  if (!raw || raw === 'HEAD') return gitHead();
  return raw;
}

function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(
      'Usage: npm run cio:handoff:gha-fix -- --cause "…" --fix <hash|HEAD> [--workflow name] [--dry-run]',
    );
    process.exit(0);
  }

  const cause = arg('cause');
  const fix = resolveFix(arg('fix') || 'HEAD');
  const workflow = arg('workflow') || 'constitution-gates';
  const dryRun = process.argv.includes('--dry-run');

  if (!cause || cause.length < 3) {
    console.error('[cio:handoff:gha-fix] --cause "失敗原因の短語" が必要です');
    process.exit(2);
  }

  const oneLiner = `GHA是正: ${cause} → ${fix} （workflow=${workflow}）`;
  const block = formatHandoffBlock({
    title: 'GHA / gates 是正（#D-GHA-01）',
    summary: oneLiner,
    nextTask: readCheckpointNextTask(root) || '(checkpoint 要更新)',
    gitHash: fix,
    gitMsg: oneLiner,
    goWait: 'なし',
    doNotTouch: '688 / 677–679 / SKYSEA — 触らない',
  });

  if (dryRun) {
    console.log(block);
    process.exit(0);
  }

  appendHandoffBlock(root, block);
  console.log(`[cio:handoff:gha-fix] OK ${oneLiner}`);
  console.log('[cio:handoff:gha-fix] 続けて: npm run cio:session:export-handoff（任意）');
}

main();
