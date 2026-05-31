#!/usr/bin/env node
/**
 * セッション締め時の未コミット検査（S2 / 2026-05-30）
 * デフォルト: 未コミットあれば exit 1（締め禁止）。--warn-only で警告のみ exit 0。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const warnOnly = process.argv.includes('--warn-only');

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
  const msg = `[verify:session-close-git-warn] NG 未コミット ${count} 件 — セッション締め前に commit 必須（B1）`;
  if (warnOnly) {
    console.warn(msg.replace(' NG ', ' WARN '));
    console.warn(status.split(/\r?\n/).slice(0, 15).join('\n'));
    if (count > 15) console.warn(`  …他 ${count - 15} 件`);
    process.exit(0);
  }

  console.error(msg);
  console.error(status.split(/\r?\n/).slice(0, 15).join('\n'));
  if (count > 15) console.error(`  …他 ${count - 15} 件`);
  process.exit(1);
}

main();
