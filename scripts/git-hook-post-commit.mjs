#!/usr/bin/env node
/**
 * git-hook-post-commit.mjs — post-commit の Node 実装（Windows / Git-Bash / WSL 共通）
 *
 * 元: git-hooks/post-commit (bash)。TSB-016 / TSB-024 / mandatory-read-gate と同等の順序。
 * hook は常に exit 0（commit は止めない）。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  discoverGovernanceGenerationsFromGit,
  loadGuardManifest,
} from './lib/git-history-alignment.mjs';
import { touchesGovernance, isManifestGenerationsStale } from './lib/cio-governance-touch.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOG_DIR = path.join(ROOT, 'logs', 'git-hooks');
const LOG_FILE = path.join(LOG_DIR, 'post-commit.log');

function appendLog(line) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {
    /* ignore */
  }
}

function ts() {
  return new Date().toISOString();
}

function runScript(rel, args = []) {
  const r = spawnSync(process.execPath, [path.join(ROOT, rel), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const code = typeof r.status === 'number' ? r.status : 2;
  return { code, out };
}

function gitShort() {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  return (r.stdout || '').trim() || '?';
}

function gitSubject() {
  const r = spawnSync('git', ['log', '-1', '--pretty=format:%s'], { cwd: ROOT, encoding: 'utf8' });
  return (r.stdout || '').trim().replace(/"/g, '\\"') || '';
}

const sha = gitShort();
const subject = gitSubject();
const bell = process.stderr.isTTY ? '\x07' : '';

if (process.env.CIO_POST_COMMIT_GENERATIONS_AMEND === '1') {
  appendLog(`[${ts()}] commit=${sha} governance-generations skip (amend recursion guard)`);
  process.exit(0);
}

// --- verify-breaking-deletions ---
const vb = runScript('scripts/verify-breaking-deletions.mjs', ['--since=50']);
const vbPass = /^✅ pass/m.test(vb.out);
appendLog(`[${ts()}] commit=${sha} verify-breaking status=${vbPass ? 'pass' : 'warn'} subject="${subject}"`);
if (!vbPass) {
  process.stderr.write(bell);
  console.error('\n============================================================');
  console.error('  ⚠️  post-commit hook: ZOMBIE RESURRECTION DETECTED');
  console.error('============================================================');
  console.error(`  Commit: ${sha} "${subject}"\n`);
  console.error(vb.out.split('\n').slice(-30).join('\n'));
  console.error('============================================================\n');
}

// --- verify-constitution-handoff ---
const ch = runScript('scripts/verify-constitution-handoff.mjs');
appendLog(`[${ts()}] commit=${sha} constitution-handoff exit=${ch.code} subject="${subject}"`);
if (ch.code !== 0) {
  appendLog(ch.out.split('\n').slice(-20).join('\n'));
  process.stderr.write(bell);
  console.error('\n============================================================');
  console.error('  ⚠️  post-commit hook: CONSTITUTION HANDOFF GUARD FAILED');
  console.error('============================================================');
  console.error(`  Commit: ${sha} "${subject}"`);
  console.error(ch.out.split('\n').slice(-25).join('\n'));
  console.error('============================================================\n');
}

// --- mandatory-read-gate ---
const mr = runScript('scripts/mandatory-read-gate.mjs');
appendLog(`[${ts()}] commit=${sha} mandatory-read-gate exit=${mr.code} subject="${subject}"`);
if (mr.code !== 0) {
  appendLog(mr.out.split('\n').slice(-20).join('\n'));
  process.stderr.write(bell);
  console.error('\n============================================================');
  console.error('  ⚠️  post-commit hook: MANDATORY READ GATE FAILED');
  console.error('============================================================');
  console.error(`  Commit: ${sha} "${subject}"`);
  console.error(mr.out.split('\n').slice(-25).join('\n'));
  console.error('============================================================\n');
}

// --- governance generations manifest 同期（commit 後に最新 hash を反映）---
const commitFiles = spawnSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {
  cwd: ROOT,
  encoding: 'utf8',
});
const commitPaths = commitFiles.stdout || '';
if (touchesGovernance(commitPaths)) {
  const sync = runScript('scripts/sync-git-history-generations.mjs', ['--apply']);
  appendLog(`[${ts()}] commit=${sha} governance-generations sync exit=${sync.code} subject="${subject}"`);
  if (sync.code === 0) {
    const st = spawnSync('git', ['status', '--porcelain', 'data/git-history-guard-manifest.json'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    if ((st.stdout || '').trim()) {
      spawnSync('git', ['add', 'data/git-history-guard-manifest.json'], { cwd: ROOT });
      const amend = spawnSync('git', ['commit', '--amend', '--no-edit'], {
        cwd: ROOT,
        encoding: 'utf8',
        env: { ...process.env, CIO_POST_COMMIT_GENERATIONS_AMEND: '1' },
      });
      if (amend.status === 0) {
        appendLog(`[${ts()}] commit=${sha} governance-generations amended manifest`);
        console.log('[post-commit] OK git-history-guard-manifest.json を同一 commit に amend 同期');
      } else {
        process.stderr.write(bell);
        console.error('[post-commit] WARN manifest 更新後の amend 失敗 — 手動で commit してください');
      }
    }
  } else if (isManifestGenerationsStale(ROOT, discoverGovernanceGenerationsFromGit, loadGuardManifest)) {
    process.stderr.write(bell);
    console.error('\n============================================================');
    console.error('  ⚠️  post-commit: GOVERNANCE GENERATIONS SYNC FAILED');
    console.error('============================================================');
    console.error(`  Commit: ${sha} "${subject}"`);
    console.error('  → npm run sync:git-history-generations -- --apply');
    console.error('============================================================\n');
  }
}

process.exit(0);
