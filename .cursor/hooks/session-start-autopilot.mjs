#!/usr/bin/env node
/**
 * sessionStart hook — §51-6-2 の「1」「2」を人が忘れないよう自動化
 *
 * 1) `session:clock:set` … 新 Composer セッションのたびに SESSION-CLOCK.md を JST のいまに更新
 * 2) `session:clock:watch` … 未常駐ならバックグラウンドで起動（4h 超でデスクトップ通知）
 *
 * Cursor `sessionStart` は fire-and-forget。stdout の `additional_context` で AI に事実を注入する。
 *
 * @see chat-sessions/SESSION-SPLIT-REMINDER.md
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const logDir = path.join(root, 'logs');
const logFile = path.join(logDir, 'session-start-hook.log');

function logLine(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line);
  } catch {
    /* noop */
  }
}

function watchAlreadyRunning() {
  const pidPath = path.join(logDir, '.session-clock-watch.pid');
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

function main() {
  let input = {};
  try {
    const raw = fs.readFileSync(0, 'utf8');
    input = JSON.parse(raw || '{}');
  } catch {
    /* noop */
  }

  logLine(`sessionStart session_id=${input.session_id ?? '?'} composer_mode=${input.composer_mode ?? '?'}`);

  // --- 1) SESSION-CLOCK を JST で更新 ---
  const set = spawnSync('npm', ['run', 'session:clock:set'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  if (set.status !== 0) {
    logLine(`session:clock:set NG exit=${set.status} stderr=${(set.stderr || '').slice(0, 400)}`);
  } else {
    logLine('session:clock:set OK');
  }

  // --- 2) watch シングルトン ---
  let watchMsg = '';
  if (watchAlreadyRunning()) {
    watchMsg = '`session:clock:watch` は既に稼働中（`logs/.session-clock-watch.pid`）。';
    logLine('session:clock:watch skip (pid alive)');
  } else {
    const watchScript = path.join(root, 'scripts', 'session-clock-watch.mjs');
    const out = fs.openSync(path.join(logDir, 'session-clock-watch.log'), 'a');
    const child = spawn(process.execPath, [watchScript], {
      cwd: root,
      detached: true,
      stdio: ['ignore', out, out],
    });
    child.unref();
    logLine(`session:clock:watch spawned pid=${child.pid}`);
    watchMsg = '`session:clock:watch` をバックグラウンド起動した（ログ: `logs/session-clock-watch.log`）。';
  }

  const additional_context =
    '【自動・Cursor sessionStart hook】' +
    '`npm run session:clock:set` を実行済み（`chat-sessions/SESSION-CLOCK.md` の `開始:` を JST で更新）。' +
    watchMsg +
    ' 浜田が手で 1・2 を打つ必要は原則ありません（hook 無効時のみ手動）。';

  process.stdout.write(`${JSON.stringify({ additional_context })}\n`);
  process.exit(0);
}

main();
