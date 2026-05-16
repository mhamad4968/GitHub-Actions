#!/usr/bin/env node
/**
 * §51-6-2 壁時計まわりの **ワンショット健康診断**（hooks / crontab / watch pid / ログ先頭）。
 *   npm run session:clock:health
 *   npm run session:clock:health -- --json
 *   npm run session:clock:health -- --strict   # crontab node ドリフト・hooks 欠落で exit 2
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readCrontabText,
  findSessionSplitCronLine,
  extractNodeFromCronLine,
  resolveNodeForCron,
} from './lib/session-clock-cron-node.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = process.argv.includes('--json');
const strict = process.argv.includes('--strict');

function readHooks() {
  const p = path.join(root, '.cursor', 'hooks.json');
  if (!fs.existsSync(p)) return { ok: false, detail: 'missing .cursor/hooks.json' };
  const t = fs.readFileSync(p, 'utf8');
  const needles = ['sessionStart', 'session-start-autopilot.mjs', 'session:clock:set'];
  const missing = needles.filter((n) => !t.includes(n));
  if (missing.length) return { ok: false, detail: `hooks.json missing: ${missing.join(', ')}` };
  return { ok: true, detail: 'hooks.json OK' };
}

function readClockStart() {
  const p = path.join(root, 'chat-sessions', 'SESSION-CLOCK.md');
  if (!fs.existsSync(p)) return { line: '(no file)', mode: 'missing' };
  const raw = fs.readFileSync(p, 'utf8');
  const m = raw.match(/^\s*開始:\s*(.+)$/m);
  const line = m ? m[1].trim() : '(no 開始 line)';
  const mode = /未設定|TBD/i.test(line) ? 'unset' : 'set';
  return { line, mode };
}

function watchPidStatus() {
  const pidPath = path.join(root, 'logs', '.session-clock-watch.pid');
  if (!fs.existsSync(pidPath)) return { alive: false, pid: null, detail: 'no pid file' };
  const pid = Number(fs.readFileSync(pidPath, 'utf8').trim());
  if (!Number.isFinite(pid) || pid <= 0) return { alive: false, pid, detail: 'invalid pid' };
  try {
    process.kill(pid, 0);
    return { alive: true, pid, detail: 'process responds' };
  } catch {
    try {
      fs.unlinkSync(pidPath);
    } catch {
      /* noop */
    }
    return { alive: false, pid, detail: 'stale pid (pid file removed)' };
  }
}

function tailLog(rel, max = 400) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return '(no file)';
  const s = fs.readFileSync(p, 'utf8');
  return s.length > max ? `…${s.slice(-max)}` : s;
}

const tab = readCrontabText();
const cronLine = findSessionSplitCronLine(tab);
const cronNode = cronLine ? extractNodeFromCronLine(cronLine) : null;
const pinPath = path.join(root, 'logs', '.session-clock-install-node');
let expectedNode = path.resolve(resolveNodeForCron());
let expectedNodeSource = 'resolve';
try {
  if (fs.existsSync(pinPath)) {
    const p = fs.readFileSync(pinPath, 'utf8').trim().split('\n')[0]?.trim();
    if (p) {
      if (process.platform === 'win32' && p.startsWith('/')) {
        expectedNode = p;
        expectedNodeSource = 'install-pin';
      } else if (fs.existsSync(p)) {
        expectedNode = path.resolve(p);
        expectedNodeSource = 'install-pin';
      }
    }
  }
} catch {
  /* noop */
}
/** WSL crontab の POSIX node パスを Windows の path.resolve で壊さない */
function normalizeCronNodeForCompare(nodePath) {
  if (!nodePath) return null;
  const trimmed = String(nodePath).trim();
  if (process.platform === 'win32' && trimmed.startsWith('/')) return trimmed;
  return path.resolve(trimmed);
}
const cronNodeResolved = cronNode ? normalizeCronNodeForCompare(cronNode) : null;
const drift =
  cronLine && cronNodeResolved
    ? cronNodeResolved !== expectedNode
    : false;

const warnings = [];
if (drift && !strict) warnings.push('crontab の node と install 想定が不一致（`npm run session:clock:install-cron` 推奨）');
if (!cronLine && !strict) warnings.push('session-split の crontab 行がありません（任意: `npm run session:clock:install-cron`）');

const hooks = readHooks();
let exitOk = hooks.ok;
if (strict) {
  exitOk = exitOk && Boolean(cronLine) && !drift;
}

const report = {
  ok: exitOk,
  strict,
  warnings,
  hooks,
  sessionClock: readClockStart(),
  watchPid: watchPidStatus(),
  cron: {
    hasLine: Boolean(cronLine),
    nodeInCron: cronNode,
    nodeExpected: expectedNode,
    nodeExpectedSource: expectedNodeSource,
    drift,
    linePreview: cronLine ? `${cronLine.slice(0, 120)}…` : null,
  },
  logs: {
    cronPingTail: tailLog('logs/session-cron-ping.log', 500),
  },
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('=== session:clock:health ===\n');
  console.log(`hooks: ${report.hooks.ok ? '✅' : '❌'} ${report.hooks.detail}`);
  console.log(`SESSION-CLOCK 開始: [${report.sessionClock.mode}] ${report.sessionClock.line}`);
  console.log(
    `watch pid: ${report.watchPid.alive ? '✅' : '⚠'} ${report.watchPid.detail}${report.watchPid.pid != null ? ` (pid ${report.watchPid.pid})` : ''}`,
  );
  console.log(`crontab session-split: ${cronLine ? '✅ 行あり' : '⚠ 行なし'}`);
  if (cronLine) {
    console.log(`  cron node: ${cronNodeResolved ?? '(parse失敗)'}`);
    console.log(`  期待 node: ${expectedNode}（${expectedNodeSource}）`);
    console.log(`  ドリフト: ${drift ? '❌ YES（npm run session:clock:install-cron を再実行）' : '✅ なし'}`);
  }
  if (warnings.length) {
    console.log('\n⚠ 警告:');
    for (const w of warnings) console.log(`  - ${w}`);
  }
  console.log('\n--- logs/session-cron-ping.log (末尾) ---\n', report.logs.cronPingTail, '\n');
  console.log(exitOk ? '\n✅ health OK' : '\n❌ health NG（--strict または hooks 失敗）');
}

const code = exitOk ? 0 : 2;
if (strict && !exitOk) {
  console.error('\n[session-clock-health] --strict: hooks 欠落 / crontab 無し / node ドリフトのいずれかで NG');
} else if (!hooks.ok) {
  console.error('\n[session-clock-health] hooks.json が不正です');
}
process.exit(code);
