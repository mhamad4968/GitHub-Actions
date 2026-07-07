#!/usr/bin/env node
/**
 * pre-commit — checkpoint-latest.md ステージ時に **Git** 行を現在 HEAD で stamp（R44 · #S-CHECKPOINT-01）
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECKPOINT_REL } from './lib/cio-checkpoint-read.mjs';
import { gitShortHead, updateCheckpointGitHead } from './lib/cio-checkpoint-git-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const staged = spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: root, encoding: 'utf8' });
  if (staged.status !== 0) process.exit(0);
  const files = (staged.stdout || '').split(/\r?\n/).filter(Boolean);
  if (!files.includes(CHECKPOINT_REL)) {
    process.exit(0);
  }
  const hash = gitShortHead(root);
  if (!hash) process.exit(0);
  const changed = updateCheckpointGitHead(root, { hash, suffix: 'commit 直前 stamp' });
  if (changed) {
    spawnSync('git', ['add', CHECKPOINT_REL], { cwd: root, stdio: 'inherit' });
    console.log(`[cio-checkpoint-git-precommit-stamp] OK Git → \`${hash}\``);
  }
  process.exit(0);
}

main();
