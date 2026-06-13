#!/usr/bin/env node
/**
 * セッション締め Git 儀式 — 先祖返り回避 + B1/B4（浜田 GO 2026-05-30〜31 / R-17-1）
 *
 * 順序（--execute 時）:
 *   1) cio:guard:multi-customize（customize 2アプリ以上 → portfolio strict）
 *   2) git commit（--message 必須。未 stage なら --auto-stage で追加、temp は除外）
 *   3) git pull --rebase origin <branch>（reject / 先祖返り回避）
 *   4) git push
 *   5) verify:session-close-git-warn
 *
 * 検査のみ（既定）:
 *   npm run cio:session:close-git
 *
 * 実行:
 *   npm run cio:session:close-git -- --execute --message "…"
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execute = process.argv.includes('--execute');
const autoStage = process.argv.includes('--auto-stage');
const msgIdx = process.argv.indexOf('--message');
const message = msgIdx >= 0 ? process.argv[msgIdx + 1] : '';

import { isSessionCloseTempPath } from './lib/cio-session-close-temp-paths.mjs';

function git(args, opts = {}) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', ...opts });
  return {
    ok: r.status === 0,
    status: r.status ?? 1,
    out: (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
  };
}

function runNode(rel, args = []) {
  const r = spawnSync(process.execPath, [path.join(root, rel), ...args], {
    cwd: root,
    stdio: 'inherit',
  });
  return r.status === 0;
}

function runNpm(script, args = []) {
  const r = spawnSync('npm', ['run', script, '--', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  return r.status === 0;
}

function isTempUntracked(rel) {
  return isSessionCloseTempPath(rel);
}

function checkOnly() {
  console.log('[cio:session:close-git] 検査モード — 締め前に --execute --message で B1/B4 実行');
  return runNode('scripts/verify-session-close-git-warn.mjs');
}

function stageSessionChanges() {
  git(['add', '-u']);
  const st = git(['status', '--porcelain']);
  if (!st.ok) {
    console.error('[cio:session:close-git] git status 失敗');
    process.exit(2);
  }
  const lines = st.out.split(/\r?\n/).filter(Boolean);
  let staged = 0;
  for (const line of lines) {
    if (line.length < 4) continue;
    const x = line[0];
    const y = line[1];
    if (x !== '?' || y !== '?') continue;
    const rel = line.slice(3).trim().replace(/^"(.*)"$/, '$1');
    if (isTempUntracked(rel)) {
      console.log(`[cio:session:close-git] skip temp: ${rel}`);
      continue;
    }
    const add = git(['add', '--', rel]);
    if (add.ok) staged += 1;
  }
  const count = git(['diff', '--cached', '--name-only']).out.split(/\r?\n/).filter(Boolean).length;
  console.log(`[cio:session:close-git] auto-stage: ${count} path(s) staged`);
}

function main() {
  console.log('=== cio:session:close-git（先祖返り回避 + B1/B4）===');
  console.log('正本: 18-重要確認 B1/B4 / 14-READ-06 R-17-1 / session-close-multi-session.md\n');

  if (!execute) {
    process.exit(checkOnly() ? 0 : 1);
  }

  if (!message) {
    console.error('[cio:session:close-git] NG --execute には --message "…" 必須');
    process.exit(1);
  }

  if (!runNpm('cio:guard:multi-customize')) {
    console.error('[cio:session:close-git] NG R-17-1 multi-customize guard');
    process.exit(1);
  }

  const porcelain = git(['status', '--porcelain']).out;
  const hasUncommitted = Boolean(porcelain);
  const staged = git(['diff', '--cached', '--name-only']).out;

  if (hasUncommitted && !staged && autoStage) {
    stageSessionChanges();
  }

  const stagedAfter = git(['diff', '--cached', '--name-only']).out;
  if (hasUncommitted && !stagedAfter) {
    console.error('[cio:session:close-git] NG 未コミットあり — git add または --auto-stage');
    git(['status', '--short']);
    process.exit(1);
  }

  if (stagedAfter) {
    const commit = git(['commit', '-m', message]);
    if (!commit.ok) {
      console.error('[cio:session:close-git] NG commit 失敗（pre-commit 等）');
      process.exit(commit.status || 1);
    }
    console.log('[cio:session:close-git] commit OK');
  } else {
    console.log('[cio:session:close-git] 新規 commit なし（既に commit 済）');
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).out || 'main';
  const upstream = git(['rev-parse', '--abbrev-ref', '@{u}']).out;
  const remoteBranch = upstream && !upstream.includes('fatal') ? upstream : `origin/${branch}`;

  const fetch = git(['fetch', 'origin', branch]);
  if (!fetch.ok) {
    console.warn('[cio:session:close-git] WARN git fetch — 続行');
  }

  const pull = spawnSync('git', ['pull', '--rebase', 'origin', branch], {
    cwd: root,
    stdio: 'inherit',
  });
  if (pull.status !== 0) {
    console.error('[cio:session:close-git] NG pull --rebase — 競合解消後に再実行');
    process.exit(pull.status || 1);
  }

  const push = git(['push', 'origin', 'HEAD']);
  if (!push.ok) {
    console.error('[cio:session:close-git] NG push', push.err || push.out);
    process.exit(push.status || 1);
  }
  console.log('[cio:session:close-git] push OK');

  if (!runNode('scripts/verify-session-close-git-warn.mjs')) {
    process.exit(1);
  }

  console.log('\n[cio:session:close-git] OK — 続けて npm run desktop:sync-and-verify');
  process.exit(0);
}

main();
