/**
 * 壁時計 watch / web プロセスの起動・停止（sessionStart / sessionEnd hook 共用）
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_WATCH_MS } from './session-clock-core.mjs';
import { readSessionClockMode } from './session-clock-mode.mjs';
import { hiddenOpts, runNodeScriptSync, runPowerShellSync } from './win-hidden-spawn.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, '../..');

export const paths = {
  watchPid: path.join(repoRoot, 'logs', '.session-clock-watch.pid'),
  webPid: path.join(repoRoot, 'logs', '.session-clock-web.pid'),
  webUrl: path.join(repoRoot, 'logs', '.session-clock-web.url'),
  webLog: path.join(repoRoot, 'logs', 'session-clock-web.log'),
  watchLog: path.join(repoRoot, 'logs', 'session-clock-watch.log'),
};

function pidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function killPid(pid, label) {
  if (!pidAlive(pid)) return false;
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch (e) {
    console.warn(`[session-clock-process] ${label} kill NG pid=${pid}: ${e?.message || e}`);
    return false;
  }
}

function unlinkSafe(p) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* noop */
  }
}

export function readWebUrl() {
  try {
    if (!fs.existsSync(paths.webUrl)) return null;
    const u = fs.readFileSync(paths.webUrl, 'utf8').trim();
    return u.startsWith('http') ? u : null;
  } catch {
    return null;
  }
}

export function webAlreadyRunning() {
  if (!fs.existsSync(paths.webPid)) return false;
  const pid = Number(fs.readFileSync(paths.webPid, 'utf8').trim());
  if (!pidAlive(pid)) {
    unlinkSafe(paths.webPid);
    unlinkSafe(paths.webUrl);
    return false;
  }
  return true;
}

export function watchAlreadyRunning() {
  if (!fs.existsSync(paths.watchPid)) return false;
  const pid = Number(fs.readFileSync(paths.watchPid, 'utf8').trim());
  if (!pidAlive(pid)) {
    unlinkSafe(paths.watchPid);
    return false;
  }
  return true;
}

/** hook 起動時は 47931 固定（シェルに SESSION_CLOCK_WEB_PORT=48000 等が残っていても上書きしない） */
export function clockWebSpawnEnv() {
  const env = { ...process.env };
  delete env.SESSION_CLOCK_WEB_PORT;
  return env;
}

/** 壁時計が使う TCP 帯の node LISTEN を止める（Windows） */
function killNodeListenersInPortRange(fromPort, toPort) {
  if (process.platform !== 'win32') return;
  const ps = [
    `$from=${fromPort}; $to=${toPort}`,
    'Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |',
    'Where-Object { $_.LocalPort -ge $from -and $_.LocalPort -le $to } |',
    'ForEach-Object {',
    '  $op = $_.OwningProcess',
    '  $p = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $op) -ErrorAction SilentlyContinue',
    "  if ($p -and $p.Name -eq 'node.exe') { Stop-Process -Id $op -Force -ErrorAction SilentlyContinue }",
    '}',
  ].join(' ');
  runPowerShellSync(ps);
}

/** pid ファイル無しの node 残骸（Windows 中心・best effort） */
export function killOrphanClockProcesses() {
  killNodeListenersInPortRange(47931, 48060);
  const envBase = Number(process.env.SESSION_CLOCK_WEB_PORT);
  if (Number.isFinite(envBase) && (envBase < 47931 || envBase > 48060)) {
    killNodeListenersInPortRange(envBase, envBase + 29);
  }
  if (process.platform === 'win32') {
    const ps =
      "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" -ErrorAction SilentlyContinue | " +
      "Where-Object { $_.CommandLine -match 'session-clock-web\\.mjs|session-clock-watch\\.mjs' } | " +
      "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }";
    runPowerShellSync(ps);
    return;
  }
  spawnSync('pkill', ['-f', 'session-clock-web.mjs'], { encoding: 'utf8' });
  spawnSync('pkill', ['-f', 'session-clock-watch.mjs'], { encoding: 'utf8' });
}

