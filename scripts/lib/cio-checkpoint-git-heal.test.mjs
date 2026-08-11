#!/usr/bin/env node
/**
 * checkpoint Git heal 回帰テスト（一時 git リポで 4 シナリオ×複数回）
 *
 *   npm run test:checkpoint-git-heal
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkCheckpointGitRegression,
  healCheckpointGitWorktree,
  readCheckpointGitHead,
  updateCheckpointGitHead,
  gitShortHead,
} from './cio-checkpoint-git-sync.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  }
  return (r.stdout || '').trim();
}

function writeCheckpoint(dir, gitHash) {
  const p = path.join(dir, 'chat-sessions', 'checkpoint-latest.md');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const body = `# checkpoint
**最終更新**: 2026-07-20 JST — test
**Git**: **\`${gitHash}\`** = \`origin/main\` — push 済
**次の1手**: test

## セッション切替後の自律復元（Lifecycle v2 鏡像）
**正本** test | **項番 -1** | **項番 -0** OK が返るまで **着手しない** | **項番 0** \`npm run session:bootstrap\`（**Read より前**）| **項番 0.9** | **日終わり** close-git

## 2026-07-20 本日完了サマリー
| 項目 | 内容 |
|------|------|
| **test** | ok |
`;
  fs.writeFileSync(p, body, 'utf8');
}

function initRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chkpt-git-heal-'));
  git(dir, ['init']);
  git(dir, ['config', 'user.email', 'test@example.com']);
  git(dir, ['config', 'user.name', 'test']);
  // bare remote for origin/main
  const bare = path.join(dir, 'remote.git');
  spawnSync('git', ['init', '--bare', bare], { encoding: 'utf8' });
  writeCheckpoint(dir, 'deadbeef');
  git(dir, ['add', 'chat-sessions/checkpoint-latest.md']);
  git(dir, ['commit', '-m', 'init']);
  const h0 = git(dir, ['rev-parse', '--short', 'HEAD']);
  updateCheckpointGitHead(dir, { hash: h0 });
  git(dir, ['add', 'chat-sessions/checkpoint-latest.md']);
  git(dir, ['commit', '-m', 'chore(checkpoint): sync Git line after close']);
  git(dir, ['remote', 'add', 'origin', bare]);
  git(dir, ['push', '-u', 'origin', 'HEAD:main']);
  return dir;
}

function runScenario(name, fn) {
  const dir = initRepo();
  try {
    fn(dir);
    console.log(`  ✅ ${name}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('[test:checkpoint-git-heal] start');

// --- (1) exact match OK ---
runScenario('exact match → ok', (dir) => {
  const tip = git(dir, ['rev-parse', '--short', 'origin/main']);
  updateCheckpointGitHead(dir, { hash: tip });
  const r = checkCheckpointGitRegression(dir);
  assert.equal(r.ok, true);
  assert.equal(r.offByOne, undefined);
});

// --- (2) off-by-one (parent) OK without sync subject ---
runScenario('off-by-one tip^1 → ok (subject-agnostic)', (dir) => {
  fs.writeFileSync(path.join(dir, 'chat-sessions', 'handoff-log.md'), 'x\n', 'utf8');
  git(dir, ['add', 'chat-sessions/handoff-log.md']);
  // leave Git at previous tip (will become parent after this commit)
  const before = git(dir, ['rev-parse', '--short', 'HEAD']);
  updateCheckpointGitHead(dir, { hash: before });
  git(dir, ['add', 'chat-sessions/checkpoint-latest.md']);
  git(dir, ['commit', '-m', 'chore(handoff): note only']);
  git(dir, ['push', 'origin', 'HEAD:main']);
  // Now tip = handoff, Git was stamped to before=parent in same commit... 
  // Actually Git in that commit equals parent of tip = off-by-one
  const r = checkCheckpointGitRegression(dir);
  assert.equal(r.ok, true, `expected ok got ${JSON.stringify(r)}`);
  assert.equal(r.offByOne, true);
});

// --- (3) two generations behind → NG then heal ---
runScenario('two-behind → NG → heal worktree', (dir) => {
  const ancient = git(dir, ['rev-parse', '--short', 'HEAD~1']);
  // commit1 without updating Git
  fs.writeFileSync(path.join(dir, 'a.txt'), '1\n', 'utf8');
  git(dir, ['add', 'a.txt']);
  git(dir, ['commit', '-m', 'chore: a']);
  // commit2 without updating Git — stamp file to ancient (2 behind after push)
  updateCheckpointGitHead(dir, { hash: ancient });
  fs.writeFileSync(path.join(dir, 'b.txt'), '2\n', 'utf8');
  git(dir, ['add', 'b.txt', 'chat-sessions/checkpoint-latest.md']);
  git(dir, ['commit', '-m', 'chore: b with stale git']);
  git(dir, ['push', 'origin', 'HEAD:main']);

  let r = checkCheckpointGitRegression(dir);
  assert.equal(r.ok, false, 'should detect regression');

  const heal = healCheckpointGitWorktree(dir, { target: 'head' });
  assert.equal(heal.healed, true);
  assert.equal(readCheckpointGitHead(dir), gitShortHead(dir));

  // After worktree heal to HEAD, but HEAD file not committed — regression vs origin
  // still compares worktree read — heal stamped to HEAD which equals origin → ok
  r = checkCheckpointGitRegression(dir);
  assert.equal(r.ok, true, `after heal: ${JSON.stringify(r)}`);
});

// --- (4) repeated heal is idempotent ---
runScenario('heal idempotent ×3', (dir) => {
  const tip = git(dir, ['rev-parse', '--short', 'origin/main']);
  updateCheckpointGitHead(dir, { hash: tip });
  for (let i = 0; i < 3; i++) {
    const h = healCheckpointGitWorktree(dir, { target: 'origin' });
    assert.equal(h.skipped, true);
    assert.equal(checkCheckpointGitRegression(dir).ok, true);
  }
});

// --- (5) simulate post-commit style: handoff-only then heal commit ---
runScenario('handoff-only then heal commit → off-by-one ok', (dir) => {
  // Make Git two behind like production failure
  const h0 = git(dir, ['rev-parse', '--short', 'HEAD']);
  fs.writeFileSync(path.join(dir, 'chat-sessions', 'HANDOFF-HUMAN.txt'), 'tip\n', 'utf8');
  git(dir, ['add', 'chat-sessions/HANDOFF-HUMAN.txt']);
  git(dir, ['commit', '-m', 'chore(handoff): WAKE tip']);
  // stale: still h0 while tip moved; push
  updateCheckpointGitHead(dir, { hash: h0 });
  // don't commit stamp yet — working tree stale vs origin after push of handoff
  git(dir, ['push', 'origin', 'HEAD:main']);
  // force file on disk to h0 while origin is handoff tip (parent of nothing matching)
  // Actually updateCheckpointGitHead wrote h0; HEAD is handoff; origin=handoff.
  // If h0 === handoff^1 → off-by-one OK. So need ANOTHER commit to get 2 behind.
  fs.writeFileSync(path.join(dir, 'chat-sessions', 'HANDOFF-HUMAN.txt'), 'tip2\n', 'utf8');
  git(dir, ['add', 'chat-sessions/HANDOFF-HUMAN.txt']);
  git(dir, ['commit', '-m', 'chore(handoff): second']);
  git(dir, ['push', 'origin', 'HEAD:main']);
  // Git still h0 = tip^^ → NG
  assert.equal(checkCheckpointGitRegression(dir).ok, false);

  const heal = healCheckpointGitWorktree(dir, { target: 'head' });
  assert.equal(heal.healed, true);
  git(dir, ['add', 'chat-sessions/checkpoint-latest.md']);
  git(dir, ['commit', '-m', 'chore(checkpoint): sync Git line after commit']);
  git(dir, ['push', 'origin', 'HEAD:main']);
  // tip=sync, Git=previous head → off-by-one
  const r = checkCheckpointGitRegression(dir);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.offByOne, true);
});

// --- (6) force-stamp: off-by-one でも HEAD へ寄せる（Phase 5e2）---
runScenario('force-stamp overrides off-by-one no-op', (dir) => {
  fs.writeFileSync(path.join(dir, 'chat-sessions', 'handoff-log.md'), 'force\n', 'utf8');
  git(dir, ['add', 'chat-sessions/handoff-log.md']);
  git(dir, ['commit', '-m', 'chore(handoff): advance tip']);
  git(dir, ['push', 'origin', 'HEAD:main']);
  // Git は tip^1 のまま = off-by-one OK → 通常 heal は no-op
  const parent = git(dir, ['rev-parse', '--short', 'HEAD^']);
  updateCheckpointGitHead(dir, { hash: parent });
  assert.equal(checkCheckpointGitRegression(dir).ok, true);
  assert.equal(checkCheckpointGitRegression(dir).offByOne, true);
  const skip = healCheckpointGitWorktree(dir, { target: 'head' });
  assert.equal(skip.skipped, true);
  // --force-stamp 相当: HEAD へ強制 stamp
  const headNow = gitShortHead(dir);
  assert.equal(updateCheckpointGitHead(dir, { hash: headNow }), true);
  assert.equal(readCheckpointGitHead(dir), headNow);
  assert.notEqual(headNow, parent);
});

console.log('[test:checkpoint-git-heal] OK all scenarios');
