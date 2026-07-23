#!/usr/bin/env node
/**
 * §51-6-2 壁時計をブラウザで見る（ローカルのみ）
 *
 *   npm run session:clock:web
 *   → http://127.0.0.1:47931/ から **空いているポート**を順に試す（既定起点: SESSION_CLOCK_WEB_PORT または 47931）
 *
 * 表示は `SESSION-CLOCK-TICKER.md` を読む。**各 GET の直前**に `writeTickerFile(root)`（`lib/session-clock-write-ticker.mjs`）を
 * in-process で実行し、経過／残りを再計算する（子プロセス不要・watch なしでも 30 秒 reload で数字が進む）。
 *
 * 負荷・将来案: `docs/session-clock-web-performance-notes.md`
 *
 * セキュリティ: 既定 **127.0.0.1** のみ。WSL で Windows ブラウザから繋がらないときだけ
 *   `SESSION_CLOCK_WEB_HOST=0.0.0.0`（同一 LAN に露出するので自宅外では使わない）。
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathsFromRoot } from './lib/session-clock-core.mjs';
import { paths as clockPaths } from './lib/session-clock-process.mjs';
import { writeTickerFile } from './lib/session-clock-write-ticker.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { tickerAbs } = pathsFromRoot(root);

function writeWebMeta(url, pid, { persistPid = true } = {}) {
  try {
    fs.mkdirSync(path.dirname(clockPaths.webUrl), { recursive: true });
    fs.writeFileSync(clockPaths.webUrl, `${url}\n`, 'utf8');
    if (persistPid) {
      fs.writeFileSync(clockPaths.webPid, `${pid}\n`, 'utf8');
    }
  } catch (e) {
    console.warn('[session-clock-web] meta write warn:', e?.message || e);
  }
}

function clearWebPidFile() {
  try {
    if (fs.existsSync(clockPaths.webPid)) fs.unlinkSync(clockPaths.webPid);
  } catch {
    /* noop */
  }
}

function resolveBindHost() {
  const h = (process.env.SESSION_CLOCK_WEB_HOST || '127.0.0.1').trim();
  if (h === '127.0.0.1' || h === '0.0.0.0' || h === '::1') return h;
  console.warn(`[session-clock-web] 未対応の SESSION_CLOCK_WEB_HOST=${JSON.stringify(h)} → 127.0.0.1`);
  return '127.0.0.1';
}

const BIND_HOST = resolveBindHost();
/** ブラウザに見せる URL（0.0.0.0 待受でも同マシンは 127.0.0.1 で開けることが多い） */
const DISPLAY_HOST = BIND_HOST === '0.0.0.0' ? '127.0.0.1' : BIND_HOST === '::1' ? '[::1]' : BIND_HOST;
const PORT_RANGE = 30;
/** 一次帯（47931）が WSL ミラー・ゴースト EADDRINUSE のとき試す二次帯 */
const SECONDARY_BASE = 38473;

function firstNonInternalIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const e of nets[name] || []) {
      const v4 = e.family === 'IPv4' || e.family === 4;
      if (v4 && !e.internal && e.address) return e.address;
    }
  }
  return null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readTicker() {
  try {
    return fs.readFileSync(tickerAbs, 'utf8');
  } catch {
    return (
      '（まだ `SESSION-CLOCK-TICKER.md` がありません）\n\n' +
      '1. `cd ~/kintone-ai-lab && npm run session:clock:set`\n' +
      '2. `npm run session:clock:write-ticker` または `session:clock:watch` を起動\n' +
      '3. このページを再読み込み'
    );
  }
}

/** http 表示用: `./SESSION-CLOCK.md` 相対リンクは localhost 上で 404 になるので平文化 */
function readTickerForWeb() {
  return readTicker().replace(
    /\[`SESSION-CLOCK\.md`\]\(\.\/SESSION-CLOCK\.md\)/g,
    '`chat-sessions/SESSION-CLOCK.md`',
  );
}

function tickerMtimeIso() {
  try {
    return fs.statSync(tickerAbs).mtime.toISOString();
  } catch {
    return '（未取得）';
  }
}

