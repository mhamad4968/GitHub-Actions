#!/usr/bin/env node
/**
 * Team ops 週次 KPI スナップショット（v3.2 E）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { read5038Stamp } from './lib/cio-four-ai-governance.mjs';
import { loadState, STATE_REL } from './lib/cio-grok-execution.mjs';
import { liteUsageLogPath } from './lib/cio-turn-start-tier.mjs';
import { sessionTouchesCustomize } from './lib/cio-team-ops-git-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readLiteUsage() {
  const p = liteUsageLogPath(root);
  if (!fs.existsSync(p)) return { count: 0, events: [] };
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { count: (j.events || []).length, events: j.events || [] };
  } catch {
    return { count: 0, events: [] };
  }
}

function main() {
  const lite = readLiteUsage();
  const grok = loadState(root);
  const stamp = read5038Stamp(root);
  const customizeSession = sessionTouchesCustomize(root);

  const snapshot = {
    at: new Date().toISOString(),
    customizeSession,
    skip5038Mode: stamp?.mode || null,
    grokSessionCRuns: grok.sessionCRuns ?? 0,
    grokDryRunCount: grok.dryRunCount ?? 0,
    liteUsageCount: lite.count,
    lastFailuresBridge: null,
  };

  const bridgePath = path.join(root, 'docs/handoff/latest-session-bridge.json');
  if (fs.existsSync(bridgePath)) {
    try {
      const b = JSON.parse(fs.readFileSync(bridgePath, 'utf8'));
      snapshot.lastFailuresBridge = (b.lastFailures || []).length;
    } catch {
      /* skip */
    }
  }

  const outDir = path.join(root, 'logs/cio-team-ops');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'metrics-snapshot.json');
  fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log('[cio:team-ops-metrics] snapshot →', outPath);
  console.log(`  customizeSession=${customizeSession}`);
  console.log(`  grokCRuns=${snapshot.grokSessionCRuns} dryRun=${snapshot.grokDryRunCount}`);
  console.log(`  liteUsage=${snapshot.liteUsageCount}`);
  console.log(`  lastFailures=${snapshot.lastFailuresBridge ?? 'n/a'}`);

  if (process.argv.includes('--propose-evening')) {
    const proposals = [];
    if (customizeSession && stamp?.mode === 'skip') {
      proposals.push('#S-OPS-5038-SKIP: customize セッションで 5038 skip — 理由監査');
    }
    if (lite.count > 10) {
      proposals.push('#S-OPS-LITE-HIGH: Lite 使用率が高い — 閾値 L1 見直し');
    }
    if (proposals.length) {
      console.log('\n[evening #S 候補 — 週1上限で手動採用]');
      for (const p of proposals.slice(0, 1)) console.log(`  - ${p}`);
    }
  }

  process.exit(0);
}

main();
