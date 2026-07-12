#!/usr/bin/env node
/**
 * post-commit — checkpoint-latest.md が含まれる commit の **Git** 行を HEAD に同期（R44）
 * chore(checkpoint) は amend で自己参照まで収束。それ以外は follow-up を 1 回。
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

function amendCheckpointGitLine() {
  for (let i = 0; i < 3; i += 1) {
    const amended = gitShortHead(root);
    if (amended === readCheckpointGitHead(root)) break;
    updateCheckpointGitHead(root, { hash: amended, suffix: 'push 済' });
    spawnSync('git', ['add', CHECKPOINT_REL], { cwd: root, stdio: 'inherit' });
    spawnSync('git', ['commit', '--amend', '--no-edit'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CIO_POST_COMMIT_CHECKPOINT_SYNC: '1' },
    });
  }
}

function main() {
  if (process.env.CIO_POST_COMMIT_CHECKPOINT_SYNC === '1') return;

  const subject = spawnSync('git', ['log', '-1', '--pretty=format:%s'], {
    cwd: root,
    encoding: 'utf8',
  }).stdout?.trim();
  const isCheckpointSyncCommit =
    subject && /^chore\(checkpoint\): (sync Git line|final Git line stamp)/i.test(subject);

  const files = spawnSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  const paths = (files.stdout || '').split(/\r?\n/).filter(Boolean);
  if (!paths.includes(CHECKPOINT_REL)) return;

  const head = gitShortHead(root);
  const cpHash = readCheckpointGitHead(root);
  if (!head || head === cpHash) return;

  updateCheckpointGitHead(root, { hash: head, suffix: 'push 済' });
  spawnSync('git', ['add', CHECKPOINT_REL], { cwd: root, stdio: 'inherit' });

  if (isCheckpointSyncCommit) {
    spawnSync('git', ['commit', '--amend', '--no-edit'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CIO_POST_COMMIT_CHECKPOINT_SYNC: '1' },
    });
    amendCheckpointGitLine();
    console.log(`[cio-checkpoint-git-postcommit-sync] OK amend Git → \`${gitShortHead(root)}\``);
    return;
  }

  const follow = spawnSync(
    'git',
    ['commit', '-m', 'chore(checkpoint): sync Git line after commit'],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CIO_POST_COMMIT_CHECKPOINT_SYNC: '1' },
    },
  );
  if (follow.status === 0) {
    console.log(`[cio-checkpoint-git-postcommit-sync] OK Git → \`${gitShortHead(root)}\``);
  }
}

main();
