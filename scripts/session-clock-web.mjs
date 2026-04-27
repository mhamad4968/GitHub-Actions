#!/usr/bin/env node
/**
 * §51-6-2 壁時計をブラウザで見る（ローカルのみ）
 *
 *   npm run session:clock:web
 *   → http://127.0.0.1:47931/ を開く（既定ポート。変更: SESSION_CLOCK_WEB_PORT）
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
const PORT = Math.min(65535, Math.max(1024, Number(process.env.SESSION_CLOCK_WEB_PORT || 47931)));
const HOST = '127.0.0.1';

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

const server = http.createServer((req, res) => {
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

  const raw = readTicker();
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
  <h1>セッション時計（ローカル · ${escapeHtml(HOST)}:${PORT}）</h1>
  <p>下は <code>SESSION-CLOCK-TICKER.md</code> の中身です。<strong>30 秒ごと</strong>に自動再読み込みします。</p>
  <pre>${escapeHtml(raw)}</pre>
  <p class="hint">止める: このサーバを起動したターミナルで <kbd>Ctrl+C</kbd>。<br>
  詳細: <code>chat-sessions/SESSION-SPLIT-REMINDER.md</code>（人間向けタイマー / WEB）</p>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log(`[session-clock-web] 開く: ${url}`);
  console.log('  止める: Ctrl+C');
});

server.on('error', e => {
  console.error('[session-clock-web] ❌', e.message);
  if (e.code === 'EADDRINUSE') {
    console.error(`  別ポート: SESSION_CLOCK_WEB_PORT=47932 npm run session:clock:web`);
  }
  process.exit(1);
});
