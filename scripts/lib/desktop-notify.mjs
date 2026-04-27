/**
 * デスクトップ通知の多段フォールバック + 必ずディスクに1行残す。
 * notify-send が無い WSL / 最小 Linux でも「何が効いたか」を後から追える。
 * Linux: `DISPLAY` / `DBUS_SESSION_BUS_ADDRESS`（`/run/user/<uid>/bus`）を補完 → 失敗時 WSL なら `powershell.exe` 小窓。
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

/** Cursor 内蔵ターミナル等で DBUS が無いとき、systemd ユーザーソケットを補う */
function linuxNotifyEnv() {
  const e = { ...process.env };
  if (!e.DISPLAY) e.DISPLAY = ':0';
  try {
    if (!e.DBUS_SESSION_BUS_ADDRESS && typeof process.getuid === 'function') {
      const uid = process.getuid();
      const bus = `/run/user/${uid}/bus`;
      if (fs.existsSync(bus)) e.DBUS_SESSION_BUS_ADDRESS = `unix:path=${bus}`;
    }
  } catch {
    /* noop */
  }
  return e;
}

function isWsl() {
  try {
    return /microsoft/i.test(fs.readFileSync('/proc/version', 'utf8'));
  } catch {
    return false;
  }
}

/** WSL2: Linux 側の通知が通らないとき、Windows に小さなダイアログを出す（powershell.exe 経由） */
function tryPowershellWslPopup(title, body) {
  const exe = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
  if (!fs.existsSync(exe)) return false;
  const t = sanitize(title, 120).replace(/'/g, "''");
  const b = sanitize(body, 400).replace(/'/g, "''");
  const ps = `$ws=New-Object -ComObject WScript.Shell;$ws.Popup('${b}',8,'${t}',64)|Out-Null`;
  const r = spawnSync(exe, ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', ps], {
    stdio: 'ignore',
    windowsHide: true,
  });
  return !r.error && r.status === 0;
}

function tryNotifySend(title, body, env) {
  const r = spawnSync('notify-send', [title, body], { stdio: 'ignore', env });
  if (!r.error && r.status === 0) return true;
  return false;
}

/** D-Bus org.freedesktop.Notifications（notify-send が無くても GNOME 等で動くことがある） */
function tryGdbusNotify(title, body, env) {
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
    { stdio: 'ignore', env },
  );
  if (!r.error && r.status === 0) return true;
  return false;
}

function tryZenity(title, body, env) {
  const text = `${sanitize(title, 200)}\n${sanitize(body, 500)}`;
  const r = spawnSync('zenity', ['--notification', '--text', text], { stdio: 'ignore', env });
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
    const env = linuxNotifyEnv();
    if (tryNotifySend(t0, b0, env)) {
      ok = true;
      method = 'notify-send';
    } else if (tryGdbusNotify(t0, b0, env)) {
      ok = true;
      method = 'gdbus-session';
    } else if (tryZenity(t0, b0, env)) {
      ok = true;
      method = 'zenity';
    } else if (isWsl() && tryPowershellWslPopup(t0, b0)) {
      ok = true;
      method = 'powershell-wsl-popup';
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
