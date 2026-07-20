#!/usr/bin/env node
/**
 * post-commit — checkpoint **Git** 行の先祖返り自動 heal（R44 / #S-CHKPT-PARENT-01）
 *
 * 発火: checkCheckpointGitRegression が NG のときのみ
 *   （handoff のみ commit で tip が2世代以上進んだケースを含む）
 *
 * 抑止:
 *   - CIO_POST_COMMIT_CHECKPOINT_SYNC=1（follow-up 自身）
 *   - subject が chore(checkpoint): sync/final stamp → amend 禁止
 *   - 回帰なし（exact / tip^1 off-by-one）→ no-op
 *
 * follow-up は checkpoint を含め SKIP=1 で 1 回のみ。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECKPOINT_REL } from './lib/cio-checkpoint-read.mjs';
import {
  checkCheckpointGitRegression,
  healCheckpointGitWorktree,
  readCheckpointGitHead,
} from './lib/cio-checkpoint-git-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(args, opts = {}) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8', ...opts });
}

function main() {
  if (process.env.CIO_POST_COMMIT_CHECKPOINT_SYNC === '1') return;

  const subject = git(['log', '-1', '--pretty=format:%s']).stdout?.trim() || '';
  if (/^chore\(checkpoint\): (sync Git line|final Git line stamp)/i.test(subject)) {
    console.log(
      '[cio-checkpoint-git-postcommit-sync] R44 SKIP — checkpoint sync commit は amend 禁止（#S-POSTCOMMIT-ORPHAN-01）',
    );
    return;
  }

  const before = readCheckpointGitHead(root);
  const reg = checkCheckpointGitRegression(root);
  if (reg.ok) return;

  const heal = healCheckpointGitWorktree(root, { target: 'head', suffix: 'push 済' });
  if (!heal.healed) {
    console.warn(
      `[cio-checkpoint-git-postcommit-sync] WARN heal skipped reason=${heal.reason} msg=${reg.message || ''}`,
    );
    return;
  }

  git(['add', CHECKPOINT_REL], { stdio: 'inherit' });
  const follow = git(['commit', '-m', 'chore(checkpoint): sync Git line after commit'], {
    env: { ...process.env, CIO_POST_COMMIT_CHECKPOINT_SYNC: '1' },
  });
  if (follow.status === 0) {
    console.log(
      `[cio-checkpoint-git-postcommit-sync] OK healed \`${before}\` → parent-of-tip \`${heal.hash}\` (regression-heal)`,
    );
  } else {
    console.warn(
      '[cio-checkpoint-git-postcommit-sync] WARN follow-up commit failed',
      (follow.stderr || follow.stdout || '').trim(),
    );
  }
}

main();
