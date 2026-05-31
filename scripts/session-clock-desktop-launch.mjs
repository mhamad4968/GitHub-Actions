#!/usr/bin/env node
/**
 * Desktop bat から壁時計を起動（Windows 手動運用・フラッシュ抑止）
 *   node scripts/session-clock-desktop-launch.mjs
 *   node scripts/session-clock-desktop-launch.mjs --stop
 *
 * START.bat は VBS 経由で本スクリプト完了まで待機 → WEB 起動＋ブラウザ表示後に終了。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readSessionClockMode } from './lib/session-clock-mode.mjs';
import {
  paths,
  readWebUrl,
  repoRoot,
  spawnWatch,
  spawnWebServer,
  stopAllClock,
  stopWatchAndWeb,
} from './lib/session-clock-process.mjs';
import { hiddenOpts, openUrlInBrowser, runNodeScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stop = process.argv.includes('--stop');
const logFile = path.join(root, 'logs', 'session-clock-desktop-launch.log');
const WEB_WAIT_MS = Math.max(5000, Number(process.env.SESSION_CLOCK_WEB_WAIT_MS || 25_000));

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, line);
  } catch {
    /* noop */
  }
}

function step(n, text) {
  console.log(`[${n}/4] ${text}`);
  log(`step ${n}: ${text}`);
}

function readUrlFromWebLog() {
  try {
    const logPath = paths.webLog;
    if (!fs.existsSync(logPath)) return null;
    const matches = [...fs.readFileSync(logPath, 'utf8').matchAll(/\[session-clock-web\] 開く: (https?:\/\/[^\s]+)/g)];
    return matches.length ? matches[matches.length - 1][1] : null;
  } catch {
    return null;
  }
}

function httpOk(url) {
  try {
    const res = spawnSync(
      process.execPath,
      [
        '-e',
        `fetch(${JSON.stringify(url)},{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))`,
      ],
      hiddenOpts({ encoding: 'utf8', timeout: 5000, shell: false }),
    );
    return res.status === 0;
  } catch {
    return false;
  }
}

/** URL ファイル＋HTTP 200 まで待つ（最大 WEB_WAIT_MS） */
function waitForWebReady() {
  const deadline = Date.now() + WEB_WAIT_MS;
  let lastUrl = null;
  while (Date.now() < deadline) {
    let url = readWebUrl();
    if (!url) url = readUrlFromWebLog();
    if (url) {
      lastUrl = url;
      if (httpOk(url)) return { ok: true, url };
    }
    const remain = Math.ceil((deadline - Date.now()) / 1000);
    process.stdout.write(`\r    WEB 待機中… (${remain}s) ${lastUrl ? lastUrl : 'URL 未確定'}`);
    sleepMs(250);
  }
  process.stdout.write('\n');
  return { ok: false, url: lastUrl };
}

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* sync wait for bat flow */
  }
}

function main() {
  const mode = readSessionClockMode(root);

  if (stop) {
    const r = stopAllClock();
    log(`stop clearOk=${r.clearOk} watch=${r.watch} web=${r.web}`);
    console.log('[session-clock-desktop] 停止完了');
    process.exit(r.clearOk ? 0 : 1);
  }

  console.log('[session-clock-desktop] 壁時計を起動します…');

  step(1, '前回の watch/web を整理');
  const cleaned = stopWatchAndWeb();
  if (cleaned.watch || cleaned.web) {
    log(`cleaned orphan watch=${cleaned.watch} web=${cleaned.web}`);
  }

  step(2, '開始時刻をセット（SESSION-CLOCK.md）');
  const set = runNodeScriptSync(root, 'scripts/session-clock.mjs', ['set']);
  if (set.status !== 0) {
    log(`set NG exit=${set.status}`);
    console.error('[session-clock-desktop] set NG — logs/session-clock-desktop-launch.log');
    process.exit(1);
  }
  runNodeScriptSync(root, 'scripts/session-clock.mjs', ['write-ticker']);

  step(3, 'watch / WEB サーバを起動');
  process.env.SESSION_CLOCK_WATCH_MS = String(mode.watchMs);
  const watch = spawnWatch();
  const web = spawnWebServer();
  log(`start watch=${watch.message} web=${web.message}`);
  console.log(`    watch: ${watch.message}${watch.pid ? ` pid=${watch.pid}` : ''}`);
  console.log(`    web: ${web.message}${web.pid ? ` pid=${web.pid}` : ''}`);

  step(4, 'WEB が応答するまで待機 → ブラウザを開く');
  const ready = waitForWebReady();
  if (!ready.ok || !ready.url) {
    console.error('[session-clock-desktop] WEB 起動タイムアウト');
    console.error(`  確認: ${paths.webLog}`);
    console.error(`  手動: npm run session:clock:web-url`);
    process.exit(2);
  }

  if (mode.openBrowserOnStart) {
    const opened = openUrlInBrowser(ready.url);
    if (opened.ok) {
      console.log(`    ブラウザ: ${ready.url}`);
      log(`browser open ${ready.url} (${opened.method})`);
    } else {
      console.warn(`    ブラウザ自動起動失敗 — 手動で開いてください: ${ready.url}`);
      log(`browser open failed ${ready.url}`);
    }
  } else {
    console.log(`    URL（手動で開く）: ${ready.url}`);
  }

  console.log('');
  console.log('[session-clock-desktop] 起動完了');
  process.exit(0);
}

main();
