/**
 * デスクトップ通知の多段フォールバック + 必ずディスクに1行残す。
 * notify-send が無い WSL / 最小 Linux でも「何が効いたか」を後から追える。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, '..', '..');

function sanitize(s, max = 800) {
  const t = String(s ?? '')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function appendLog(root, record) {
  const dir = path.join(root, 'logs');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, 'session-desktop-notify.log'),
      `${JSON.stringify(record)}\n`,
      'utf8',
    );
  } catch {
    /* noop */
  }
}

function tryNotifySend(title, body) {
  const r = spawnSync('notify-send', [title, body], { stdio: 'ignore' });
  if (!r.error && r.status === 0) return true;
  return false;
}

/** D-Bus org.freedesktop.Notifications（notify-send が無くても GNOME 等で動くことがある） */
function tryGdbusNotify(title, body) {
  const t = sanitize(title, 200);
  const b = sanitize(body, 400);
  const r = spawnSync(
    'gdbus',
    [
      'call',
      '--session',
      '--dest',
      'org.freedesktop.Notifications',
      '--object-path',
      '/org/freedesktop/Notifications',
      '--method',
      'org.freedesktop.Notifications.Notify',
      'kintone-ai-lab',
      '0',
      '',
      t,
      b,
      '[]',
      '{}',
      '15000',
    ],
    { stdio: 'ignore' },
  );
  if (!r.error && r.status === 0) return true;
  return false;
}

function tryZenity(title, body) {
  const text = `${sanitize(title, 200)}\n${sanitize(body, 500)}`;
  const r = spawnSync('zenity', ['--notification', '--text', text], { stdio: 'ignore' });
  if (!r.error && r.status === 0) return true;
  return false;
}

function tryDarwin(title, body) {
  const t = sanitize(title, 200).replace(/"/g, '\\"');
  const b = sanitize(body, 500).replace(/"/g, '\\"');
  const r = spawnSync('osascript', ['-e', `display notification "${b}" with title "${t}"`], {
    stdio: 'ignore',
  });
  if (!r.error && r.status === 0) return true;
  return false;
}

function tryWin32Popup(title, body) {
  const ps = `$ws = New-Object -ComObject Wscript.Shell; $ws.Popup('${sanitize(body, 400).replace(/'/g, "''")}', 5, '${sanitize(title, 120).replace(/'/g, "''")}', 64) | Out-Null`;
  const r = spawnSync('powershell', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', ps], {
    stdio: 'ignore',
    windowsHide: true,
  });
  if (!r.error && r.status === 0) return true;
  return false;
}

/**
 * @param {string} title
 * @param {string} body
 * @param {{ repoRoot?: string, silentConsole?: boolean }} [opts]
 * @returns {{ ok: boolean, method: string }}
 */
export function desktopNotify(title, body, opts = {}) {
  const root = opts.repoRoot ?? DEFAULT_ROOT;
  const t0 = sanitize(title, 300);
  const b0 = sanitize(body, 2000);
  let method = 'none';
  let ok = false;

  if (process.platform === 'linux') {
    if (tryNotifySend(t0, b0)) {
      ok = true;
      method = 'notify-send';
    } else if (tryGdbusNotify(t0, b0)) {
      ok = true;
      method = 'gdbus-session';
    } else if (tryZenity(t0, b0)) {
      ok = true;
      method = 'zenity';
    } else {
      if (!opts.silentConsole) {
        console.log(`\x07[desktop-notify] ${t0}: ${b0}`);
      }
      method = 'console-bell';
      ok = true;
    }
  } else if (process.platform === 'darwin') {
    if (tryDarwin(t0, b0)) {
      ok = true;
      method = 'osascript';
    } else if (!opts.silentConsole) {
      console.log(`\x07[desktop-notify] ${t0}: ${b0}`);
      method = 'console-bell';
      ok = true;
    }
  } else if (process.platform === 'win32') {
    if (tryWin32Popup(t0, b0)) {
      ok = true;
      method = 'powershell-popup';
    } else if (!opts.silentConsole) {
      console.log(`\x07[desktop-notify] ${t0}: ${b0}`);
      method = 'console-bell';
      ok = true;
    }
  } else {
    if (!opts.silentConsole) {
      console.log(`\x07[desktop-notify] ${t0}: ${b0}`);
    }
    method = 'console-bell';
    ok = true;
  }

  appendLog(root, {
    ts: new Date().toISOString(),
    title: t0,
    body: b0,
    method,
    ok,
    platform: process.platform,
  });

  return { ok, method };
}
