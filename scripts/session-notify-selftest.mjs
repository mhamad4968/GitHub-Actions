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
    '・`notify-send` / `gdbus` が効いたとき: **WSLg** なら多くの環境で **Windows 11 の通知**（画面右下のトースト）。Linux デスクトップ単体なら GNOME/KDE 等の通知領域。\n' +
    '・`console-bell`: **GUI には出ない**。ターミナルへのベル（無音のこともある）。**必ず** `logs/session-desktop-notify.log` に 1 行残る。',
);
if (which('notify-send') && r.method === 'console-bell') {
  console.log(
    '\n補足: `notify-send` はあるが今回は失敗（**D-Bus セッション**が無い等）。`export DISPLAY=:0` 済みでも起きる。Windows 側で WSL アプリの通知がオフになっていないか確認。',
  );
}
console.log('\nGUI が出なかった場合: `sudo apt install libnotify-bin`（未導入時）/ WSL の更新・Windows 側の通知設定を確認。ログだけでも履歴は残ります。');
process.exit(0);
