#!/usr/bin/env node
/**
 * pre-commit — governance 触媒時の dry-run 確認（本番 sync は post-commit amend）
 * git-hooks/pre-commit から呼ぶ
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { touchesGovernance } from './lib/cio-governance-touch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const staged = spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: root, encoding: 'utf8' });
  if (staged.status !== 0) process.exit(0);
  if (!touchesGovernance(staged.stdout || '')) process.exit(0);

  console.log('[pre-commit] governance touch — sync:git-history-generations dry-run');
  const sync = spawnSync(process.execPath, [path.join(root, 'scripts/sync-git-history-generations.mjs')], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (sync.status !== 0) {
    console.error('[pre-commit] NG sync:git-history-generations dry-run — commit 中断');
    process.exit(1);
  }
  console.log('[pre-commit] OK generations sync は post-commit で manifest amend 同期');
  process.exit(0);
}

main();
