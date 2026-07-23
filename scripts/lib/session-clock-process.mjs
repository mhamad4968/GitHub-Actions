/**
 * 壁時計 watch / web プロセスの起動・停止（sessionStart / sessionEnd hook 共用）
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_WATCH_MS } from './session-clock-core.mjs';
import { readSessionClockMode } from './session-clock-mode.mjs';
import { hiddenOpts, runNodeScriptSync } from './win-hidden-spawn.mjs';

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

/** Windows: netstat + taskkill（R22 — PS 不要経路） */
function killWindowsPid(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return;
  spawnSync('taskkill', ['/PID', String(pid), '/F'], hiddenOpts({ stdio: 'ignore' }));
}

function parseNetstatListenPids(fromPort, toPort) {
  const r = spawnSync('netstat', ['-ano'], hiddenOpts({ encoding: 'utf8' }));
  if (r.status !== 0) return [];
  const pids = new Set();
  for (const line of (r.stdout || '').split(/\r?\n/)) {
    const m = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/i);
    if (!m) continue;
    const port = Number(m[1]);
    const pid = Number(m[2]);
    if (port >= fromPort && port <= toPort && pid > 0) pids.add(pid);
  }
  return [...pids];
}

/** 壁時計が使う TCP 帯の node LISTEN を止める（Windows — R22 taskkill） */
function killNodeListenersInPortRange(fromPort, toPort) {
  if (process.platform !== 'win32') return;
  for (const pid of parseNetstatListenPids(fromPort, toPort)) {
    killWindowsPid(pid);
  }
}

/** wmic — commandLine 一致 node を taskkill（R22: runPowerShellSync 代替） */
function killNodeProcessesByCmdFragment(fragment) {
  if (process.platform !== 'win32') return;
  const safe = fragment.replace(/'/g, "''");
  const r = spawnSync(
    'wmic',
    ['process', 'where', `CommandLine like '%${safe}%'`, 'get', 'ProcessId', '/FORMAT:CSV'],
    hiddenOpts({ encoding: 'utf8' }),
  );
  for (const line of (r.stdout || '').split(/\r?\n/)) {
    const m = line.match(/,(\d+)\s*$/);
    if (m) killWindowsPid(Number(m[1]));
  }
}

/** WSL 側 session-clock-web 残骸（Windows ミラーで 47931 帯がゴースト EADDRINUSE になる再発防止） */
export function killWslWebOrphans() {
  if (process.platform !== 'win32') {
    spawnSync('pkill', ['-f', 'session-clock-web.mjs'], { encoding: 'utf8' });
    return;
  }
  // best effort — wsl 未導入・停止中は無視
  spawnSync(
    'wsl.exe',
    ['-e', 'bash', '-lc', "pkill -f 'session-clock-web.mjs' 2>/dev/null || true"],
    hiddenOpts({ encoding: 'utf8', timeout: 8000 }),
  );
}

/** pid ファイル無しの node 残骸（Windows 中心・best effort） */
export function killOrphanClockProcesses() {
  killWslWebOrphans();
  killNodeListenersInPortRange(47931, 48060);
  killNodeListenersInPortRange(38473, 38502);
  const envBase = Number(process.env.SESSION_CLOCK_WEB_PORT);
  if (Number.isFinite(envBase) && (envBase < 47931 || envBase > 48060)) {
    killNodeListenersInPortRange(envBase, envBase + 29);
  }
  if (process.platform === 'win32') {
    killNodeProcessesByCmdFragment('session-clock-web.mjs');
    killNodeProcessesByCmdFragment('session-clock-watch.mjs');
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

/** web のみ残骸掃除（WSL ミラー孤児 + OS 割当ポート・watch は触らない） */
export function killWebOrphanProcesses() {
  killWslWebOrphans();
  killNodeListenersInPortRange(47931, 48060);
  killNodeListenersInPortRange(38473, 38502);
  const envBase = Number(process.env.SESSION_CLOCK_WEB_PORT);
  if (Number.isFinite(envBase) && (envBase < 47931 || envBase > 48060)) {
    killNodeListenersInPortRange(envBase, envBase + 29);
  }
  if (process.platform === 'win32') {
    killNodeProcessesByCmdFragment('session-clock-web.mjs');
  } else {
    spawnSync('pkill', ['-f', 'session-clock-web.mjs'], { encoding: 'utf8' });
  }
}

/** 前回 web 残骸を止めてから web を起動（detached）。watch は止めない */
export function spawnWebServer() {
  if (webAlreadyRunning()) {
    return { started: false, url: readWebUrl(), message: 'web already running' };
  }
  stopWebOnly();
  // pid ファイル外の孤児（OS フォールバックポート / cio:health auto-heal 二重起動）を掃除
  killWebOrphanProcesses();

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
