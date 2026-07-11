#!/usr/bin/env node
/**
 * Team ops 週次 KPI スナップショット（v3.3 E）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { read5038Stamp } from './lib/cio-four-ai-governance.mjs';
import { loadState } from './lib/cio-grok-execution.mjs';
import { liteUsageLogPath, lastTierPath } from './lib/cio-turn-start-tier.mjs';
import { sessionTouchesCustomize } from './lib/cio-team-ops-git-scope.mjs';
import { appendMetricsDaily } from './lib/cio-formalization-h9-review.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadThresholds() {
  const p = path.join(root, 'data/cio-team-ops-kpi-thresholds.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readEvents(logRel) {
  const p = path.join(root, logRel);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')).events || [];
  } catch {
    return [];
  }
}

function isoWeek(d = new Date()) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
  const year = x.getUTCFullYear();
  const week = Math.ceil(((x - new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function countReportVerifyFailures() {
  const dir = path.join(root, 'logs/cio-report-verify');
  if (!fs.existsSync(dir)) return 0;
  const weekAgo = Date.now() - 7 * 86400000;
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    try {
      if (fs.statSync(p).mtimeMs >= weekAgo) n += 1;
    } catch {
      /* skip */
    }
  }
  return n;
}

function grokSuccessRate(state) {
  const hist = state.history || [];
  const starts = hist.filter((h) => h.event === 'c-start').length;
  const wins = hist.filter((h) => h.event === 'success').length;
  if (!starts) return null;
  return Math.round((wins / starts) * 100);
}

function readEveningProposals() {
  const p = path.join(root, 'logs/cio-team-ops/evening-proposals.json');
  if (!fs.existsSync(p)) return { weeks: {} };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { weeks: {} };
  }
}

export function canProposeEvening(rootRef = root) {
  const th = loadThresholds();
  const data = readEveningProposals();
  const wk = isoWeek();
  const count = data.weeks?.[wk] || 0;
  return count < (th.eveningProposalMaxPerWeek || 1);
}

export function recordEveningProposal(rootRef = root, id) {
  const p = path.join(rootRef, 'logs/cio-team-ops/evening-proposals.json');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const data = readEveningProposals();
  const wk = isoWeek();
  data.weeks = data.weeks || {};
  data.weeks[wk] = (data.weeks[wk] || 0) + 1;
  data.last = { at: new Date().toISOString(), id, week: wk };
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function main() {
  const th = loadThresholds();
  const lite = readEvents('logs/cio-turn-start/lite-usage.json');
  const turns = readEvents('logs/cio-turn-start/events.json');
  const grok = loadState(root);
  const stamp = read5038Stamp(root);
  const customizeSession = sessionTouchesCustomize(root);

  const liteRate =
    turns.length > 0 ? Math.round((lite.length / turns.length) * 100) : 0;
  const skip5038Rate = customizeSession && stamp?.mode === 'skip' ? 100 : 0;
  const grokRate = grokSuccessRate(grok);
  const reportFails = countReportVerifyFailures();

  let lastFailuresBridge = null;
  const bridgePath = path.join(root, 'docs/handoff/latest-session-bridge.json');
  if (fs.existsSync(bridgePath)) {
    try {
      lastFailuresBridge = JSON.parse(fs.readFileSync(bridgePath, 'utf8')).lastFailures?.length ?? 0;
    } catch {
      /* skip */
    }
  }

  const reds = [];
  if (skip5038Rate > th.red.skip5038RateCustomizePct) reds.push('skip5038Rate');
  if (grokRate !== null && grokRate < th.red.grokCSuccessRatePctMin) reds.push('grokCRate');
  if (liteRate > th.red.liteUsageRatePct) reds.push('liteUsage');
  if (reportFails >= th.red.reportVerifyFailuresPerWeek) reds.push('reportVerify');
  if (lastFailuresBridge !== null && lastFailuresBridge >= th.red.bridgeLastFailuresCount) {
    reds.push('lastFailures');
  }

  const snapshot = {
    at: new Date().toISOString(),
    customizeSession,
    skip5038Rate,
    grokCSuccessRate: grokRate,
    liteUsageRate: liteRate,
    reportVerifyFailures: reportFails,
    lastFailuresBridge,
    reds,
    grokSessionCRuns: grok.sessionCRuns ?? 0,
    grokDryRunCount: grok.dryRunCount ?? 0,
    lastTier: fs.existsSync(lastTierPath(root))
      ? JSON.parse(fs.readFileSync(lastTierPath(root), 'utf8'))
      : null,
  };

  const outDir = path.join(root, 'logs/cio-team-ops');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'metrics-snapshot.json');
  fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  appendMetricsDaily(root, snapshot);

  console.log('[cio:team-ops-metrics] snapshot →', outPath);
  console.log(`  skip5038Rate=${skip5038Rate}% liteUsage=${liteRate}% reportFails=${reportFails}`);
  console.log(`  grokCRate=${grokRate ?? 'n/a'} lastFailures=${lastFailuresBridge ?? 'n/a'}`);
  if (reds.length) console.warn(`  RED: ${reds.join(', ')}`);

  const proposals = [];
  if (canProposeEvening() && customizeSession && stamp?.mode === 'skip') {
    proposals.push('#S-OPS-5038-SKIP: customize セッションで 5038 skip — 理由監査');
  }
  if (canProposeEvening() && liteRate > th.red.liteUsageRatePct) {
    proposals.push('#S-OPS-LITE-HIGH: Lite 使用率が閾値超 — L1 見直し');
  }
  const auditAfter = Date.parse(th.strictAuditEligibleAfter || '');
  if (
    canProposeEvening() &&
    !Number.isNaN(auditAfter) &&
    Date.now() >= auditAfter &&
    (reds.includes('skip5038Rate') || reds.includes('liteUsage'))
  ) {
    proposals.push('#S-OPS-STRICT-AUDIT: strict 遵守・skip/Lite 監査（週次）');
  }

  if (process.argv.includes('--propose-evening') && proposals.length) {
    const p = proposals[0];
    console.log('\n[evening #S 候補 — 手動採用]');
    console.log(`  - ${p}`);
    recordEveningProposal(root, p);
  }

  if (reds.length && process.argv.includes('--write-red-runbook')) {
    const rb = path.join(root, 'docs/runbooks/cio-team-ops-kpi-red.md');
    const line = `- ${snapshot.at} RED: ${reds.join(', ')} — handoff 確認\n`;
    fs.appendFileSync(rb, line, 'utf8');
    console.log(`[cio:team-ops-metrics] RED 行追記 → ${rb}`);
  }

  process.exit(0);
}

main();
