/**
 * 週末自律修正の自動ロールバック（第9層・拡張案1）
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASELINE_REL = 'data/cio-weekend-rollback-baseline.json';
const LOCK_REL = 'logs/cio-weekend-rollback/lock.json';

const DEFAULT_VERIFY = [
  'npm run verify:cio-mcp-registry',
  'npm run verify:cio-env-integrity',
  'npm run verify:cio-four-ai-governance',
];

export function loadBaseline(root) {
  const p = path.join(root, BASELINE_REL);
  if (!fs.existsSync(p)) {
    return { baselineShort: '5512754', weekendCommitPatterns: ['[WEEKEND-DEAD-CODE-PURGE]', '[WEEKEND-SELF-HEALING]'] };
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function sh(cmd, root) {
  return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell: true }).trim();
}

function shTry(cmd, root) {
  try {
    execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell: true });
    return { ok: true, out: '' };
  } catch (e) {
    return { ok: false, out: (e.stdout || e.stderr || e.message || '').trim() };
  }
}

export function resolveBaselineHash(root, baseline) {
  const short = baseline.baselineShort || baseline.baselineFull?.slice(0, 7) || '5512754';
  try {
    return sh(`git rev-parse ${short}^{commit}`, root);
  } catch {
    return short;
  }
}

export function findWeekendCommits(root, baselineHash) {
  const baseline = loadBaseline(root);
  const patterns = baseline.weekendCommitPatterns || ['[WEEKEND-DEAD-CODE-PURGE]', '[WEEKEND-SELF-HEALING]'];
  const grepArg = patterns.map((p) => `--grep=${JSON.stringify(p)}`).join(' ');
  const range = `${baselineHash}..HEAD`;
  let out = '';
  try {
    out = sh(`git log ${grepArg} --format=%H%x09%s ${range}`, root);
  } catch {
    return [];
  }
  if (!out) return [];
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, ...rest] = line.split('\t');
      return { hash, subject: rest.join('\t') };
    })
    .reverse();
}

export function runVerifyGate(root, commands = DEFAULT_VERIFY) {
  const results = [];
  let allOk = true;
  for (const cmd of commands) {
    const r = shTry(cmd, root);
    results.push({ cmd, ok: r.ok, out: r.out.slice(0, 500) });
    if (!r.ok) allOk = false;
  }
  return { allOk, results };
}

export function writeLock(root, payload) {
  const dir = path.join(root, path.dirname(LOCK_REL));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(root, LOCK_REL), JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

export function isLocked(root) {
  const p = path.join(root, LOCK_REL);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { locked: true };
  }
}

export function rollbackWeekendCommits(root, { dryRun = false, baselineOverride } = {}) {
  const baseline = loadBaseline(root);
  const baselineHash = baselineOverride || resolveBaselineHash(root, baseline);
  const weekendCommits = findWeekendCommits(root, baselineHash);

  if (weekendCommits.length === 0) {
    return {
      action: 'none',
      reason: 'no-weekend-commits',
      baselineHash,
      weekendCommits: [],
      reverted: [],
    };
  }

  if (dryRun) {
    return {
      action: 'dry-run',
      baselineHash,
      weekendCommits,
      reverted: weekendCommits.map((c) => c.hash),
    };
  }

  const reverted = [];
  for (const c of [...weekendCommits].reverse()) {
    try {
      sh(`git revert --no-edit ${c.hash}`, root);
      reverted.push(c);
    } catch (e) {
      return {
        action: 'failed',
        baselineHash,
        weekendCommits,
        reverted,
        error: String(e.message || e),
        failedAt: c.hash,
      };
    }
  }

  const verify = runVerifyGate(root);
  const lockPayload = {
    locked: true,
    lockedAt: new Date().toISOString(),
    baselineHash,
    reverted: reverted.map((c) => ({ hash: c.hash, subject: c.subject })),
    verifyOk: verify.allOk,
    message: '週末の変更にデグレードを検知したため、金曜夜の安全圏へ自動退避しました',
  };
  writeLock(root, lockPayload);

  return {
    action: 'reverted',
    baselineHash,
    weekendCommits,
    reverted,
    verify,
    lockPayload,
  };
}

export function executeWeekendRollback(root, opts = {}) {
  const { dryRun = false, skipVerify = false, force = false, baselineOverride } = opts;

  const existingLock = isLocked(root);
  if (existingLock?.locked && !force) {
    return { action: 'locked', lock: existingLock };
  }

  if (!skipVerify && !dryRun) {
    const gate = runVerifyGate(root);
    if (gate.allOk) {
      return { action: 'ok', verify: gate, message: '検証合格 — ロールバック不要' };
    }
  }

  return rollbackWeekendCommits(root, { dryRun, baselineOverride });
}

export const SAFETY_REPORT =
  '週末の変更にデグレードを検知したため、金曜夜の安全圏へ自動退避しました';
