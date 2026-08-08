#!/usr/bin/env node
/**
 * 完了通知（V2-N）— 音＋短いダイアログ（OK で停止）
 *
 *   npm run cio:done-notify
 *   npm run cio:done-notify -- --title "完了" --body "目視だけお願いします"
 *   npm run cio:done-notify -- --selftest   # 短い上限（自動検証向き）
 *
 * 合意（2026-08-08 夜）:
 *   - chimes.wav を約 3 秒周期で再生
 *   - 短いダイアログ。OK で即停止
 *   - 最大 5 分（放置時の自動停止）
 *   - ローカルのみ
 *
 * 正本: docs/plans/2026-08-08-done-notify-v2n-night-consult-spec.md
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_WAV_WIN = 'C:\\Windows\\Media\\chimes.wav';
const DEFAULT_INTERVAL_MS = 3000;
const DEFAULT_MAX_SEC = 300;
const SELFTEST_MAX_SEC = 8;

function sanitize(s, max = 400) {
  const t = String(s ?? '')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function appendLog(record) {
  const dir = path.join(ROOT, 'logs');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, 'session-desktop-notify.log'),
      `${JSON.stringify(record)}\n`,
      'utf8',
    );
  } catch {
    /* noop */
  }
}

function parseArgs(argv) {
  const out = {
    title: '完了',
    body: 'AIチームの作業が完了しました。OK で通知音を停止します。',
    intervalMs: DEFAULT_INTERVAL_MS,
    maxSec: DEFAULT_MAX_SEC,
    wav: DEFAULT_WAV_WIN,
    selftest: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--selftest') {
      out.selftest = true;
      out.maxSec = SELFTEST_MAX_SEC;
      out.title = '完了通知 selftest';
      out.body = `selftest（最大${SELFTEST_MAX_SEC}秒）。OK で停止。`;
    } else if (a === '--title' && argv[i + 1]) out.title = argv[++i];
    else if (a === '--body' && argv[i + 1]) out.body = argv[++i];
    else if (a === '--interval-ms' && argv[i + 1]) out.intervalMs = Number(argv[++i]) || DEFAULT_INTERVAL_MS;
    else if (a === '--max-sec' && argv[i + 1]) out.maxSec = Number(argv[++i]) || DEFAULT_MAX_SEC;
    else if (a === '--wav' && argv[i + 1]) out.wav = argv[++i];
  }
  out.title = sanitize(out.title, 120);
  out.body = sanitize(out.body, 400);
  out.intervalMs = Math.max(500, Math.min(30_000, out.intervalMs));
  out.maxSec = Math.max(2, Math.min(600, out.maxSec));
  return out;
}

