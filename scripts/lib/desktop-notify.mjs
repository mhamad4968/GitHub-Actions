/**
 * デスクトップ通知の多段フォールバック + 必ずディスクに1行残す。
 * 方針: **トーストよりポップアップ／ダイアログを優先**（目に入る UI）。
 * Linux: `DISPLAY` / `DBUS_SESSION_BUS_ADDRESS` を補完。WSL2 は **先に** Windows 側 `WScript.Shell.Popup`（システムモーダル）。
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

/** WSL2: Windows に **ダイアログ**（WScript.Shell.Popup）。64=情報 / 4096=システムモーダル（最前面寄り） */
function tryPowershellWslPopup(title, body) {
  const exe = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
  if (!fs.existsSync(exe)) return false;
  const t = sanitize(title, 120).replace(/'/g, "''");
  const b = sanitize(body, 400).replace(/'/g, "''");
  const flags = 64 + 4096;
  const ps = `$ws=New-Object -ComObject WScript.Shell;$ws.Popup('${b}',12,'${t}',${flags})|Out-Null`;
  const r = spawnSync(exe, ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', ps], {
    stdio: 'ignore',
    windowsHide: true,
    timeout: 22_000,
  });
  if (r.error) return false;
  return r.status === 0;
}

/** D-Bus 不調時に無限待ちしないよう短い timeout（超過時は子を SIGTERM） */
function tryNotifySend(title, body, env) {
  const r = spawnSync('notify-send', [title, body], { stdio: 'ignore', env, timeout: 4_000 });
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
    { stdio: 'ignore', env, timeout: 5_000 },
  );
  if (!r.error && r.status === 0) return true;
  return false;
}

/** モーダル風ダイアログ（timeout 秒で自動閉じ。OK クリックでも閉じる） */
function tryZenityDialog(title, body, env) {
  const t = sanitize(title, 200);
  const b = sanitize(body, 1200);
  const r = spawnSync(
    'zenity',
    ['--warning', '--title', t, '--text', b, '--timeout', '20', '--no-wrap'],
    { stdio: 'ignore', env, timeout: 25_000 },
  );
  if (r.error) return false;
  return [0, 1, 5].includes(Number(r.status));
}

function tryZenity(title, body, env) {
  const text = `${sanitize(title, 200)}\n${sanitize(body, 500)}`;
  const r = spawnSync('zenity', ['--notification', '--text', text], { stdio: 'ignore', env, timeout: 4_000 });
  if (!r.error && r.status === 0) return true;
  return false;
}

/** X11 の簡易ダイアログ（timeout 秒） */
function tryXmessage(title, body, env) {
  if (!env.DISPLAY) return false;
  const msg = `${sanitize(title, 200)}\n\n${sanitize(body, 700)}`;
  const r = spawnSync('xmessage', ['-center', '-timeout', '15', msg], {
    stdio: 'ignore',
    env,
    timeout: 20_000,
  });
  if (r.error) return false;
  return [0, 1, 11].includes(Number(r.status));
}

/** macOS: まず **ダイアログ**（自動で消える）、ダメなら通知トースト */
function tryDarwinDialog(title, body) {
  const esc = (s) =>
    sanitize(s, 600)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
  const t = esc(title);
  const b = esc(body);
  const r = spawnSync(
    'osascript',
    ['-e', `display dialog "${b}" with title "${t}" buttons {"OK"} default button "OK" giving up after 18`],
    { stdio: 'ignore', timeout: 22_000 },
  );
  return !r.error && r.status === 0;
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
  const flags = 64 + 4096;
  const ps = `$ws = New-Object -ComObject Wscript.Shell; $ws.Popup('${sanitize(body, 400).replace(/'/g, "''")}', 12, '${sanitize(title, 120).replace(/'/g, "''")}', ${flags}) | Out-Null`;
  const r = spawnSync('powershell', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', ps], {
    stdio: 'ignore',
    windowsHide: true,
    timeout: 20_000,
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
    if (isWsl() && tryPowershellWslPopup(t0, b0)) {
      ok = true;
      method = 'powershell-wsl-popup';
    } else if (tryNotifySend(t0, b0, env)) {
      ok = true;
      method = 'notify-send';
    } else if (tryGdbusNotify(t0, b0, env)) {
      ok = true;
      method = 'gdbus-session';
    } else if (tryZenityDialog(t0, b0, env)) {
      ok = true;
      method = 'zenity-dialog';
    } else if (tryZenity(t0, b0, env)) {
      ok = true;
      method = 'zenity-notification';
    } else if (tryXmessage(t0, b0, env)) {
      ok = true;
      method = 'xmessage';
    } else if (!isWsl() && tryPowershellWslPopup(t0, b0)) {
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
    if (tryDarwinDialog(t0, b0)) {
      ok = true;
      method = 'osascript-dialog';
    } else if (tryDarwin(t0, b0)) {
      ok = true;
      method = 'osascript-notification';
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
