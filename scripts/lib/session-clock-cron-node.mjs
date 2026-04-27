/**
 * session-split crontab 行の **想定 node パス**（install-cron と health で共有）。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** @returns {string} */
export function resolveNodeForCron() {
  const envNode = process.env.KINTONE_AI_LAB_NODE;
  if (envNode && fs.existsSync(envNode)) return path.resolve(envNode);

  const sh = spawnSync('bash', ['-lc', 'command -v node 2>/dev/null || true'], { encoding: 'utf8' });
  const fromShell = ((sh.stdout || '').trim().split('\n')[0] || '').trim();
  if (fromShell && fs.existsSync(fromShell) && !fromShell.includes('.cursor-server')) return fromShell;

  const nvmNode = pickLatestNvmNode();
  if (nvmNode) return nvmNode;

  return process.execPath;
}

function pickLatestNvmNode() {
  const base = path.join(os.homedir(), '.nvm', 'versions', 'node');
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base)
    .map((d) => d.replace(/^v/, ''))
    .filter((d) => /^\d+\.\d+\.\d+/.test(d));
  if (!dirs.length) return null;
  dirs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const latest = dirs[dirs.length - 1];
  const p = path.join(base, `v${latest}`, 'bin', 'node');
  return fs.existsSync(p) ? p : null;
}

/** crontab -l（失敗・空は ''） */
export function readCrontabText() {
  const r = spawnSync('crontab', ['-l'], { encoding: 'utf8' });
  if (r.status !== 0) {
    const err = `${r.stderr || ''}`.toLowerCase();
    if (err.includes('no crontab') || err.includes('cannot open')) return '';
    return '';
  }
  return r.stdout || '';
}

/** @param {string} tab */
export function findSessionSplitCronLine(tab) {
  const lines = tab.split(/\r?\n/);
  return lines.find((l) => l.includes('session-split-cron-ping.mjs')) ?? null;
}

/**
 * cron 行から node バイナリの絶対パスを抜き出す（`… && <node> …/session-split-cron-ping.mjs` 想定）。
 * @param {string} line
 * @returns {string | null}
 */
export function extractNodeFromCronLine(line) {
  if (!line || !line.includes('session-split-cron-ping.mjs')) return null;
  const parts = line.split('&&').map((s) => s.trim());
  const seg = [...parts].reverse().find((p) => p.includes('session-split-cron-ping.mjs'));
  if (!seg) return null;
  const segClean = seg.split(/\s*>>\s*/)[0].split(/\s*#/)[0].trim();
  const toks = segClean.split(/\s+/).filter(Boolean);
  if (toks.length < 2) return null;
  const script = toks[toks.length - 1];
  if (!script.includes('session-split-cron-ping.mjs')) return null;
  let nodeBin = toks[toks.length - 2];
  nodeBin = nodeBin.replace(/^'|'$/g, '');
  if (!/\/node$/.test(nodeBin)) return null;
  return nodeBin;
}
