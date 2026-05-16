#!/usr/bin/env node
/**
 * 提出用月次 PDF を HTTP で返す（683 一覧「提出用PDF」ボタン用）。
 *
 *   npm run user683:monthly-pdf:serve
 *
 * ブラウザは https の kintone から http localhost への fetch がブロックされるため、
 * 683 側は window.open で本 URL を開き、PDF をダウンロード／表示する。
 *
 * 環境: `USER683_MONTHLY_PDF_PORT`（既定 17886）、`USER683_MONTHLY_PDF_SERVE_TEMP`（生成一時 PDF のパス。未設定時 **Windows は `C:\\tmp\\_user683-monthly-serve-temp.pdf`**、それ以外は OS 一時ディレクトリ）、`.env` の kintone 認証（generate_monthly_pdf.py と同型）。
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'scripts', 'user683-monthly-pdf', 'generate_monthly_pdf.py');
const port = Number(process.env.USER683_MONTHLY_PDF_PORT || 17886);

function pythonArgv() {
  const candidates = [['python'], ['python3'], ['py', '-3']];
  for (const c of candidates) {
    const r = spawnSync(c[0], [...c.slice(1), '--version'], { encoding: 'utf8' });
    if (r.status === 0) return c;
  }
  return ['python'];
}

const pyExe = pythonArgv();

function serveTempPdfPath() {
  const e = process.env.USER683_MONTHLY_PDF_SERVE_TEMP;
  if (e && String(e).trim()) return path.resolve(String(e).trim());
  if (process.platform === 'win32') return 'C:\\tmp\\_user683-monthly-serve-temp.pdf';
  return path.join(os.tmpdir(), 'user683-monthly-serve-temp.pdf');
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });
    res.end();
    return;
  }
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  const okPath =
    url.pathname === '/user683/monthly.pdf' ||
    url.pathname.endsWith('/user683/monthly.pdf') ||
    url.pathname === '/monthly.pdf';
  if (!okPath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('GET /user683/monthly.pdf?year=YYYY&month=M');
    return;
  }
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');
  if (!year || !month || !/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Query: year=YYYY&month=M (1-12)');
    return;
  }
  const out = serveTempPdfPath();
  try {
    fs.mkdirSync(path.dirname(out), { recursive: true });
  } catch (_) {
    /* ignore */
  }
  try {
    if (fs.existsSync(out)) fs.unlinkSync(out);
  } catch (_) {
    /* ignore */
  }
  const bin = pyExe[0];
  const prefix = pyExe.slice(1);
  const childArgs = [...prefix, script, '--year', year, '--month', String(Number(month)), '--out', out];
  const r = spawnSync(bin, childArgs, {
    cwd: repoRoot,
    env: process.env,
    maxBuffer: 50 * 1024 * 1024,
  });
  if (r.status !== 0) {
    const err = (r.stderr && r.stderr.toString()) || (r.stdout && r.stdout.toString()) || 'PDF failed';
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(err);
    return;
  }
  let buf;
  try {
    buf = fs.readFileSync(out);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Output file missing');
    return;
  }
  const m2 = String(Number(month)).padStart(2, '0');
  const fname = `user-support-${year}-${m2}.pdf`;
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Length': String(buf.length),
    'Content-Disposition': 'attachment; filename="' + fname + '"',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(buf);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      '[user683-monthly-pdf-serve] ポート ' +
        port +
        ' は既に使用中です（別ターミナルで同コマンドが動いていることが多いです）。\n' +
        '対処 A: 既存の serve を Ctrl+C で止める。対処 B: 別ポートで起動する例（cmd）:\n' +
        '  set USER683_MONTHLY_PDF_PORT=17887 && npm run user683:monthly-pdf:serve\n' +
        'PowerShell: $env:USER683_MONTHLY_PDF_PORT=17887; npm run user683:monthly-pdf:serve\n' +
        '（kintone 683 ではコンソールで window.USER683_MONTHLY_PDF_SERVE_URL を同じ URL に合わせる）\n' +
        'Windows で占有 PID の例: netstat -ano | findstr :' +
        port,
    );
  } else {
    console.error('[user683-monthly-pdf-serve]', err);
  }
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  console.log('[user683-monthly-pdf-serve] listening http://127.0.0.1:' + port + '/user683/monthly.pdf?year=2026&month=5');
});
