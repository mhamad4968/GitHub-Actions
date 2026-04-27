/**
 * §51-6-2 壁時計: check-json を1回だけ評価し、4h 超なら通知（同一開始行は1回だけ）。
 * session-clock-watch と cron から共有する。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { desktopNotify } from './desktop-notify.mjs';

const NOTIFY_TITLE = '§51-6-2 セッション切替時刻';

function bodyFromPayload(payload) {
  return `同一セッション開始から ${payload.elapsedHuman ?? '4h+'} 経過（開始 ${payload.startLine} JST）。新しい Composer で開き直すと sessionStart hook が時刻を取り直します。`;
}

/**
 * @param {{ root: string }} opts
 * @returns {{
 *   outcome: 'parse-error'|'ok-reset'|'not-over'|'dup'|'alerted',
 *   payload?: object,
 *   notifyMethod?: string,
 * }}
 */
export function pollSessionSplitAlertOnce(opts) {
  const { root } = opts;
  const j = spawnSync(process.execPath, ['scripts/session-clock.mjs', 'check-json'], {
    cwd: root,
    encoding: 'utf8',
  });
  const flagAbs = path.join(root, 'logs', '.session-clock-split-alerted');
  let payload;
  try {
    const line = (j.stdout || '').trim().split('\n').filter(Boolean).pop() || '{}';
    payload = JSON.parse(line);
  } catch {
    return { outcome: 'parse-error' };
  }

  if (payload.mode === 'ok') {
    try {
      if (fs.existsSync(flagAbs)) fs.unlinkSync(flagAbs);
    } catch {
      /* noop */
    }
    return { outcome: 'ok-reset', payload };
  }

  if (payload.mode !== 'over' || !payload.startLine) {
    return { outcome: 'not-over', payload };
  }

  let prev = '';
  try {
    if (fs.existsSync(flagAbs)) prev = fs.readFileSync(flagAbs, 'utf8').trim();
  } catch {
    /* noop */
  }
  if (prev === payload.startLine) {
    return { outcome: 'dup', payload };
  }

  fs.mkdirSync(path.join(root, 'logs'), { recursive: true });
  fs.writeFileSync(flagAbs, payload.startLine, 'utf8');

  const body = bodyFromPayload(payload);
  const n = desktopNotify(NOTIFY_TITLE, body, { repoRoot: root });
  return { outcome: 'alerted', payload, notifyMethod: n.method };
}
