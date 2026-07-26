#!/usr/bin/env node
/**
 * WAKE 後に cold-start が更新した handoff 成果物を commit（偽陽性 Git 残件の恒久対策）
 *
 *   npm run cio:wake:handoff-commit
 *   npm run cio:wake:handoff-commit -- --push
 *
 * allowlist のみ stage（SESSION-CLOCK は意図的 dirty のため対象外）。
 * bootstrap sync / export-handoff が触る genre・META・debug-tips・checkpoint も同梱し、
 * commit 後に bridge を再 export→差分があれば 1 回だけ追従 commit（偽陽性残件の恒久対策）。
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

function commitAllowlist(paths, message, { checkpointSync = false } = {}) {
  const add = git(['add', '--', ...paths]);
  if (!add.ok) {
    console.error('[cio:wake:handoff-commit] NG git add', add.err);
    process.exit(1);
  }
  // 追従 commit で post-commit checkpoint sync を入れると tip が再度ずれて bridge 追従が終わらない
  const commit = git(['commit', '-m', message], {
    env: {
      ...process.env,
      CIO_POST_COMMIT_CHECKPOINT_SYNC: checkpointSync ? '1' : '0',
    },
  });
  if (!commit.ok) {
    console.error('[cio:wake:handoff-commit] NG commit', commit.err || commit.out);
    process.exit(commit.status || 1);
  }
  console.log(`[cio:wake:handoff-commit] commit OK files=${paths.join(',')}`);
}

function reexportBridge() {
  const r = spawnSync('npm', ['run', 'cio:session:export-handoff'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    console.warn(
      '[cio:wake:handoff-commit] WARN export-handoff failed（追従 commit スキップ）',
      (r.stderr || r.stdout || '').trim().slice(0, 400),
    );
    return false;
  }
  return true;
}

function main() {
  const doPush = process.argv.includes('--push');
  const paths = dirtyAllowlist();
  if (paths.length === 0) {
    console.log('[cio:wake:handoff-commit] OK no-op（allowlist clean）');
  } else {
    commitAllowlist(
      paths,
      'chore(handoff): sync bridge + WAKE artifacts after cold-start',
      { checkpointSync: false },
    );
  }

  // tip 更新後に bridge.gitHead を 1 回だけ再同期（checkpoint sync OFF で追従打ち止め）
  if (reexportBridge()) {
    const follow = dirtyAllowlist().filter(
      (p) =>
        p === 'docs/handoff/latest-session-bridge.json'
        || p === 'docs/knowledge/debug-tips.md',
    );
    if (follow.length > 0) {
      commitAllowlist(follow, 'chore(handoff): realign bridge after WAKE tip', {
        checkpointSync: false,
      });
    }
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
