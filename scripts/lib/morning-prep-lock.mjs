/**
 * morning-prep-lock.mjs — daily-morning-prep の二重起動防止
 */
import fs from 'node:fs';
import path from 'node:path';

const STALE_MS = 35 * 60 * 1000;

export function lockPath(repoRoot) {
  return path.join(repoRoot, 'logs', 'morning-prep', '.morning-prep.lock');
}

/**
 * @returns {'acquired'|'stale-replaced'|'busy'}
 */
export function acquireMorningPrepLock(repoRoot) {
  const p = lockPath(repoRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });

  let replacedStale = false;
  if (fs.existsSync(p)) {
    let old = null;
    try {
      old = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      old = null;
    }
    const age = old?.startedAt ? Date.now() - old.startedAt : STALE_MS + 1;
    if (age < STALE_MS) {
      return 'busy';
    }
    fs.unlinkSync(p);
    replacedStale = true;
  }

  fs.writeFileSync(
    p,
    JSON.stringify({
      pid: process.pid,
      startedAt: Date.now(),
      host: process.env.COMPUTERNAME || process.env.HOSTNAME || 'unknown',
    }),
    'utf8',
  );
  return replacedStale ? 'stale-replaced' : 'acquired';
}

export function releaseMorningPrepLock(repoRoot) {
  try {
    fs.unlinkSync(lockPath(repoRoot));
  } catch {
    /* ignore */
  }
}

export function readMorningPrepLock(repoRoot) {
  const p = lockPath(repoRoot);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}
