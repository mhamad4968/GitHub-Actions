#!/usr/bin/env node
/**
 * WSL/Linux cron 用: 4h 超なら1回だけ通知（watch と同じ抑止フラグ）。
 * crontab 例: 10 分毎に `cd <repo> && <node> scripts/session-split-cron-ping.mjs`
 *
 * インストール: npm run session:clock:install-cron
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pollSessionSplitAlertOnce } from './lib/session-clock-split-alert-once.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logDir = path.join(root, 'logs');
const logFile = path.join(logDir, 'session-cron-ping.log');

function logLine(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line, 'utf8');
  } catch {
    /* noop */
  }
  process.stdout.write(line);
}

spawnSync(process.execPath, ['scripts/session-clock.mjs', 'write-ticker'], {
  cwd: root,
  encoding: 'utf8',
});
const r = pollSessionSplitAlertOnce({ root, source: 'cron' });

switch (r.outcome) {
  case 'parse-error':
    logLine('cron-ping parse-error (check-json)');
    process.exit(0);
  case 'ok-reset':
    logLine(`ok-reset start=${r.payload?.startLine ?? '?'}`);
    process.exit(0);
  case 'not-over':
    logLine(`not-over mode=${r.payload?.mode ?? '?'}`);
    process.exit(0);
  case 'dup':
    logLine(`dup skip start=${r.payload?.startLine}`);
    process.exit(0);
  case 'alerted':
    logLine(`ALERT start=${r.payload?.startLine} notify=${r.notifyMethod}`);
    process.exit(0);
  default:
    logLine('unknown outcome');
    process.exit(0);
}
