#!/usr/bin/env node
/**
 * post-commit — checkpoint-latest.md が含まれる commit の **Git** 行を HEAD に同期（R44）
 * amend 後 hash が変わるため、必要なら follow-up commit を 1 回だけ作成。
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
  if (subject && /^chore\(checkpoint\): sync Git line/i.test(subject)) return;

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
