#!/usr/bin/env node
/**
 * sessionStart hook — §51-6-2 の壁時計を Cursor 起動時に自動化
 *
 * 1) 残骸停止（前回 sessionEnd 漏れ対策）→ `session:clock:set`
 * 2) `session:clock:watch` バックグラウンド起動
 * 3) `session:clock:web` バックグラウンド起動 → URL を additional_context に明示
 *
 * @see docs/runbooks/session-clock-cursor-lifecycle.md
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSessionStartConstitutionReadBlock } from './ng-recovery-gate.mjs';
import { buildCioDesktopPathGuardBlock } from './cio-desktop-path-guard.mjs';
import { hiddenOpts, openUrlInBrowser, runNodeScriptSync } from '../../scripts/lib/win-hidden-spawn.mjs';
import { readSessionClockMode } from '../../scripts/lib/session-clock-mode.mjs';
import {
  readWebUrl,
  repoRoot,
  spawnWatch,
  spawnWebServer,
  stopWatchAndWeb,
} from '../../scripts/lib/session-clock-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const logDir = path.join(root, 'logs');
const logFile = path.join(logDir, 'session-start-hook.log');

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

  logLine(`sessionStart session_id=${input.session_id ?? '?'} composer_mode=${input.composer_mode ?? '?'}`);

  const clockMode = readSessionClockMode(root);
  let url = readWebUrl();
  let clockBlock;

  if (clockMode.mode === 'manual-desktop') {
    logLine('session-clock mode=manual-desktop — hook 自動起動スキップ（Desktop bat 待ち）');
    clockBlock =
      '【壁時計・手動運用】hook では **起動しない**（CMD/PowerShell フラッシュ回避）。' +
      ' **Desktop `壁時計_START.bat` をダブルクリック**してから作業開始。' +
      ' 停止: `壁時計_STOP.bat` または Cursor 終了時 sessionEnd。' +
      (url ? ` 前回 URL 控え: ${url}` : '');
  } else {
    // 前回 Cursor 強制終了などで watch/web が残っている場合は先に止める（clear はこのあと set）
    const cleaned = stopWatchAndWeb();
    if (cleaned.watch || cleaned.web) {
      logLine(`orphan cleanup watch=${cleaned.watch} web=${cleaned.web}`);
    }

    const set = runNodeScriptSync(repoRoot, 'scripts/session-clock.mjs', ['set']);
    if (set.status !== 0) {
      logLine(`session:clock:set NG exit=${set.status} stderr=${(set.stderr || '').slice(0, 400)}`);
    } else {
      logLine('session:clock:set OK');
    }

    const watch = spawnWatch();
    logLine(`watch ${watch.message} pid=${watch.pid ?? '-'}`);

    const web = spawnWebServer();
    url = web.url || readWebUrl();
    logLine(`web ${web.message} url=${url ?? 'pending'} pid=${web.pid ?? '-'}`);

    if (url && process.env.SESSION_CLOCK_OPEN_BROWSER !== '0') {
      try {
        const opened = openUrlInBrowser(url);
        logLine(opened.ok ? `browser open ${url} (${opened.method})` : `browser open skip ${url}`);
      } catch (e) {
        logLine(`browser open skip ${e?.message || e}`);
      }
    }

    const urlBlock = url
      ? ` **壁時計 WEB URL（ブラウザで開く）: ${url}**`
      : ' 壁時計 WEB は起動中（URL は `logs/session-clock-web.log` の「開く:」行を参照）。';

    clockBlock =
      '【自動・Cursor sessionStart hook】' +
      '`npm run session:clock:set` 実行済み。`session:clock:watch` / `session:clock:web` をバックグラウンド起動済み。' +
      urlBlock +
      ' 浜田が手で set/watch/web を打つ必要は原則ありません（hook 無効時のみ手動）。' +
      ' **Cursor を閉じると sessionEnd hook で壁時計は自動停止**（`session:clock:clear`）。';
  }

  let mcpStamp = '';
  try {
    const stampScript = path.join(root, 'scripts', 'mcp-chat-stamp.mjs');
    const st = spawnSync(process.execPath, [stampScript], hiddenOpts({
      cwd: root,
      encoding: 'utf8',
      shell: false,
    }));
    mcpStamp = (st.stdout || '').trim().split('\n')[0] || '';
    if (st.status !== 0) {
      logLine(`mcp-chat-stamp.mjs exit=${st.status} stderr=${(st.stderr || '').slice(0, 200)}`);
    }
  } catch (e) {
    logLine(`mcp-chat-stamp spawn error ${e?.message || e}`);
    mcpStamp = 'MCPスキップ: 未接続（stamp 実行例外・チャット経路は未検証）';
  }

  const mcpBlock = mcpStamp
    ? ` 【MCP貼付1行・sessionStart】\`${mcpStamp}\`（外部正ターンの [ルール確認] にそのまま追記可。手動再発行: \`npm run mcp:chat-stamp\`）`
    : '';

  const capPath = path.join(root, 'chat-sessions', 'cloud-agent-last-intent.json');
  let cloudHandoffHint = '';
  try {
    if (fs.existsSync(capPath)) {
      cloudHandoffHint =
        ' 【Cloud handoff】`chat-sessions/cloud-agent-last-intent.json` あり — 先頭ターンで Read し、`closeStatus` 未設定なら続行または `npm run cio:cloud-handoff -- status`。';
    }
  } catch {
    /* noop */
  }

  const additional_context =
    clockBlock +
    mcpBlock +
    cloudHandoffHint +
    buildCioDesktopPathGuardBlock() +
    buildSessionStartConstitutionReadBlock();

  process.stdout.write(`${JSON.stringify({ additional_context })}\n`);
  process.exit(0);
}

main();
