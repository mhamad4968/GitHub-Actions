#!/usr/bin/env node
/**
 * checkpoint **Git** 行の heal CLI（D-CHKPT-02 / S-CLOSE-01）
 *
 * Usage:
 *   npm run cio:checkpoint:git-heal                 # worktree stamp のみ（WAKE 推奨）
 *   npm run cio:checkpoint:git-heal -- --check      # 検査のみ exit 0/2
 *   npm run cio:checkpoint:git-heal -- --force-stamp # reg.ok（含 off-by-one）でも HEAD へ stamp
 *   npm run cio:checkpoint:git-heal -- --commit     # stamp + sync commit
 *   npm run cio:checkpoint:git-heal -- --commit --push  # + best-effort push
 *
 * WAKE/cold-start: **stamp のみ** → export-handoff → wake:handoff-commit。
 * heal --commit の直後に wake すると tip が進み Git が grandparent（#D-CLOSE-02 NG）。
 * amend / force-push 禁止（#S-R44-SKIP-01）。
 * Phase 5e2（early wake 前）は **--force-stamp** 必須: off-by-one no-op のまま 5f すると tip^2 で D-CHKPT-02。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { CHECKPOINT_REL } from './lib/cio-checkpoint-read.mjs';
import {
  checkCheckpointGitRegression,
  healCheckpointGitWorktree,
  readCheckpointGitHead,
  gitShortHead,
  updateCheckpointGitHead,
} from './lib/cio-checkpoint-git-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(args, opts = {}) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', ...opts });
  return {
    ok: r.status === 0,
    status: r.status ?? 1,
    out: (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
  };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const forceStamp = process.argv.includes('--force-stamp');
  const doCommit = process.argv.includes('--commit');
  const doPush = process.argv.includes('--push');
  const target = process.argv.includes('--target-origin') ? 'origin' : 'head';

  const before = readCheckpointGitHead(root);
  const reg = checkCheckpointGitRegression(root);

  if (checkOnly) {
    if (reg.ok) {
      console.log(
        `[cio:checkpoint:git-heal] OK check cp=${before || '(none)'} offByOne=${Boolean(reg.offByOne)}`,
      );
      process.exit(0);
    }
    console.error(`[cio:checkpoint:git-heal] NG ${reg.message}`);
    process.exit(2);
  }

  // Phase 5e2: off-by-one でも HEAD へ寄せてから early wake（tip^2 防止）
  if (forceStamp) {
    const hash =
      target === 'origin' ? git(['rev-parse', '--short', 'origin/main']).out || gitShortHead(root) : gitShortHead(root);
    if (!hash) {
      console.error('[cio:checkpoint:git-heal] NG force-stamp: no hash');
      process.exit(1);
    }
    if (before === hash) {
      console.log(`[cio:checkpoint:git-heal] OK force-stamp no-op cp=${before} (== HEAD)`);
      process.exit(0);
    }
    const changed = updateCheckpointGitHead(root, { hash, suffix: 'push 済' });
    if (!changed) {
      console.error('[cio:checkpoint:git-heal] NG force-stamp write failed');
      process.exit(1);
    }
    console.log(
      `[cio:checkpoint:git-heal] force-stamped \`${before || '(none)'}\` → \`${hash}\` (worktree · pre-early-wake)`,
    );
    if (!doCommit) {
      process.exit(0);
    }
    // fall through to commit path with already-stamped worktree
  } else if (reg.ok) {
    console.log(
      `[cio:checkpoint:git-heal] OK no-op cp=${before || '(none)'} reason=${reg.offByOne ? 'off-by-one' : 'fresh'}`,
    );
    process.exit(0);
  }

  let heal = { healed: Boolean(forceStamp), before, hash: readCheckpointGitHead(root), reason: forceStamp ? 'force-stamp' : undefined };
  if (!forceStamp) {
    heal = healCheckpointGitWorktree(root, { target, suffix: 'push 済' });
    if (!heal.healed) {
      console.error(`[cio:checkpoint:git-heal] NG stamp failed reason=${heal.reason}`);
      process.exit(1);
    }
    console.log(
      `[cio:checkpoint:git-heal] stamped \`${heal.before}\` → \`${heal.hash}\` (worktree)`,
    );
  }

  if (!doCommit) {
    console.log('[cio:checkpoint:git-heal] tip: add --commit で sync commit を作成');
    process.exit(0);
  }

  const add = git(['add', CHECKPOINT_REL]);
  if (!add.ok) {
    console.error('[cio:checkpoint:git-heal] NG git add', add.err);
    process.exit(1);
  }

  const commit = git(['commit', '-m', 'chore(checkpoint): sync Git line after heal'], {
    env: { ...process.env, CIO_POST_COMMIT_CHECKPOINT_SYNC: '1' },
  });
  if (!commit.ok) {
    console.error('[cio:checkpoint:git-heal] NG commit', commit.err || commit.out);
    process.exit(commit.status || 1);
  }
  const tip = gitShortHead(root);
  console.log(`[cio:checkpoint:git-heal] commit OK tip=${tip} Git≈${heal.hash} (R44 off-by-one)`);

  if (!doPush) {
    process.exit(0);
  }

  const push = git(['push', 'origin', 'HEAD']);
  if (!push.ok) {
    // cold-start 非致命（DeepSeek 盲点3）
    console.warn(
      '[cio:checkpoint:git-heal] WARN push failed — ahead のまま。後で close-git または git push（force 禁止）',
      push.err || push.out,
    );
    process.exit(0);
  }
  console.log('[cio:checkpoint:git-heal] push OK');
  process.exit(0);
}

main();