function toWinWavPath(wavArg) {
  if (/^[A-Za-z]:[\\/]/.test(wavArg)) {
    return wavArg.replace(/\//g, '\\');
  }
  const m = String(wavArg).match(/^\/mnt\/([a-z])\/(.*)$/i);
  if (m) return `${m[1].toUpperCase()}:\\${m[2].replace(/\//g, '\\')}`;
  return wavArg.replace(/\//g, '\\');
}

function resolvePowershell() {
  if (process.platform === 'win32') return 'powershell.exe';
  const candidates = [
    '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function buildPs1(opts) {
  const wavWin = toWinWavPath(opts.wav);
  const payload = {
    wav: wavWin,
    title: opts.title,
    body: opts.body,
    intervalMs: opts.intervalMs,
    maxSec: opts.maxSec,
  };
  const json = JSON.stringify(payload).replace(/'/g, "''");
  // Child sound loop: wav path is expanded once here (escaped for PS single-quoted).
  const wavForChild = wavWin.replace(/'/g, "''");
  return `# cio-done-notify generated
$ErrorActionPreference = 'Continue'
$cfg = ConvertFrom-Json '${json}'
$wav = [string]$cfg.wav
$title = [string]$cfg.title
$body = [string]$cfg.body
$intervalMs = [int]$cfg.intervalMs
$maxSec = [int]$cfg.maxSec

if (-not (Test-Path -LiteralPath $wav)) {
  Write-Output 'POPUP_CODE=-99'
  Write-Error "wav missing: $wav"
  exit 2
}

$soundCmd = @'
$ErrorActionPreference = 'SilentlyContinue'
$p = New-Object System.Media.SoundPlayer '${wavForChild}'
$deadline = (Get-Date).AddSeconds(${opts.maxSec})
$intervalMs = ${opts.intervalMs}
while ((Get-Date) -lt $deadline) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try { $p.PlaySync() } catch {}
  $remain = $intervalMs - [int]$sw.ElapsedMilliseconds
  if ($remain -gt 50) { Start-Sleep -Milliseconds $remain }
}
'@

$proc = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-WindowStyle','Hidden','-Command', $soundCmd) -PassThru -WindowStyle Hidden
try {
  $ws = New-Object -ComObject WScript.Shell
  $code = $ws.Popup($body, $maxSec, $title, 64 + 4096)
  Write-Output ("POPUP_CODE=" + $code)
  exit 0
} finally {
  if ($null -ne $proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
}
`;
}

function runWinDoneNotify(opts) {
  const psExe = resolvePowershell();
  if (!psExe) {
    return { ok: false, method: 'none', popupCode: null, detail: 'powershell not found' };
  }

  const wavWin = toWinWavPath(opts.wav);
  if (process.platform === 'win32' && !fs.existsSync(wavWin)) {
    return { ok: false, method: 'none', popupCode: null, detail: `wav missing: ${wavWin}` };
  }

  const ps1Path = path.join(os.tmpdir(), `cio-done-notify-${process.pid}.ps1`);
  fs.writeFileSync(ps1Path, buildPs1(opts), 'utf8');

  try {
    const r = spawnSync(
      psExe,
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ps1Path],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: (opts.maxSec + 45) * 1000,
      },
    );
    const stdout = `${r.stdout || ''}\n${r.stderr || ''}`;
    const m = stdout.match(/POPUP_CODE=(-?\d+)/);
    const popupCode = m ? Number(m[1]) : null;
    const ok =
      r.error == null && popupCode !== -99 && (popupCode === 1 || popupCode === -1 || (r.status === 0 && popupCode != null));
    return {
      ok: Boolean(ok),
      method: 'powershell-chimes-popup',
      popupCode,
      detail: r.error ? String(r.error.message || r.error) : popupCode == null ? stdout.slice(0, 400) : undefined,
    };
  } finally {
    try {
      fs.unlinkSync(ps1Path);
    } catch {
      /* noop */
    }
  }
}

function printHelp() {
  console.log(`cio:done-notify — 完了通知（chimes + ダイアログ）

使い方:
  npm run cio:done-notify
  npm run cio:done-notify -- --title "完了" --body "目視だけお願いします"
  npm run cio:done-notify -- --selftest

既定: chimes.wav / 間隔 3000ms / 最大 300秒 / OK で停止
`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  console.log(`[cio:done-notify] title=${opts.title}`);
  console.log(`[cio:done-notify] intervalMs=${opts.intervalMs} maxSec=${opts.maxSec} selftest=${opts.selftest}`);
  console.log(`[cio:done-notify] wav=${opts.wav}`);

  let result;
  if (process.platform === 'win32' || resolvePowershell()) {
    result = runWinDoneNotify(opts);
  } else {
    result = {
      ok: false,
      method: 'unsupported',
      popupCode: null,
      detail: `platform=${process.platform} (Windows/WSL 向け)`,
    };
  }

  appendLog({
    ts: new Date().toISOString(),
    kind: 'done-notify',
    title: opts.title,
    body: opts.body,
    intervalMs: opts.intervalMs,
    maxSec: opts.maxSec,
    wav: opts.wav,
    method: result.method,
    ok: result.ok,
    popupCode: result.popupCode,
    selftest: opts.selftest,
    platform: process.platform,
  });

  if (!result.ok) {
    console.error(`[cio:done-notify] NG method=${result.method} detail=${result.detail || ''}`);
    process.exit(1);
  }

  const stopReason =
    result.popupCode === 1 ? 'OK' : result.popupCode === -1 ? 'timeout' : `code=${result.popupCode}`;
  console.log(`[cio:done-notify] OK method=${result.method} stop=${stopReason}`);
  process.exit(0);
}

main();
