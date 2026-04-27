#!/usr/bin/env node
/**
 * デスクトップ通知チェーンの自己診断（インストール不足の把握用）。
 *   npm run session:notify-selftest
 */
import { accessSync, constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { desktopNotify } from './lib/desktop-notify.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function which(cmd) {
  const r = spawnSync('command', ['-v', cmd], { shell: true, encoding: 'utf8' });
  return (r.stdout || '').trim() || null;
}

const rows = [
  ['platform', process.platform],
  ['notify-send', which('notify-send') || '(なし — apt: libnotify-bin)'],
  ['gdbus', which('gdbus') || '(なし — 多くのデスクトップで libnotify と同梱)'],
  ['zenity', which('zenity') || '(なし)'],
];

console.log('=== session:notify-selftest（通知経路の診断）===\n');
for (const [k, v] of rows) {
  console.log(`${k}: ${v}`);
}

try {
  accessSync(path.join(root, 'logs'), constants.W_OK);
  console.log(`logs/: 書込可 → ${path.join(root, 'logs', 'session-desktop-notify.log')}`);
} catch {
  console.log('logs/: 書込不可（リポルートで実行してください）');
}

if (process.platform === 'linux' && !process.env.DISPLAY) {
  process.env.DISPLAY = ':0';
  console.log('DISPLAY 未設定 → 診断のため `:0` を付与（WSLg 想定）。\n');
}

console.log('\nテスト通知を送ります（1 回）…');
const r = desktopNotify(
  'kintone-ai-lab 通知テスト',
  'session:notify-selftest が正常に動いています。この行は logs/session-desktop-notify.log にも記録されます。',
  { repoRoot: root },
);
console.log(`結果: ok=${r.ok} method=${r.method}`);

console.log(
  '\n【通知の出どころ】\n' +
    '・`notify-send` / `gdbus`: **WSLg** なら多くの環境で **Windows 11 のトースト**（右下）。純 Linux デスクトップなら GNOME/KDE 等。\n' +
    '・`powershell-wsl-popup`: **WSL2 専用フォールバック**。Linux 通知が通らないとき **Windows 側に小さなダイアログ**（WScript.Shell.Popup）。数秒で閉じる。\n' +
    '・`console-bell`: **GUI なし**（ベル・無音のことも）。**必ず** `logs/session-desktop-notify.log` に 1 行。',
);
if (which('notify-send') && r.method === 'console-bell') {
  console.log(
    '\n補足: `notify-send` はあるが最後まで失敗（D-Bus / WSL 連携）。`desktop-notify` は `/run/user/<uid>/bus` を補うが効かない環境もある。その場合は上記 `powershell-wsl-popup` に任せる（WSL2 + `/mnt/c/.../powershell.exe` 必須）。',
  );
}
console.log('\n最後まで GUI が無いとき: `sudo apt install libnotify-bin`（未導入時）/ Windows の通知設定 / `logs/session-desktop-notify.log` で履歴確認。');
process.exit(0);
