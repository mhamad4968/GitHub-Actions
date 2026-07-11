#!/usr/bin/env node
/**
 * Team ops v3.2 — 統合 verify（H）: needles + antihollow + infra
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readTeamOpsFlags } from './lib/cio-team-ops-flags.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  { rel: 'docs/plans/2026-07-11-ai-team-ops-optimization-spec-v32.md', needles: ['形骸化防止原則', 'verify:team-ops-v2', 'Phase 1'] },
  { rel: 'scripts/lib/cio-team-ops-skip-quality.mjs', needles: ['SKIP_BANNED_PHRASES', 'validateSkipReason'] },
  { rel: 'scripts/lib/cio-team-ops-flags.mjs', needles: ['CIO_LITE_LANE', 'CIO_TURN_TIER_STRICT'] },
  { rel: 'scripts/lib/cio-turn-start-tier.mjs', needles: ['quick', 'strict', 'validateTierGate'] },
  { rel: 'scripts/verify-team-ops-antihollow.mjs', needles: ['runAntihollowProbes'] },
  { rel: 'scripts/cio-guard-5038-session-audit.mjs', needles: ['sessionTouchesCustomize'] },
  { rel: 'scripts/cio-grok-contract-preset.mjs', needles: ['contractHash', '--dry-run'] },
  { rel: 'scripts/cio-team-ops-metrics.mjs', needles: ['liteUsage', 'grok'] },
  { rel: 'docs/runbooks/cio-architect-threshold-checklist.md', needles: ['architect-review', '月 2 回'] },
  { rel: 'scripts/cio-turn-start.mjs', needles: ['--tier', 'validateTierGate', 'lite'] },
];

function runNode(rel) {
  const r = spawnSync(process.execPath, [path.join(root, rel)], { cwd: root, stdio: 'inherit' });
  return (r.status ?? 1) === 0;
}

function main() {
  const issues = [];
  for (const { rel, needles } of REQUIRED) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      issues.push(`missing ${rel}`);
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    for (const n of needles) {
      if (!text.includes(n)) issues.push(`${rel} missing: ${n}`);
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const s of [
    'verify:team-ops-v2',
    'verify:team-ops-antihollow',
    'cio:guard:5038-session-audit',
    'cio:grok:contract-preset',
    'cio:team-ops-metrics',
  ]) {
    if (!pkg.scripts?.[s]) issues.push(`package.json scripts.${s}`);
  }

  const flags = readTeamOpsFlags();
  if (!flags.liteLaneEnabled && flags.forceStrictTier) {
    issues.push('flags: both CIO_LITE_LANE=0 and CIO_TURN_TIER_STRICT=1');
  }

  if (issues.length) {
    console.error('[verify:team-ops-v2] NG needles', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }

  if (!runNode('scripts/verify-team-ops-antihollow.mjs')) {
    console.error('[verify:team-ops-v2] NG antihollow chain');
    process.exit(1);
  }

  console.log('[verify:team-ops-v2] OK needles + runtime probes');
  process.exit(0);
}

main();
