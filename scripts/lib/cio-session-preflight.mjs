/**
 * セッション cold-start 前の自律修復（bridge・task-scores・朝報）
 * @see docs/runbooks/session-cold-start-v1.md
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { readCheckpointLastUpdatedDate, readCheckpointNextTask } from './cio-checkpoint-read.mjs';
import { loadBridge } from './cio-session-bridge.mjs';
import { readSessionClockMode } from './session-clock-mode.mjs';

function runNode(root, scriptArgs, { stdio = 'inherit' } = {}) {
  return spawnSync(process.execPath, scriptArgs, { cwd: root, stdio });
}

/** @returns {{ ok: boolean, code: number|null }} */
export function runNpmScript(root, scriptName, extraArgs = []) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const res = spawnSync(npmCmd, ['run', scriptName, '--', ...extraArgs], {
    cwd: root,
    stdio: 'inherit',
  });
  return { ok: res.status === 0, code: res.status };
}

/**
 * bridge が checkpoint より古い、または nextTask 不一致
 * @returns {boolean}
 */
export function isBridgeStale(root, { maxAgeHours = 48 } = {}) {
  const bridge = loadBridge(root);
  if (!bridge?.exportedAt) return true;

  const exportedMs = Date.parse(bridge.exportedAt);
  if (!Number.isFinite(exportedMs)) return true;
  if (Date.now() - exportedMs > maxAgeHours * 3600 * 1000) return true;

  const cpTask = readCheckpointNextTask(root);
  if (cpTask && bridge.nextTask && normalizeTask(bridge.nextTask) !== normalizeTask(cpTask)) {
    return true;
  }

  const cpDate = readCheckpointLastUpdatedDate(root);
  if (cpDate && bridge.exportedAt) {
    const expYmd = bridge.exportedAt.slice(0, 10);
    if (cpDate > expYmd) return true;
  }

  return false;
}

function normalizeTask(s) {
  return String(s || '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @returns {{ ok: boolean, actions: string[], warnings: string[] }}
 */
export function runSessionPreflight(root, options = {}) {
  const actions = [];
  const warnings = [];
  const forceHandoff = options.forceHandoff === true;
  let ok = true;

  const score = runNode(root, [path.join('scripts', 'cio-task-score-spec.mjs')]);
  actions.push('cio:task:score-spec');
  if (score.status !== 0) {
    ok = false;
    warnings.push(`cio:task:score-spec exit ${score.status}`);
  }

  if (forceHandoff || isBridgeStale(root)) {
    const exp = runNode(root, [path.join('scripts', 'cio-session-export-handoff.mjs')]);
    actions.push('cio:session:export-handoff');
    if (exp.status !== 0) {
      ok = false;
      warnings.push(`export-handoff exit ${exp.status}`);
    }
  }

  const clockMode = readSessionClockMode(root);
  if (clockMode.trialPaused) {
    warnings.push(
      'session-clock trialPaused=true — bootstrap strict は cron 検査スキップ（意図停止）',
    );
  }

  return { ok, actions, warnings };
}

/**
 * 当日朝報が無ければ生成（--fast で短時間版）
 * @returns {{ ok: boolean, action: string }}
 */
export function ensureMorningPrep(root, options = {}) {
  const fast = options.fast === true;
  const verify = runNode(root, [path.join('scripts', 'morning-prep-ensure.mjs'), '--verify-only'], {
    stdio: 'pipe',
  });
  if (verify.status === 0) {
    return { ok: true, action: 'verified' };
  }

  const args = [path.join('scripts', 'morning-prep-ensure.mjs')];
  if (fast) args.push('--fast');

  const gen = runNode(root, args);
  return {
    ok: gen.status === 0,
    action: fast ? 'generated-fast' : 'generated-full',
  };
}

/**
 * morning-prep レポートの mode マーカー（fast/full）を読む
 * @returns {'fast'|'full'|'missing'|'unknown'}
 */
export function readMorningPrepMode(root, ymd) {
  const p = path.join(root, 'docs', 'reports', `${ymd}-morning-prep.md`);
  if (!fs.existsSync(p)) return 'missing';
  const head = fs.readFileSync(p, 'utf8').slice(0, 2000);
  if (/MORNING_PREP_MODE:\s*fast/i.test(head)) return 'fast';
  if (/MORNING_PREP_MODE:\s*full/i.test(head)) return 'full';
  return 'unknown';
}
