#!/usr/bin/env node
/**
 * WAKE 後に cold-start が更新した handoff 成果物を commit（偽陽性 Git 残件の恒久対策）
 *
 *   npm run cio:wake:handoff-commit
 *   npm run cio:wake:handoff-commit -- --push
 *
 * 順序（§50-3-8 / #S-WAKE-LOCK-01）:
 *   1) package-lock / package.json heal（allowlist 外・分離 commit）
 *   2) allowlist handoff commit
 *   3) tip 直後の debug-tips のみ残件があれば tipsOnly commit
 *   4) 任意 --push
 *
 * allowlist のみ stage（SESSION-CLOCK は意図的 dirty のため対象外）。
 * bootstrap sync / export-handoff が触る genre・META・debug-tips・checkpoint も同梱。
 * commit 後 tip が進むため bridge.gitHead は parent になる（D-CLOSE-02 許容）。
 * reexport→再 commit は tip ずれの無限追従になるため行わない。
 * @see scripts/cio-session-cold-start.mjs Phase 6b2
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  WAKE_HANDOFF_ALLOWLIST,
  isWakeHandoffPathAllowed,
} from './lib/cio-wake-handoff-allowlist.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWLIST = [...WAKE_HANDOFF_ALLOWLIST];
/** rollup archive 用の追加 pathspec（dated 名） */
const EXTRA_PATHSPECS = ['chat-sessions/checkpoints/checkpoint-archive-*.md'];

function git(args, opts = {}) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', ...opts });
  return {
    ok: r.status === 0,
    status: r.status ?? 1,
    // status/porcelain は先頭行の leading space を消さない（trim 禁止）
    out: args[0] === 'status' ? (r.stdout || '').replace(/\s+$/, '') : (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
  };
}

function dirtyAllowlist() {
  const st = git(['status', '--porcelain', '--', ...ALLOWLIST, ...EXTRA_PATHSPECS]);
  if (!st.ok) return [];
  return st.out
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/^"(.*)"$/, '$1').replace(/\\/g, '/'))
    .filter((rel) => isWakeHandoffPathAllowed(rel));
}

function commitAllowlist(paths, message) {
  const add = git(['add', '--', ...paths]);
  if (!add.ok) {
    console.error('[cio:wake:handoff-commit] NG git add', add.err);
    process.exit(1);
  }
  // pathspec 付き commit — index に載った allowlist 外（例: 682 workflow）を誤同梱しない
  // post-commit checkpoint sync を入れると tip が再度ずれて D-CLOSE-02 が悪化する
  const commit = git(['commit', '-m', message, '--', ...paths], {
    env: {
      ...process.env,
      CIO_POST_COMMIT_CHECKPOINT_SYNC: '0',
    },
  });
  if (!commit.ok) {
    console.error('[cio:wake:handoff-commit] NG commit', commit.err || commit.out);
    process.exit(commit.status || 1);
  }
  console.log(`[cio:wake:handoff-commit] commit OK files=${paths.join(',')}`);
}

/** #S-WAKE-LOCK-01 — allowlist 外の package-lock / package.json 残件を別 commit（SESSION-CLOCK 除外）
 * @returns {boolean} commit したか
 */
function healPackageLockBeforeHandoff() {
  const lockHeal = [];
  const stLock = git(['status', '--porcelain', '--', 'package-lock.json', 'package.json']);
  if (stLock.ok && stLock.out) {
    for (const line of stLock.out.split(/\r?\n/).filter(Boolean)) {
      const rel = line.slice(3).trim().replace(/^"(.*)"$/, '$1').replace(/\\/g, '/');
      if (rel === 'package-lock.json' || rel === 'package.json') lockHeal.push(rel);
    }
  }
  if (lockHeal.length === 0) return false;
  commitAllowlist(lockHeal, 'chore(deps): sync package-lock after WAKE (#S-WAKE-LOCK-01)');
  return true;
}

/** lock tip 後に bridge を 1 回だけ合わせる（handoff 後の無限追従はしない） */
function reexportBridgeAfterLock() {
  const r = spawnSync(process.execPath, ['scripts/cio-session-export-handoff.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    console.warn(
      '[cio:wake:handoff-commit] WARN export-handoff after lock failed — bridge は次の handoff で親ずれの可能性',
      (r.stderr || r.stdout || '').trim(),
    );
    return false;
  }
  console.log('[cio:wake:handoff-commit] re-export bridge after lock heal');
  return true;
}

function main() {
  const doPush = process.argv.includes('--push');

  // DeepSeek §50-3-8: lock heal を allowlist handoff より先に。
  // lock で tip が進むと旧 bridge が grandparent になるため、lock 直後に 1 回だけ re-export。
  if (healPackageLockBeforeHandoff()) {
    reexportBridgeAfterLock();
  }

  const paths = dirtyAllowlist();
  if (paths.length === 0) {
    console.log('[cio:wake:handoff-commit] OK no-op（allowlist clean）');
  } else {
    commitAllowlist(paths, 'chore(handoff): sync bridge + WAKE artifacts after cold-start');
  }

  // tip 直後の debug-tips 自動追記だけ残っていれば同梱（bridge 再 export はしない）
  const tipsOnly = dirtyAllowlist().filter((p) => p === 'docs/knowledge/debug-tips.md');
  if (tipsOnly.length > 0) {
    commitAllowlist(tipsOnly, 'chore(handoff): sync debug-tips after WAKE');
  }

  if (!doPush) {
    process.exit(0);
  }
  const push = git(['push', 'origin', 'HEAD']);
  if (!push.ok) {
    console.warn(
      '[cio:wake:handoff-commit] WARN push failed — force 禁止。後で close-git または git push',
      push.err || push.out,
    );
    process.exit(0);
  }
  console.log('[cio:wake:handoff-commit] push OK');
  process.exit(0);
}

main();
