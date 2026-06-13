/**
 * Windows 上で cmd / PowerShell の一瞬フラッシュを抑える spawn ヘルパー
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';

export function hiddenOpts(extra = {}) {
  if (process.platform !== 'win32') return extra;
  return { ...extra, windowsHide: true };
}

export function runNodeScriptSync(repoRoot, scriptRel, args = [], opts = {}) {
  const script = path.isAbsolute(scriptRel) ? scriptRel : path.join(repoRoot, scriptRel);
  return spawnSync(process.execPath, [script, ...args], hiddenOpts({
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    ...opts,
  }));
}

/** 既定ブラウザを開く（Windows: rundll32 — cmd.exe 不要） */
export function openUrlInBrowser(url) {
  if (!url || typeof url !== 'string') return { ok: false, method: 'none' };
  if (process.platform === 'win32') {
    const r = spawnSync('rundll32.exe', ['url.dll,FileProtocolHandler', url], hiddenOpts({
      stdio: 'ignore',
      timeout: 10_000,
    }));
    return { ok: !r.error && r.status === 0, method: 'rundll32' };
  }
  if (process.platform === 'darwin') {
    const r = spawnSync('open', [url], { stdio: 'ignore' });
    return { ok: !r.error && r.status === 0, method: 'open' };
  }
  const r = spawnSync('xdg-open', [url], { stdio: 'ignore' });
  return { ok: !r.error && r.status === 0, method: 'xdg-open' };
}

export function runPowerShellSync(command, opts = {}) {
  return spawnSync('powershell.exe', ['-NoProfile', '-Command', command], hiddenOpts({
    encoding: 'utf8',
    shell: false,
    ...opts,
  }));
}

/** Windows: npm.cmd + windowsHide。Unix: npm + shell:false（cmd フラッシュ回避） */
export function npmExecutable() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

/**
 * @param {string} cwd
 * @param {string} script package.json scripts キー
 * @param {string[]} [args] `--` 以降
 */
export function runNpmScriptSync(cwd, script, args = [], opts = {}) {
  const npmArgs = args.length ? ['run', script, '--', ...args] : ['run', script];
  return spawnSync(npmExecutable(), npmArgs, hiddenOpts({
    cwd,
    stdio: opts.stdio ?? 'inherit',
    shell: false,
    env: opts.env ?? process.env,
    ...opts,
  }));
}

export function hiddenSpawn(exe, args, opts = {}) {
  return spawn(exe, args, hiddenOpts(opts));
}