/** web のみ停止（watch は維持） */
export function stopWebOnly() {
  const out = { web: false };
  if (fs.existsSync(paths.webPid)) {
    const pid = Number(fs.readFileSync(paths.webPid, 'utf8').trim());
    out.web = killPid(pid, 'web');
    unlinkSafe(paths.webPid);
    unlinkSafe(paths.webUrl);
  }
  return out;
}

/** watch / web を停止（clear は含まない） */
export function stopWatchAndWeb() {
  killOrphanClockProcesses();
  const out = { watch: false, web: false };
  if (fs.existsSync(paths.watchPid)) {
    const pid = Number(fs.readFileSync(paths.watchPid, 'utf8').trim());
    out.watch = killPid(pid, 'watch');
    unlinkSafe(paths.watchPid);
  }
  if (fs.existsSync(paths.webPid)) {
    const pid = Number(fs.readFileSync(paths.webPid, 'utf8').trim());
    out.web = killPid(pid, 'web');
    unlinkSafe(paths.webPid);
    unlinkSafe(paths.webUrl);
  }
  return out;
}

/** clear + watch/web 停止（Cursor 終了時） */
export function stopAllClock() {
  const clear = runNodeScriptSync(repoRoot, 'scripts/session-clock.mjs', ['clear']);
  const stopped = stopWatchAndWeb();
  return {
    clearOk: clear.status === 0,
    clearMsg: (clear.stdout || clear.stderr || '').trim().split('\n').pop(),
    ...stopped,
  };
}

function writeWebUrlFile(u) {
  try {
    fs.mkdirSync(path.dirname(paths.webUrl), { recursive: true });
    fs.writeFileSync(paths.webUrl, `${u}\n`, 'utf8');
  } catch {
    /* noop */
  }
}

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* busy wait for hook startup */
  }
}

function readUrlFromWebLog() {
  try {
    const log = fs.readFileSync(paths.webLog, 'utf8');
    const matches = [...log.matchAll(/\[session-clock-web\] 開く: (https?:\/\/[^\s]+)/g)];
    return matches.length ? matches[matches.length - 1][1] : null;
  } catch {
    return null;
  }
}

/** 前回 web 残骸を止めてから web を起動（detached）。watch は止めない */
export function spawnWebServer() {
  if (webAlreadyRunning()) {
    return { started: false, url: readWebUrl(), message: 'web already running' };
  }
  stopWebOnly();

  fs.mkdirSync(path.dirname(paths.webLog), { recursive: true });
  const out = fs.openSync(paths.webLog, 'a');
  const script = path.join(repoRoot, 'scripts', 'session-clock-web.mjs');
  const child = spawn(process.execPath, [script], hiddenOpts({
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', out, out],
    env: clockWebSpawnEnv(),
  }));
  child.unref();

  let url = null;
  for (let i = 0; i < 50; i += 1) {
    url = readWebUrl();
    if (url) break;
    sleepMs(100);
  }
  if (!url) {
    url = readUrlFromWebLog();
    if (url) writeWebUrlFile(url);
  }

  return { started: true, url, pid: child.pid, message: url ? 'web started' : 'web starting (url pending)' };
}

export function spawnWatch() {
  if (watchAlreadyRunning()) {
    return { started: false, message: 'watch already running' };
  }
  fs.mkdirSync(path.dirname(paths.watchLog), { recursive: true });
  const out = fs.openSync(paths.watchLog, 'a');
  const script = path.join(repoRoot, 'scripts', 'session-clock-watch.mjs');
  const mode = readSessionClockMode(repoRoot);
  const child = spawn(process.execPath, [script], hiddenOpts({
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', out, out],
    env: {
      ...process.env,
      SESSION_CLOCK_WATCH_MS: String(
        process.env.SESSION_CLOCK_WATCH_MS || mode.watchMs || DEFAULT_WATCH_MS,
      ),
    },
  }));
  child.unref();
  return { started: true, pid: child.pid, message: 'watch started' };
}
