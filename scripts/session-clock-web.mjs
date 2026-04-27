#!/usr/bin/env node
/**
 * §51-6-2 壁時計をブラウザで見る（ローカルのみ）
 *
 *   npm run session:clock:web
 *   → http://127.0.0.1:47931/ から **空いているポート**を順に試す（既定起点: SESSION_CLOCK_WEB_PORT または 47931）
 *
 * 表示内容は `chat-sessions/SESSION-CLOCK-TICKER.md`（write-ticker / watch / set で更新）。
 * ページは 30 秒ごとに meta refresh で再読込（追加依存なし）。
 *
 * セキュリティ: **127.0.0.1 のみ**バインド（LAN からは見えない）。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tickerAbs = path.join(root, 'chat-sessions', 'SESSION-CLOCK-TICKER.md');
const HOST = '127.0.0.1';
const PORT_RANGE = 30;

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

    const raw = readTickerForWeb();
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="30">
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
  <h1>セッション時計（ローカル · ${escapeHtml(HOST)}:${boundPort}）</h1>
  <p>下は <code>SESSION-CLOCK-TICKER.md</code> の中身です。<strong>30 秒ごと</strong>に自動再読み込みします。</p>
  <pre>${escapeHtml(raw)}</pre>
  <p class="hint">止める: このサーバを起動したターミナルで <kbd>Ctrl+C</kbd>。<br>
  詳細: <code>chat-sessions/SESSION-SPLIT-REMINDER.md</code>（人間向けタイマー / WEB）</p>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  };
}

/**
 * @param {number} p
 * @returns {Promise<import('node:http').Server | null>}
 */
function tryListenOnce(p) {
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
    server.listen(p, HOST, () => {
      server.off('error', onErr);
      server.on('error', err => {
        console.error('[session-clock-web] runtime', err.message);
      });
      resolve(server);
    });
  });
}

async function main() {
  const base = Math.min(65535, Math.max(1024, Number(process.env.SESSION_CLOCK_WEB_PORT || 47931)));
  const max = Math.min(65535, base + PORT_RANGE - 1);
  for (let p = base; p <= max; p++) {
    try {
      const server = await tryListenOnce(p);
      if (server) {
        const url = `http://${HOST}:${p}/`;
        console.log(`[session-clock-web] 開く: ${url}`);
        if (p !== base) {
          console.log(`  （起点 ${base} は使用中のため ${p} にフォールバック）`);
        }
        console.log('  止める: Ctrl+C');
        return;
      }
    } catch (e) {
      console.error('[session-clock-web] ❌', e.message);
      process.exit(1);
    }
  }
  console.error(
    `[session-clock-web] ❌ ${base}〜${max} に空きポートがありません。古いプロセスを止めるか、別起点で:`,
  );
  console.error(`  SESSION_CLOCK_WEB_PORT=48000 npm run session:clock:web`);
  process.exit(1);
}

main();
