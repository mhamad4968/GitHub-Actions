#!/usr/bin/env node
/**
 * session-clock-watch.mjs — §51-6-2 時間軸をポーリングし、4 時間超を「教える」
 *
 * Cursor のチャット外でも動く **ローカル常駐**（別ターミナル）。AIの能力ではなく OS 上のプロセス。
 *
 *   npm run session:clock:watch
 *
 * 環境変数:
 *   SESSION_CLOCK_WATCH_MS — ポーリング間隔 ms（既定 120000 = 2 分）
 *
 * 通知:
 *   - Linux: notify-send（存在時）
 *   - macOS: osascript display notification
 *   - Windows: WScript.Shell.Popup（5 秒で閉じる）
 *
 * 同一「開始」行に対しては 1 回だけ通知（`logs/.session-clock-split-alerted`）。
 * `npm run session:clock:set` でフラグ解除済み。
 *
 * @see chat-sessions/SESSION-SPLIT-REMINDER.md
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const intervalMs = Math.max(15_000, Number(process.env.SESSION_CLOCK_WATCH_MS || 120_000));

function notify(title, body) {
  const t = title.replace(/"/g, '\\"');
  const b = body.replace(/"/g, '\\"').replace(/\n/g, ' ');
  if (process.platform === 'linux') {
    const r = spawnSync('notify-send', [title, body], { stdio: 'ignore' });
    if (r.error || r.status !== 0) {
      console.log(`\x07[session-clock-watch] ${title}: ${body}`);
    }
  } else if (process.platform === 'darwin') {
    spawnSync('osascript', [
      '-e',
      `display notification "${b}" with title "${t}"`,
    ], { stdio: 'ignore' });
  } else if (process.platform === 'win32') {
    const ps = `$ws = New-Object -ComObject Wscript.Shell; $ws.Popup('${body.replace(/'/g, "''")}', 5, '${title.replace(/'/g, "''")}', 64) | Out-Null`;
    spawnSync('powershell', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', ps], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } else {
    console.log(`\x07[session-clock-watch] ${title}: ${body}`);
  }
}

function tick() {
  const j = spawnSync(process.execPath, ['scripts/session-clock.mjs', 'check-json'], {
    cwd: root,
    encoding: 'utf8',
  });
  const flagAbs = path.join(root, 'logs', '.session-clock-split-alerted');
  let payload;
  try {
    payload = JSON.parse((j.stdout || '').trim().split('\n').filter(Boolean).pop() || '{}');
  } catch {
    return;
  }

  if (payload.mode === 'ok') {
    try {
      if (fs.existsSync(flagAbs)) fs.unlinkSync(flagAbs);
    } catch {
      /* noop */
    }
    return;
  }

  if (payload.mode !== 'over' || !payload.startLine) return;

  let prev = '';
  try {
    if (fs.existsSync(flagAbs)) prev = fs.readFileSync(flagAbs, 'utf8').trim();
  } catch {
    /* noop */
  }
  if (prev === payload.startLine) return;

  fs.mkdirSync(path.join(root, 'logs'), { recursive: true });
  fs.writeFileSync(flagAbs, payload.startLine, 'utf8');

  notify(
    '§51-6-2 セッション切替時刻',
    `同一セッション開始から ${payload.elapsedHuman ?? '4h+'} 経過（開始 ${payload.startLine} JST）。新チャットで区切り、npm run session:clock:set を実行してください。`,
  );
  console.warn(`[session-clock-watch] 通知送信: 開始 ${payload.startLine}（経過 ${payload.elapsedHuman}）`);
}

console.log(
  `[session-clock-watch] 起動: ${intervalMs}ms ごとに check-json。止める: Ctrl+C。ログ: logs/`,
);
tick();
setInterval(tick, intervalMs);
