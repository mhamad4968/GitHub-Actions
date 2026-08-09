#!/usr/bin/env node
/**
 * isWakeAdjacentGrandparentFold 回帰（一時 git リポ）
 *
 *   node scripts/lib/cio-wake-handoff-allowlist.test.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  isWakeAdjacentGrandparentFold,
  isWakeHandoffParentGitHeadFold,
} from './cio-wake-handoff-allowlist.mjs';

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  }
  return (r.stdout || '').trim();
}

function initRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wake-allowlist-'));
  git(dir, ['init']);
  git(dir, ['config', 'user.email', 'test@example.com']);
  git(dir, ['config', 'user.name', 'test']);
  fs.mkdirSync(path.join(dir, 'docs', 'handoff'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs', 'handoff', 'latest-session-bridge.json'), '{}\n');
  git(dir, ['add', 'docs/handoff/latest-session-bridge.json']);
  git(dir, ['commit', '-m', 'base']);
  return dir;
}

function short(cwd, ref = 'HEAD') {
  return git(cwd, ['rev-parse', '--short', ref]);
}

console.log('[test:cio-wake-handoff-allowlist] start');

{
  const dir = initRepo();
  try {
    const h0 = short(dir);
    fs.writeFileSync(
      path.join(dir, 'docs', 'handoff', 'latest-session-bridge.json'),
      JSON.stringify({ gitHead: h0 }, null, 2) + '\n',
    );
    fs.mkdirSync(path.join(dir, 'chat-sessions'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'chat-sessions', 'checkpoint-latest.md'), '# cp\n');
    git(dir, ['add', 'docs/handoff/latest-session-bridge.json', 'chat-sessions/checkpoint-latest.md']);
    git(dir, ['commit', '-m', 'chore(handoff): wake']);
    fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}\n');
    git(dir, ['add', 'package-lock.json']);
    git(dir, ['commit', '-m', 'chore(deps): lock']);
    const bridge = h0;
    assert.equal(isWakeAdjacentGrandparentFold(dir, bridge), true);
    assert.equal(isWakeHandoffParentGitHeadFold(dir, bridge), false);
    console.log('  ✅ grandparent fold: lock tip + handoff parent');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = initRepo();
  try {
    const h0 = short(dir);
    fs.writeFileSync(path.join(dir, 'README.md'), 'x\n');
    git(dir, ['add', 'README.md']);
    git(dir, ['commit', '-m', 'unrelated']);
    fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}\n');
    git(dir, ['add', 'package-lock.json']);
    git(dir, ['commit', '-m', 'lock only']);
    assert.equal(isWakeAdjacentGrandparentFold(dir, h0), false);
    console.log('  ✅ reject when HEAD~1 is not wake handoff');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('[test:cio-wake-handoff-allowlist] OK');
