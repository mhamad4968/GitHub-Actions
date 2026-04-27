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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pingScript = path.join(root, 'scripts', 'session-split-cron-ping.mjs');
const MARKER = '# kintone-ai-lab session-split-cron (do not edit this line by hand; use npm run session:clock:uninstall-cron)';

/** cron 用の node。KINTONE_AI_LAB_NODE → login shell の node → ~/.nvm 最新 → 実行中 node（Cursor 同梱は最後） */
function resolveNodeForCron() {
  const envNode = process.env.KINTONE_AI_LAB_NODE;
  if (envNode && fs.existsSync(envNode)) return path.resolve(envNode);

  const sh = spawnSync('bash', ['-lc', 'command -v node 2>/dev/null || true'], { encoding: 'utf8' });
  const fromShell = ((sh.stdout || '').trim().split('\n')[0] || '').trim();
  if (fromShell && fs.existsSync(fromShell) && !fromShell.includes('.cursor-server')) return fromShell;

  const nvmNode = pickLatestNvmNode();
  if (nvmNode) return nvmNode;

  return process.execPath;
}

function pickLatestNvmNode() {
  const base = path.join(os.homedir(), '.nvm', 'versions', 'node');
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base)
    .map((d) => d.replace(/^v/, ''))
    .filter((d) => /^\d+\.\d+\.\d+/.test(d));
  if (!dirs.length) return null;
  dirs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const latest = dirs[dirs.length - 1];
  const p = path.join(base, `v${latest}`, 'bin', 'node');
  return fs.existsSync(p) ? p : null;
}

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
  console.log('[install-session-clock-cron] crontab は既に同じ内容のため変更なし。');
  console.log(`  node: ${nodeBin}`);
  console.log('  確認: crontab -l | grep session-split');
  process.exit(0);
}

writeCrontab(newTab);
console.log('[install-session-clock-cron] ✅ crontab を更新しました（10 分ごと・§51-6-2 通知）。');
console.log(`  node: ${nodeBin}`);
console.log(`  repo: ${root}`);
console.log('  確認: crontab -l | grep kintone-ai-lab');
console.log('  削除: npm run session:clock:uninstall-cron');
console.log('  補足: WSL は **cron デーモン起動**が必要なことがあります（`sudo service cron start` / `sudo apt install -y cron`）。');
process.exit(0);

/** @param {string} p */
function shellQuote(p) {
  if (!/[^a-zA-Z0-9/._+=:@-]/.test(p)) return p;
  return `'${p.replace(/'/g, `'\\''`)}'`;
}
