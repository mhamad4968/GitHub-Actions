#!/usr/bin/env node
/**
 * sessionEnd hook — Cursor 終了／Composer セッション終了時に壁時計を止める
 *
 * 1) session:clock:clear（開始: 未設定）
 * 2) session:clock:watch / session:clock:web プロセス停止
 *
 * @see docs/runbooks/session-clock-cursor-lifecycle.md
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stopAllClock } from '../../scripts/lib/session-clock-process.mjs';
import { readSessionClockMode } from '../../scripts/lib/session-clock-mode.mjs';

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

  let handoffMsg = '';
  try {
    const cfgPath = path.join(root, 'data/cursor-env-config.json');
    const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
    if (cfg.sessionEndHandoffExport === true) {
      execSync('npm run cio:session:export-handoff', {
        cwd: root,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 20000,
      });
      handoffMsg = ' handoff-export=OK';
      logLine('handoff export OK');
      if (cfg.sessionEndHandoffRollup === true) {
        execSync('npm run cio:checkpoint:rollup -- --keep 8', {
          cwd: root,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000,
        });
        logLine('checkpoint rollup OK');
        handoffMsg += ' rollup=OK';
      }
    }
  } catch (e) {
    logLine(`handoff export skip/fail: ${e.message || e}`);
    handoffMsg = ' handoff-export=skip';
  }

  const r = stopAllClock();
  logLine(
    `stopAll clearOk=${r.clearOk} watch=${r.watch} web=${r.web} msg=${r.clearMsg ?? ''}`,
  );

  const mode = readSessionClockMode(root);
  const additional_context =
    '【自動・Cursor sessionEnd hook】壁時計を停止した（`session:clock:clear` ＋ watch/web プロセス終了）。' +
    handoffMsg +
    (mode.mode === 'manual-desktop'
      ? ' 次回は **Desktop `壁時計_START.bat`** で再起動。'
      : ' Cursor を再度開いたときは sessionStart で set・watch・web が自動起動し URL が表示される。');

  process.stdout.write(`${JSON.stringify({ additional_context })}\n`);
  process.exit(0);
}

main();
