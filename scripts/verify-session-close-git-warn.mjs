#!/usr/bin/env node
/**
 * セッション締め時の未コミット WARN（S2 / 2026-05-30）
 * exit 0（警告のみ）。--strict で未コミットあれば exit 1。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

function git(args) {
  const res = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return (res.stdout || '').trim();
}

function main() {
  const inside = git(['rev-parse', '--is-inside-work-tree']);
  if (inside !== 'true') {
    console.log('[verify:session-close-git-warn] SKIP（git レポ外）');
    process.exit(0);
  }

  const status = git(['status', '--short']);
  if (!status) {
    console.log('[verify:session-close-git-warn] OK（未コミットなし）');
    process.exit(0);
  }

  const count = status.split(/\r?\n/).filter(Boolean).length;
  console.warn(`[verify:session-close-git-warn] WARN 未コミット ${count} 件 — 区切りで commit + push 推奨（B1）`);
  console.warn(status.split(/\r?\n/).slice(0, 15).join('\n'));
  if (count > 15) console.warn(`  …他 ${count - 15} 件`);

  process.exit(strict ? 1 : 0);
}

main();
