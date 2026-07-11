/**
 * Team ops v3.3 — WARN 2 セッション連続 → strict 昇格
 */
import fs from 'node:fs';
import path from 'node:path';

const WARN_STREAK_REL = 'logs/cio-turn-start/warn-streak.json';
const FORCE_STRICT_REL = 'logs/cio-turn-start/force-strict-until.json';

export function warnStreakPath(root) {
  return path.join(root, WARN_STREAK_REL);
}

export function forceStrictPath(root) {
  return path.join(root, FORCE_STRICT_REL);
}

function readJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function sessionKey(root) {
  const bridge = path.join(root, 'docs/handoff/latest-session-bridge.json');
  if (fs.existsSync(bridge)) {
    try {
      const b = JSON.parse(fs.readFileSync(bridge, 'utf8'));
      if (b.gitHead) return `git:${b.gitHead}`;
    } catch {
      /* skip */
    }
  }
  return `date:${new Date().toISOString().slice(0, 10)}`;
}

export function recordWarnEvent(root, kind = '5038') {
  const p = warnStreakPath(root);
  const data = readJson(p, { sessions: [], lastSession: null, consecutive: 0 });
  const sk = sessionKey(root);
  if (data.lastSession !== sk) {
    data.lastSession = sk;
    data.consecutive = 1;
    data.sessions.push({ at: new Date().toISOString(), session: sk, kind });
  } else {
    const last = data.sessions[data.sessions.length - 1];
    if (!last || last.kind !== kind) {
      data.sessions.push({ at: new Date().toISOString(), session: sk, kind });
    }
  }
  if (data.sessions.length > 50) data.sessions = data.sessions.slice(-50);
  writeJson(p, data);
  return data;
}

export function evaluateWarnEscalation(root) {
  const p = warnStreakPath(root);
  const data = readJson(p, { sessions: [] });
  const bySession = new Map();
  for (const e of data.sessions || []) {
    if (!bySession.has(e.session)) bySession.set(e.session, []);
    bySession.get(e.session).push(e);
  }
  let consecutive = 0;
  const ordered = [...bySession.keys()];
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    if ((bySession.get(ordered[i]) || []).length > 0) consecutive += 1;
    else break;
    if (consecutive >= 2) break;
  }
  if (consecutive >= 2) {
    writeJson(forceStrictPath(root), {
      at: new Date().toISOString(),
      reason: 'warn-streak-2-sessions',
      consecutive,
    });
    return { escalated: true, consecutive };
  }
  return { escalated: false, consecutive };
}

export function isForceStrictActive(root) {
  const p = forceStrictPath(root);
  return fs.existsSync(p);
}

export function clearWarnEscalation(root) {
  for (const rel of [WARN_STREAK_REL, FORCE_STRICT_REL]) {
    const p = path.join(root, rel);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}
