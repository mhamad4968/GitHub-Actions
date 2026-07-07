#!/usr/bin/env node
/**
 * post-commit — checkpoint-latest.md が含まれる commit の **Git** 行を HEAD に amend 同期（R44）
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECKPOINT_REL } from './lib/cio-checkpoint-read.mjs';
import {
  gitShortHead,
  readCheckpointGitHead,
  updateCheckpointGitHead,
} from './lib/cio-checkpoint-git-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  if (process.env.CIO_POST_COMMIT_CHECKPOINT_AMEND === '1') return;

  const files = spawnSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  const paths = (files.stdout || '').split(/\r?\n/).filter(Boolean);
  if (!paths.includes(CHECKPOINT_REL)) return;

  const head = gitShortHead(root);
  const cpHash = readCheckpointGitHead(root);
  if (!head || head === cpHash) return;

  const changed = updateCheckpointGitHead(root, { hash: head, suffix: 'push 済' });
  if (!changed) return;

  spawnSync('git', ['add', CHECKPOINT_REL], { cwd: root, stdio: 'inherit' });
  const amend = spawnSync('git', ['commit', '--amend', '--no-edit'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CIO_POST_COMMIT_CHECKPOINT_AMEND: '1' },
  });
  if (amend.status === 0) {
    console.log(`[cio-checkpoint-git-postcommit-sync] OK Git → \`${gitShortHead(root)}\``);
  }
}

main();
