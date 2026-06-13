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
import { runNpmScriptSync } from '../../scripts/lib/win-hidden-spawn.mjs';
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
      const handoff = runNpmScriptSync(root, 'cio:session:export-handoff', [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      if (handoff.status !== 0) {
        throw new Error((handoff.stderr || handoff.stdout || '').slice(0, 400) || `exit=${handoff.status}`);
      }
      handoffMsg = ' handoff-export=OK';
      logLine('handoff export OK');
      if (cfg.sessionEndHandoffRollup === true) {
        const rollup = runNpmScriptSync(root, 'cio:checkpoint:rollup', ['--', '--keep', '8'], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        if (rollup.status !== 0) {
          throw new Error((rollup.stderr || rollup.stdout || '').slice(0, 400) || `exit=${rollup.status}`);
        }
        logLine('checkpoint rollup OK');
        handoffMsg += ' rollup=OK';
      }
    }
  } catch (e) {
    logLine(`handoff export skip/fail: ${e.message || e}`);
    handoffMsg = ' handoff-export=skip';
  }

  let clockStopMsg = '';
  const mode = readSessionClockMode(root);
  const skipClockStop =
    mode.trialPaused === true || mode.mode === 'manual-desktop';
  if (skipClockStop) {
    const reason = mode.trialPaused
      ? 'trialPaused=true — 壁時計試験停止中'
      : 'manual-desktop — Desktop bat 運用（Composer 終了で壁時計は止めない）';
    logLine(`stopAll skip (${reason})`);
    clockStopMsg =
      mode.trialPaused
        ? ' 壁時計 hook 停止は **試験中スキップ**（`.cio/session-clock-mode.json` trialPaused）。'
        : ' 壁時計 hook 停止は **manual-desktop のためスキップ**（停止は `壁時計_STOP.bat` または Cursor 完全終了時の手動）。';
  } else {
    const r = stopAllClock();
    logLine(
      `stopAll clearOk=${r.clearOk} watch=${r.watch} web=${r.web} msg=${r.clearMsg ?? ''}`,
    );
    clockStopMsg =
      '【自動・Cursor sessionEnd hook】壁時計を停止した（`session:clock:clear` ＋ watch/web プロセス終了）。';
  }

  const additional_context =
    clockStopMsg +
    handoffMsg +
    (mode.mode === 'manual-desktop'
      ? ' 次回は **Desktop `壁時計_START.bat`** で再起動。'
      : ' Cursor を再度開いたときは sessionStart で set・watch・web が自動起動し URL が表示される。');

  process.stdout.write(`${JSON.stringify({ additional_context })}\n`);
  process.exit(0);
}

main();
