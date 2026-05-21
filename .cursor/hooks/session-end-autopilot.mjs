#!/usr/bin/env node
/**
 * sessionEnd hook — Cursor 終了／Composer セッション終了時に壁時計を止める
 *
 * 1) session:clock:clear（開始: 未設定）
 * 2) session:clock:watch / session:clock:web プロセス停止
 *
 * @see docs/runbooks/session-clock-cursor-lifecycle.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stopAllClock } from '../../scripts/lib/session-clock-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const logDir = path.join(root, 'logs');
const logFile = path.join(logDir, 'session-end-hook.log');

function logLine(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line);
  } catch {
    /* noop */
  }
}

function main() {
  let input = {};
  try {
    const raw = fs.readFileSync(0, 'utf8');
    input = JSON.parse(raw || '{}');
  } catch {
    /* noop */
  }

  logLine(`sessionEnd session_id=${input.session_id ?? '?'} reason=${input.reason ?? '?'}`);

  const r = stopAllClock();
  logLine(
    `stopAll clearOk=${r.clearOk} watch=${r.watch} web=${r.web} msg=${r.clearMsg ?? ''}`,
  );

  const additional_context =
    '【自動・Cursor sessionEnd hook】壁時計を停止した（`session:clock:clear` ＋ watch/web プロセス終了）。' +
    ' Cursor を再度開いたときは sessionStart で set・watch・web が自動起動し URL が表示される。';

  process.stdout.write(`${JSON.stringify({ additional_context })}\n`);
  process.exit(0);
}

main();
