/**
 * repo-node-env.mjs — Windows ネイティブ / WSL(Linux) 両対応の Node 実行環境
 *
 * 利用 PC が Windows でも、cron・MCP 正本は WSL NVM v24。
 * morning-prep / health-check は **Windows 上では Cursor/npm ネイティブを優先**し、
 * WSL 内では print-nvm-node-bin.sh で .nvmrc 追随の bin を PATH 先頭に載せる。
 */
import { spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hiddenOpts } from './win-hidden-spawn.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const IS_WIN = process.platform === 'win32';

/** Windows 絶対パス → WSL /mnt/<drive>/... */
export function win32ToWslPath(absWin) {
  const resolved = path.resolve(absWin);
  const m = /^([a-zA-Z]):[/\\](.*)$/.exec(resolved);
  if (!m) return resolved.replace(/\\/g, '/');
  return `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}`;
}

/** JST 日付 YYYY-MM-DD */
export function jstYmdIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * `.nvmrc` 追随 bin ディレクトリ（末尾 …/bin）。
 * Windows: WSL 上の NVM を正本 → 失敗時は現在の node.exe の dir。
 * Linux/WSL プロセス: bash scripts/print-nvm-node-bin.sh。
 */
export function resolveRepoNodeBinDir(repoRoot = REPO_ROOT) {
  const script = path.join(repoRoot, 'scripts', 'print-nvm-node-bin.sh');
  if (!fs.existsSync(script)) {
    return path.dirname(process.execPath);
  }

  if (IS_WIN) {
    const wslRoot = win32ToWslPath(repoRoot);
    const inner = `cd '${wslRoot}' && bash scripts/print-nvm-node-bin.sh`;
    const wsl = spawnSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'bash', '-lc', inner], hiddenOpts({
      encoding: 'utf8',
      timeout: 25_000,
    }));
    const wslBin = (wsl.stdout || '').trim();
    if (wsl.status === 0 && wslBin) return wslBin;
    return path.dirname(process.execPath);
  }

  try {
    const r = spawnSync('bash', [script], { cwd: repoRoot, encoding: 'utf8', timeout: 15_000 });
    const line = (r.stdout || '').trim();
    if (r.status === 0 && line) return line;
  } catch {
    /* fall through */
  }
  return path.dirname(process.execPath);
}

/** 実行用 node バイナリ（Windows ネイティブは .exe 不要 — spawn が解決） */
export function repoNodeExecutable(binDir = resolveRepoNodeBinDir()) {
  if (IS_WIN) return process.execPath;
  const candidate = path.join(binDir, 'node');
  return fs.existsSync(candidate) ? candidate : process.execPath;
}

/** PATH / Path に repo bin を先頭追加した env */
export function buildRepoProcessEnv(extra = {}, repoRoot = REPO_ROOT) {
  const binDir = IS_WIN ? path.dirname(process.execPath) : resolveRepoNodeBinDir(repoRoot);
  const sep = path.delimiter;
  const pathKey = IS_WIN ? 'Path' : 'PATH';
  const base = process.env[pathKey] || process.env.PATH || '';
  const merged = base.includes(binDir) ? base : `${binDir}${sep}${base}`;
  return {
    ...process.env,
    ...extra,
    [pathKey]: merged,
    PATH: merged,
    REPO_NODE_BIN_DIR: binDir,
  };
}

/** Unix 専用コマンド（tail / grep / crontab 等）か */
export function commandNeedsUnixShell(cmd) {
  return /\b(tail|grep|crontab|head\s|awk\s|sed\s)\b/.test(cmd);
}

/** bash 構文（export / /home/… / 2>&1 パイプ）— Windows cmd.exe では実行不可 */
export function commandNeedsBashShell(cmd) {
  if (commandNeedsUnixShell(cmd)) return true;
  return (
    /\bexport\s+PATH=/.test(cmd) ||
    /\/home\/[^/]+\//.test(cmd) ||
    (/\|\|/.test(cmd) && /\bcp\b/.test(cmd)) ||
    /2>&1\s*\|/.test(cmd)
  );
}

/**
 * リポ内コマンド実行（morning-prep 用）。
 * - Windows: cmd.exe（npm/node）または WSL bash（unix 専用）
 * - Linux/WSL: bash -lc + NVM bin を PATH 先頭
 */
export function runRepoShellCmd(cmd, opts = {}) {
  const repoRoot = opts.cwd || REPO_ROOT;
  const timeout = opts.timeoutMs ?? 120_000;
  const env = buildRepoProcessEnv(opts.env || {}, repoRoot);

  if (IS_WIN) {
    if (commandNeedsUnixShell(cmd) || commandNeedsBashShell(cmd)) {
      const wslRoot = win32ToWslPath(repoRoot);
      const wslBin = resolveRepoNodeBinDir(repoRoot);
      const inner = `export PATH="${wslBin}:$PATH" && cd '${wslRoot}' && ${cmd}`;
      return spawnSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'bash', '-lc', inner], hiddenOpts({
        encoding: 'utf8',
        timeout,
        env: { ...process.env, TZ: opts.tz || process.env.TZ || 'Asia/Tokyo' },
      }));
    }
    return spawnSync('cmd.exe', ['/d', '/s', '/c', cmd], hiddenOpts({
      cwd: repoRoot,
      encoding: 'utf8',
      timeout,
      env,
    }));
  }

  const binDir = resolveRepoNodeBinDir(repoRoot);
  const wslRoot = repoRoot.replace(/\\/g, '/');
  const inner = `export PATH="${binDir}:$PATH" && cd '${wslRoot}' && ${cmd}`;
  return spawnSync('bash', ['-lc', inner], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout,
    env: { ...env, TZ: opts.tz || process.env.TZ || 'Asia/Tokyo' },
  });
}

/**
 * Linux/WSL で system node (<20) のとき repo NVM node で自身を再実行。
 * @returns {boolean} 再実行した（呼び出し元は process.exit 済み）
 */
export function maybeReexecWithRepoNode(scriptPath, extraArgv = []) {
  if (IS_WIN || process.env.REPO_NODE_REEXEC === '1') return false;
  const cur = spawnSync(process.execPath, ['-v'], { encoding: 'utf8' });
  const major = Number((cur.stdout || 'v0').trim().replace(/^v/i, '').split('.')[0]) || 0;
  if (major >= 20) return false;

  const repoNode = repoNodeExecutable();
  if (path.resolve(repoNode) === path.resolve(process.execPath)) return false;

  const args = [scriptPath, ...extraArgv].filter(Boolean);
  const r = spawnSync(repoNode, args, {
    stdio: 'inherit',
    env: { ...process.env, REPO_NODE_REEXEC: '1' },
  });
  process.exit(typeof r.status === 'number' ? r.status : 1);
  return true;
}

/** Windows ネイティブで daily-morning-prep を実行可能か（簡易） */
export function canRunMorningPrepNative() {
  if (!IS_WIN) return false;
  const major = Number(
    (spawnSync(process.execPath, ['-v'], { encoding: 'utf8' }).stdout || 'v0')
      .trim()
      .replace(/^v/i, '')
      .split('.')[0],
  );
  return major >= 20;
}
