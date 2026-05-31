#!/usr/bin/env node
/**
 * session-clock-watch.mjs — §51-6-2 時間軸をポーリングし、4 時間超を「教える」
 *
 * 通常は **Cursor `sessionStart` hook**（`.cursor/hooks/session-start-autopilot.mjs`）がバックグラウンド起動する。
 * 手動のとき: `npm run session:clock:watch`
 *
 * 環境変数:
 *   SESSION_CLOCK_WATCH_MS — ポーリング間隔 ms（既定 600000 = 10 分）
 *
 * 通知:
 *   - `scripts/lib/desktop-notify.mjs`（notify-send → gdbus → zenity → コンソールベル）
 *   - いずれの経路でも `logs/session-desktop-notify.log` に 1 行追記
 *   - 診断: `npm run session:notify-selftest`
 *   - Cursor 外の保険: `npm run session:clock:install-cron`（10 分ごと・WSL/Linux crontab）
 *
 * 同一「開始」行に対しては 1 回だけ通知（`logs/.session-clock-split-alerted`）。
 * `npm run session:clock:set` でフラグ解除済み。
 *
 * @see chat-sessions/SESSION-SPLIT-REMINDER.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_WATCH_MS } from './lib/session-clock-core.mjs';
import { pollSessionSplitAlertOnce } from './lib/session-clock-split-alert-once.mjs';
import { runNodeScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const intervalMs = Math.max(60_000, Number(process.env.SESSION_CLOCK_WATCH_MS || DEFAULT_WATCH_MS));
const pidPath = path.join(root, 'logs', '.session-clock-watch.pid');

function otherInstanceRunning() {
  if (!fs.existsSync(pidPath)) return false;
  const pid = Number(fs.readFileSync(pidPath, 'utf8').trim());
  if (!Number.isFinite(pid) || pid <= 0) {
    try {
      fs.unlinkSync(pidPath);
    } catch {
      /* noop */
    }
    return false;
  }
  if (pid === process.pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    try {
      fs.unlinkSync(pidPath);
    } catch {
      /* noop */
    }
    return false;
  }
}

if (otherInstanceRunning()) {
  console.log('[session-clock-watch] 既に別インスタンスが稼働中のため終了します。');
  process.exit(0);
}

fs.mkdirSync(path.join(root, 'logs'), { recursive: true });
fs.writeFileSync(pidPath, String(process.pid), 'utf8');

function cleanupPid() {
  try {
    if (fs.existsSync(pidPath)) {
      const cur = fs.readFileSync(pidPath, 'utf8').trim();
      if (cur === String(process.pid)) fs.unlinkSync(pidPath);
    }
  } catch {
    /* noop */
  }
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  try {
    process.on(sig, () => {
      cleanupPid();
      process.exit(0);
    });
  } catch {
    /* noop */
  }
}

function tick() {
  runNodeScriptSync(root, 'scripts/session-clock.mjs', ['write-ticker']);
  const r = pollSessionSplitAlertOnce({ root, source: 'watch' });
  if (r.outcome === 'parse-error') return;
  if (r.outcome === 'alerted') {
    if (r.notifyMethod === 'console-bell') {
      console.warn(
        `[session-clock-watch] 通知は GUI 経路なし（${r.notifyMethod}）。\`npm run session:notify-selftest\` で環境を確認。`,
      );
    }
    console.warn(`[session-clock-watch] 通知送信: 開始 ${r.payload?.startLine}（経過 ${r.payload?.elapsedHuman}）`);
  }
}

console.log(
  `[session-clock-watch] 起動: ${intervalMs}ms ごとに check-json。止める: Ctrl+C。ログ: logs/`,
);
tick();
setInterval(tick, intervalMs);
