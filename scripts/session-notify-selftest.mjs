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
  '\n【通知の出どころ（ダイアログ／ポップアップ優先）】\n' +
    '・`powershell-wsl-popup`: **WSL2 で最優先**。Windows の **モーダル風ダイアログ**（WScript.Shell.Popup / 約12秒）。\n' +
    '・`zenity-dialog` / `xmessage`: Linux の **ウィンドウダイアログ**（timeout で自動閉じ）。\n' +
    '・`osascript-dialog` (macOS): **ネイティブダイアログ**（自動で消える）。\n' +
    '・`notify-send` / `gdbus` / `zenity-notification`: **トースト／バルーン**（補助）。\n' +
    '・`console-bell`: **GUI なし**。**必ず** `logs/session-desktop-notify.log` に 1 行。',
);
if (which('notify-send') && r.method === 'console-bell') {
  console.log(
    '\n補足: すべての GUI 経路が失敗したときだけ `console-bell`。WSL2 なら通常は `powershell-wsl-popup` が先に当たる（`/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`）。',
  );
}
console.log('\n最後まで GUI が無いとき: `sudo apt install libnotify-bin`（未導入時）/ Windows の通知設定 / `logs/session-desktop-notify.log` で履歴確認。');
process.exit(0);
