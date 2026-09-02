/**
 * turn-start tier — quick / standard / strict / lite（v3.2 D · v3.3 A-2）
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
import { isForceStrictActive } from './cio-team-ops-warn-escalation.mjs';

export const TIERS = ['quick', 'standard', 'strict'];
export const LAST_TIER_REL = 'logs/cio-turn-start/last-tier.json';
export const MATRIX_REL = 'data/cio-turn-start-tier-lane-matrix.json';

export function lastTierPath(root) {
  return path.join(root, LAST_TIER_REL);
}

export function loadLaneMatrix(root) {
  const p = path.join(root, MATRIX_REL);
  if (!fs.existsSync(p)) return { lanes: { default: { quick: true, standard: true, strict: true, lite: true } } };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function validateLaneTier(lane, tier, root) {
  if (sessionTouchesCustomize(root)) {
    if (tier !== 'strict') {
      return { ok: false, exitCode: 2, message: 'customize/** は strict のみ' };
    }
    return { ok: true };
  }
  const matrix = loadLaneMatrix(root);
  const laneKey = String(lane || 'default');
  const row = matrix.lanes?.[laneKey];
  if (!row) return { ok: true };
  if (row[tier] === false) {
    return { ok: false, exitCode: 2, message: `lane=${laneKey} tier=${tier} はマトリクス禁止` };
  }
  return { ok: true };
}

export function resolveTier(requested, root, flags = readTeamOpsFlags(process.env, root)) {
  if (flags.forceStrictTier || isForceStrictActive(root)) return 'strict';
  if (sessionTouchesCustomize(root)) return 'strict';
  const t = String(requested || 'standard').toLowerCase();
  if (t === 'lite' || t === 'micro') return 'lite';
  return TIERS.includes(t) ? t : 'standard';
}

export function tierAllowsEdit(tier) {
  return tier === 'standard' || tier === 'strict' || tier === 'lite';
}

export function tierAllowsShell(tier, scriptName) {
  if (tier === 'quick') {
    return /^verify:|^cio:health|^session:/.test(scriptName || '');
  }
  if (tier === 'lite') {
    return /^verify:|^cio:health|^session:|^cio:turn-start/.test(scriptName || '');
  }
  if (tier === 'standard') {
    return !/^deploy:/.test(scriptName || '');
  }
  return true;
}

export function validateTierGate(root, tier, lane = 'default') {
  const laneCheck = validateLaneTier(lane, tier, root);
  if (!laneCheck.ok) return laneCheck;

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

export function writeLastTier(root, { tier, lane }) {
  const p = lastTierPath(root);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const payload = { tier, lane: lane || 'default', at: new Date().toISOString() };
  fs.writeFileSync(p, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

export function readLastTier(root) {
  const p = lastTierPath(root);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function recordTurnStartEvent(root, meta = {}) {
  const logPath = path.join(root, 'logs/cio-turn-start/events.json');
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
  if (data.events.length > 300) data.events = data.events.slice(-300);
  fs.writeFileSync(logPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
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

/**
 * checkpoint「次の1手」と現行レーンが違うとき、--goal で契約 Goal だけ上書きする（#O1）。
 * checkpoint 本文は書き換えない。
 */
export function resolveTurnStartGoal(checkpointGoal, overrideGoal) {
  const checkpoint = String(checkpointGoal || '').trim() || '(checkpoint-latest.md を Read)';
  const override = String(overrideGoal || '').trim();
  if (!override) {
    return { goal: checkpoint, overridden: false, checkpointGoal: checkpoint };
  }
  return {
    goal: override,
    overridden: override !== checkpoint,
    checkpointGoal: checkpoint,
  };
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

/** turn-start TEMPLATES と整合（K3 medal 検査用） */
export const LANE_MEDAL_LINES = {
  default: '[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=実装 | DeepSeek=§50-3-8 | Kimi=review',
  'doc-lane': '[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=doc-lane | DeepSeek=§50-3-8 | Kimi=review',
  report: '[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=— | DeepSeek=突合 | Kimi=review',
};

export function expectedMedalLine(lane) {
  return LANE_MEDAL_LINES[lane] || LANE_MEDAL_LINES.default;
}
