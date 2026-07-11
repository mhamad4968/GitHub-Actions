/**
 * turn-start tier — quick / standard / strict（v3.2 D）
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  listChangedPaths,
  pathForbiddenForLite,
  sessionTouchesCustomize,
  validateLiteScope,
  workingTreeHasChanges,
} from './cio-team-ops-git-scope.mjs';
import { readTeamOpsFlags } from './cio-team-ops-flags.mjs';

export const TIERS = ['quick', 'standard', 'strict'];

export function resolveTier(requested, root, flags = readTeamOpsFlags()) {
  if (flags.forceStrictTier) return 'strict';
  if (sessionTouchesCustomize(root)) return 'strict';
  const t = String(requested || 'standard').toLowerCase();
  if (t === 'lite' || t === 'micro') return 'lite';
  return TIERS.includes(t) ? t : 'standard';
}

export function tierAllowsEdit(tier) {
  return tier === 'standard' || tier === 'strict';
}

export function tierAllowsShell(tier, scriptName) {
  if (tier === 'quick') {
    return /^verify:|^cio:health|^session:/.test(scriptName || '');
  }
  if (tier === 'standard') {
    return !/^deploy:/.test(scriptName || '');
  }
  return true;
}

export function validateTierGate(root, tier) {
  if (tier === 'quick' && workingTreeHasChanges(root)) {
    return { ok: false, exitCode: 2, message: 'quick tier: working tree に変更あり — standard/strict を使用' };
  }
  if (tier === 'lite') {
    const lite = validateLiteScope(root);
    if (!lite.ok) return { ok: false, exitCode: 2, message: `Lite: ${lite.reason}` };
  }
  for (const p of listChangedPaths(root)) {
    if ((tier === 'quick' || tier === 'standard') && p.startsWith('customize/')) {
      return { ok: false, exitCode: 2, message: 'customize/** は strict のみ' };
    }
    if (tier === 'lite' && pathForbiddenForLite(p)) {
      return { ok: false, exitCode: 2, message: `Lite 禁止: ${p}` };
    }
  }
  return { ok: true };
}

export function liteUsageLogPath(root) {
  return path.join(root, 'logs/cio-turn-start/lite-usage.json');
}

export function recordLiteUsage(root, meta = {}) {
  const logPath = liteUsageLogPath(root);
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  let data = { events: [] };
  if (fs.existsSync(logPath)) {
    try {
      data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch {
      data = { events: [] };
    }
  }
  data.events.push({ at: new Date().toISOString(), ...meta });
  if (data.events.length > 200) data.events = data.events.slice(-200);
  fs.writeFileSync(logPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function printContractForTier(tier, goal, touchFiles, specTouched) {
  if (tier === 'quick') {
    console.log('【ターン契約 — quick】');
    console.log(`Goal: ${String(goal).slice(0, 120)}`);
    console.log('');
    return;
  }
  console.log('【ターン契約 — 応答先頭 §1 の直後に 3 行を転記（形骸化防止）】');
  console.log(`Goal: ${String(goal).slice(0, 120)}`);
  console.log(`Touch: ${touchFiles.join(', ') || '(未設定 — checkpoint を Read)'}`);
  console.log(`SPEC_TOUCHED: ${specTouched}（予定）`);
  console.log('');
}
