#!/usr/bin/env node
/**
 * checkpoint-latest が archive 参照コメントを含むとき、ファイルが git 追跡されているか
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKPOINT = path.join(root, 'chat-sessions/checkpoint-latest.md');

function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return (r.stdout || '').trim();
}

function main() {
  if (!fs.existsSync(CHECKPOINT)) {
    console.log('[verify:checkpoint-archive-tracked] SKIP checkpoint 無し');
    process.exit(0);
  }
  const text = fs.readFileSync(CHECKPOINT, 'utf8');
  const refs = [...text.matchAll(/checkpoint-archive-(\d{4}-\d{2}-\d{2})\.md/g)].map((m) => m[0]);
  const unique = [...new Set(refs)];
  if (!unique.length) {
    console.log('[verify:checkpoint-archive-tracked] OK（archive 参照なし）');
    process.exit(0);
  }

  const issues = [];
  for (const name of unique) {
    const rel = `chat-sessions/checkpoints/${name}`;
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      issues.push(`参照 ${name} だが ${rel} が存在しない`);
      continue;
    }
    const tracked = git(['ls-files', '--error-unmatch', rel]);
    if (tracked.includes('fatal') || !tracked) {
      issues.push(`${rel} は未追跡 — git add 必須`);
    }
  }

  if (issues.length) {
    console.error(`[verify:checkpoint-archive-tracked] NG ${issues.length} 件`);
    for (const i of issues) console.error(`  - ${i}`);
    process.exit(1);
  }
  console.log(`[verify:checkpoint-archive-tracked] OK refs=${unique.length}`);
  process.exit(0);
}

main();
