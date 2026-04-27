/**
 * §51-6-2 壁時計: check-json を1回だけ評価し、4h 超なら通知（同一開始行は1回だけ）。
 * session-clock-watch と cron から共有する。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { desktopNotify } from './desktop-notify.mjs';

/** 短いタイトル／本文（ポップアップ・ダイアログ向け） */
const NOTIFY_TITLE = '§51-6-2: 4時間超 → 新Composer';

function bodyFromPayload(payload) {
  return `開始 ${payload.startLine}（${payload.elapsedHuman ?? '4h+'}）→ 新しい Composer を開き直すと時計リセット。詳細: SESSION-SPLIT-REMINDER.md`;
}

function appendSplitAudit(root, entry) {
  try {
    fs.mkdirSync(path.join(root, 'logs'), { recursive: true });
    fs.appendFileSync(
      path.join(root, 'logs', 'session-split-notify-audit.jsonl'),
      `${JSON.stringify(entry)}\n`,
      'utf8',
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {{ root: string, source?: 'watch'|'cron'|'unknown' }} opts
 * @returns {{
 *   outcome: 'parse-error'|'ok-reset'|'not-over'|'dup'|'alerted',
 *   payload?: object,
 *   notifyMethod?: string,
 * }}
 */
export function pollSessionSplitAlertOnce(opts) {
  const { root } = opts;
  const source = opts.source ?? 'unknown';
  const ts = new Date().toISOString();

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
    appendSplitAudit(root, {
      ts,
      source,
      outcome: 'dup',
      startLine: payload.startLine,
      note: 'same startLine already alerted; skip second UI',
    });
    return { outcome: 'dup', payload };
  }

  fs.mkdirSync(path.join(root, 'logs'), { recursive: true });
  fs.writeFileSync(flagAbs, payload.startLine, 'utf8');

  const body = bodyFromPayload(payload);
  const n = desktopNotify(NOTIFY_TITLE, body, { repoRoot: root });
  appendSplitAudit(root, {
    ts,
    source,
    outcome: 'alerted',
    startLine: payload.startLine,
    notifyMethod: n.method,
  });
  return { outcome: 'alerted', payload, notifyMethod: n.method };
}
