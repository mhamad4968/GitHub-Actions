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

console.log('\nテスト通知を送ります（1 回）…');
const r = desktopNotify(
  'kintone-ai-lab 通知テスト',
  'session:notify-selftest が正常に動いています。この行は logs/session-desktop-notify.log にも記録されます。',
  { repoRoot: root },
);
console.log(`結果: ok=${r.ok} method=${r.method}`);
if (which('notify-send') && r.method === 'console-bell') {
  console.log(
    '\n補足: `notify-send` はあるが今回は失敗（多くは **DISPLAY 未設定** / D-Bus セッション無し）。Cursor 内蔵ターミナルや WSLg 有効端末で再実行すると GUI 経路になることがあります。',
  );
}
console.log('\nGUI が出なかった場合: WSL なら `sudo apt install libnotify-bin` や Windows 側ターミナル連携を確認。ログだけでも履歴は残ります。');
process.exit(0);
