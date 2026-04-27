#!/usr/bin/env node
/**
 * この PC の WSL/Linux **ユーザー crontab** に §51-6-2 の定期チェックを1行追加する。
 *   npm run session:clock:install-cron
 *   npm run session:clock:uninstall-cron
 *
 * Cursor が閉じていても 10 分ごとに session-split-cron-ping が走る（watch と二重でも抑止フラグは共有）。
 * Node 固定: 環境変数 **KINTONE_AI_LAB_NODE**（絶対パス）を最優先。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveNodeForCron } from './lib/session-clock-cron-node.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pingScript = path.join(root, 'scripts', 'session-split-cron-ping.mjs');
const MARKER = '# kintone-ai-lab session-split-cron (do not edit this line by hand; use npm run session:clock:uninstall-cron)';

function readCrontab() {
  const r = spawnSync('crontab', ['-l'], { encoding: 'utf8' });
  if (r.status !== 0) {
    const err = `${r.stderr || ''}`.toLowerCase();
    if (err.includes('no crontab') || err.includes('cannot open')) return '';
    console.error('[install-session-clock-cron] crontab -l failed:', r.stderr || r.status);
    process.exit(2);
  }
  return r.stdout || '';
}

function writeCrontab(content) {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cron-')), 'tab');
  fs.writeFileSync(tmp, content, 'utf8');
  const r = spawnSync('crontab', [tmp], { encoding: 'utf8' });
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* noop */
  }
  if (r.status !== 0) {
    console.error('[install-session-clock-cron] crontab install failed:', r.stderr || r.status);
    process.exit(2);
  }
}

const uninstall = process.argv.includes('--uninstall');

if (process.platform === 'win32') {
  console.error(
    '[install-session-clock-cron] Windows ネイティブでは未対応。WSL 内で `npm run session:clock:install-cron` を実行してください。',
  );
  process.exit(2);
}

const whichCron = spawnSync('command', ['-v', 'crontab'], { shell: true, encoding: 'utf8' });
if (!whichCron.stdout?.trim()) {
  console.error('[install-session-clock-cron] crontab が見つかりません（cronie / busybox 等をインストール）。');
  process.exit(2);
}

let tab = readCrontab();
const lines = tab.split(/\r?\n/).filter((l) => l.length > 0);
const filtered = lines.filter((l) => !l.includes(MARKER) && !l.includes('session-split-cron-ping.mjs'));

if (uninstall) {
  const newTab = filtered.length ? `${filtered.join('\n')}\n` : '';
  writeCrontab(newTab);
  try {
    fs.unlinkSync(path.join(root, 'logs', '.session-clock-install-node'));
  } catch {
    /* noop */
  }
  console.log('[install-session-clock-cron] ✅ 削除済み（session-split-cron の行を除去）');
  process.exit(0);
}

const nodeBin = resolveNodeForCron();
if (nodeBin.includes('.cursor-server')) {
  console.warn(
    '[install-session-clock-cron] ⚠ node が Cursor 同梱パスです。cron から消える可能性があります。`export KINTONE_AI_LAB_NODE=/path/to/node` を付けて再実行するか、通常のターミナルから `npm run session:clock:install-cron` してください。',
  );
}

// 10 分ごと。ログは logs/session-cron-ping.log。cron は通常 DISPLAY 無しのため WSLg では :0 を既定にする。
const displayForCron =
  process.platform !== 'win32' ? process.env.DISPLAY || process.env.SESSION_CLOCK_CRON_DISPLAY || ':0' : '';
const displayPrefix = displayForCron ? `DISPLAY=${shellQuote(displayForCron)} ` : '';

// 10 分ごと。ログは logs/session-cron-ping.log
const cronLine = `*/10 * * * * ${displayPrefix}cd ${shellQuote(root)} && ${shellQuote(nodeBin)} ${shellQuote(pingScript)} >> ${shellQuote(path.join(root, 'logs', 'session-cron-ping.log'))} 2>&1 ${MARKER}`;

const newTab = `${filtered.join('\n')}${filtered.length ? '\n' : ''}${cronLine}\n`;
const norm = (s) => s.replace(/\r\n/g, '\n').trimEnd();
if (norm(tab) === norm(newTab)) {
  writeInstallNodePin(root, nodeBin);
  console.log('[install-session-clock-cron] crontab は既に同じ内容のため変更なし。');
  console.log(`  node: ${nodeBin}`);
  console.log('  確認: crontab -l | grep session-split');
  process.exit(0);
}

writeCrontab(newTab);
writeInstallNodePin(root, nodeBin);
console.log('[install-session-clock-cron] ✅ crontab を更新しました（10 分ごと・§51-6-2 通知）。');
console.log(`  node: ${nodeBin}`);
console.log(`  repo: ${root}`);
console.log('  確認: crontab -l | grep kintone-ai-lab');
console.log('  削除: npm run session:clock:uninstall-cron');
console.log('  補足: WSL は **cron デーモン起動**が必要なことがあります（`sudo service cron start` / `sudo apt install -y cron`）。');
process.exit(0);

function writeInstallNodePin(repoRoot, nodeBinPath) {
  try {
    fs.mkdirSync(path.join(repoRoot, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'logs', '.session-clock-install-node'), `${nodeBinPath}\n`, 'utf8');
  } catch {
    /* noop */
  }
}

/** @param {string} p */
function shellQuote(p) {
  if (!/[^a-zA-Z0-9/._+=:@-]/.test(p)) return p;
  return `'${p.replace(/'/g, `'\\''`)}'`;
}