function createHandler(boundPort) {
  return (req, res) => {
    const u = req.url?.split('?')[0] ?? '/';
    if (u === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (u !== '/' && u !== '/index.html') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    writeTickerFile(root);
    const tickerMtime = tickerMtimeIso();
    const raw = readTickerForWeb();
    const generatedAt = new Date().toISOString();
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <title>セッション時計 §51-6-2</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; max-width: 52rem; line-height: 1.5; }
    h1 { font-size: 1.25rem; }
    pre { background: #f4f4f5; padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-break: break-word; }
    .hint { color: #52525b; font-size: 0.875rem; margin-top: 1rem; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>セッション時計（ローカル · ${escapeHtml(DISPLAY_HOST)}:${boundPort}）</h1>
  <p>下は <code>SESSION-CLOCK-TICKER.md</code> の中身です。各表示の直前に <code>writeTickerFile</code>（in-process）で再生成してから読みます。<strong>30 秒ごと</strong>に <code>location.reload()</code>（キャッシュ抑止ヘッダ付き）。</p>
  <p class="hint" style="font-size:12px;color:#71717a">ページ生成(UTC): ${escapeHtml(generatedAt)} — 再読込の目印<br>
  TICKER ファイル更新(ローカル mtime・UTC): ${escapeHtml(tickerMtime)} — <code>write-ticker</code> 直後の値</p>
  <pre>${escapeHtml(raw)}</pre>
  <p class="hint">止める: このサーバを起動したターミナルで <kbd>Ctrl+C</kbd>。<br>
  詳細: <code>chat-sessions/SESSION-SPLIT-REMINDER.md</code>（人間向けタイマー / WEB）</p>
  <script>
(function(){
  var sec = 30;
  setInterval(function () { location.reload(); }, sec * 1000);
})();
  </script>
</body>
</html>`;

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    res.end(html);
  };
}

/**
 * @param {number} p
 * @param {{ persistPid?: boolean }} [opts]
 * @returns {Promise<import('node:http').Server | null>}
 */
function tryListenOnce(p, { persistPid = true } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(createHandler(p));
    const onErr = err => {
      server.off('error', onErr);
      if (err.code === 'EADDRINUSE') {
        try {
          server.close();
        } catch {
          /* noop */
        }
        resolve(null);
        return;
      }
      reject(err);
    };
    server.on('error', onErr);
    server.listen(p, BIND_HOST, () => {
      server.off('error', onErr);
      server.on('error', err => {
        console.error('[session-clock-web] runtime', err.message);
      });
      const addr = server.address();
      const bound =
        typeof addr === 'object' && addr && 'port' in addr ? addr.port : p;
      const url = `http://${DISPLAY_HOST}:${bound}/`;
      writeWebMeta(url, process.pid, { persistPid });
      resolve(server);
    });
  });
}

const PRINT_URL_ONLY =
  process.argv.includes('--print-url') || process.argv.includes('--url-only');

/**
 * @param {number} base
 * @param {{ persistPid?: boolean, label?: string }} [opts]
 * @returns {Promise<{ server: import('node:http').Server, port: number } | null>}
 */
async function tryListenRange(base, { persistPid = true, label = '' } = {}) {
  const max = Math.min(65535, base + PORT_RANGE - 1);
  for (let p = base; p <= max; p++) {
    const server = await tryListenOnce(p, { persistPid });
    if (server) return { server, port: p, base, max, label };
  }
  return null;
}

async function main() {
  const persistPid = !PRINT_URL_ONLY;
  const primaryBase = Math.min(
    65535,
    Math.max(1024, Number(process.env.SESSION_CLOCK_WEB_PORT || 47931)),
  );

  let hit = null;
  try {
    hit = await tryListenRange(primaryBase, { persistPid, label: 'primary' });
    if (!hit && primaryBase !== SECONDARY_BASE) {
      hit = await tryListenRange(SECONDARY_BASE, { persistPid, label: 'secondary' });
    }
  } catch (e) {
    console.error('[session-clock-web] ❌', e.message);
    process.exit(1);
  }

  if (hit) {
    const { server, port, base, label } = hit;
    const url = `http://${DISPLAY_HOST}:${port}/`;
    console.log(`[session-clock-web] 開く: ${url}`);
    if (port !== base) {
      console.log(`  （起点 ${base} は使用中のため ${port} にフォールバック）`);
    }
    if (label === 'secondary') {
      console.log(
        `  （一次帯 ${primaryBase}〜${Math.min(65535, primaryBase + PORT_RANGE - 1)} が使用中のため二次帯 ${SECONDARY_BASE} を使用）`,
      );
    }
    if (BIND_HOST === '0.0.0.0') {
      const lan = firstNonInternalIPv4();
      if (lan) console.log(`  （同一 LAN の別端末用の例）http://${lan}:${port}/`);
    }
    if (PRINT_URL_ONLY) {
      console.log(
        '  ※ 別ターミナルで `session:clock:web` が既に動いているときは、そのターミナルの「開く:」行が正。ここは「いまから新規起動した場合」の URL です。',
      );
      clearWebPidFile();
      server.close(() => process.exit(0));
      return;
    }
    console.log('  止める: Ctrl+C');
    console.log('  ※ ERR_CONNECTION_REFUSED → サーバ未起動かポート違い。ターミナルを閉じると止まる。URL は毎回このログに合わせる。');
    if (BIND_HOST === '127.0.0.1') {
      console.log('  ※ WSL で Windows ブラウザから繋がらないとき: SESSION_CLOCK_WEB_HOST=0.0.0.0 npm run session:clock:web');
    }
    return;
  }

  try {
    const server = await tryListenOnce(0, { persistPid });
    if (server) {
      const addr = server.address();
      const p = typeof addr === 'object' && addr ? addr.port : 0;
      const url = `http://${DISPLAY_HOST}:${p}/`;
      console.log(`[session-clock-web] 開く: ${url}`);
      console.log(
        `  （${primaryBase} 帯と二次帯 ${SECONDARY_BASE} が使用中のため OS 割当ポート ${p} にフォールバック）`,
      );
      if (PRINT_URL_ONLY) {
        clearWebPidFile();
        server.close(() => process.exit(0));
        return;
      }
      console.log('  止める: Ctrl+C');
      return;
    }
  } catch (e) {
    console.error('[session-clock-web] ❌ port 0 fallback', e.message);
  }
  console.error(
    `[session-clock-web] ❌ ${primaryBase} 帯・二次帯 ${SECONDARY_BASE} に空きポートがありません。npm run session:clock:stop を実行してから再試行:`,
  );
  process.exit(1);
}

main();
