#!/usr/bin/env node
/**
 * post-commit — checkpoint-latest.md が含まれる commit の **Git** 行同期（R44）
 *
 * #S-POSTCOMMIT-ORPHAN-01 (2026-07-14):
 *   chore(checkpoint): sync / final stamp 系は **amend 禁止**（off-by-one = tip^1 を維持）。
 *   それ以外で checkpoint を触った場合のみ、SKIP=1 の follow-up 1 回で sync。
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

  // R44: checkpoint sync tip は Git=親 が正。amend すると orphan stamp / NF push の温床。
  if (isCheckpointSyncCommit) {
    console.log(
      '[cio-checkpoint-git-postcommit-sync] R44 SKIP — checkpoint sync commit は amend 禁止（#S-POSTCOMMIT-ORPHAN-01）',
    );
    return;
  }

  const head = gitShortHead(root);
  const cpHash = readCheckpointGitHead(root);
  if (!head || head === cpHash) return;

  updateCheckpointGitHead(root, { hash: head, suffix: 'push 済' });
  spawnSync('git', ['add', CHECKPOINT_REL], { cwd: root, stdio: 'inherit' });

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
    console.log(`[cio-checkpoint-git-postcommit-sync] OK follow-up Git → \`${gitShortHead(root)}\` (R44 tip^1)`);
  }
}

main();
