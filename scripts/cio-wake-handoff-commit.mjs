#!/usr/bin/env node
/**
 * WAKE 後に cold-start が更新した handoff 成果物を commit（偽陽性 Git 残件の恒久対策）
 *
 *   npm run cio:wake:handoff-commit
 *   npm run cio:wake:handoff-commit -- --push
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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWLIST = [
  'docs/handoff/latest-session-bridge.json',
  'docs/handoff/spec-task-scores.json',
  'docs/knowledge/debug-tips.md',
  'chat-sessions/checkpoint-latest.md',
  'chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/31-META-26-formalization-lifecycle-charter.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/32-META-27-constitution-navigation-charter.txt',
  'chat-sessions/desktop-ai-emergency-read-pack/33-META-28-ceo-go-phases-charter.txt',
];

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
  const st = git(['status', '--porcelain', '--', ...ALLOWLIST]);
  if (!st.ok) return [];
  return st.out
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/^"(.*)"$/, '$1').replace(/\\/g, '/'))
    .filter((rel) => ALLOWLIST.includes(rel));
}

function commitAllowlist(paths, message) {
  const add = git(['add', '--', ...paths]);
  if (!add.ok) {
    console.error('[cio:wake:handoff-commit] NG git add', add.err);
    process.exit(1);
  }
  // post-commit checkpoint sync を入れると tip が再度ずれて D-CLOSE-02 が悪化する
  const commit = git(['commit', '-m', message], {
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

function main() {
  const doPush = process.argv.includes('--push');
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
