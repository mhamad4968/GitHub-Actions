#!/usr/bin/env node
/**
 * Team ops v3.2 — anti-hollow runtime probes（K）
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAntihollowProbes } from './lib/cio-team-ops-antihollow.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function probeSkipGuardRejectsBannedPhrase() {
  const r = spawnSync(
    process.execPath,
    ['scripts/cio-deepseek-5038-evidence-guard.mjs', '--stamp', '--skip', '形式のみ'],
    { cwd: root, encoding: 'utf8' },
  );
  return (r.status ?? 0) === 1;
}

function main() {
  const issues = [];
  const { ok, issues: libIssues } = runAntihollowProbes();
  if (!ok) issues.push(...libIssues);

  if (!probeSkipGuardRejectsBannedPhrase()) {
    issues.push('runtime: cio:guard:5038 --stamp --skip "形式のみ" should exit 1');
  }

  if (issues.length) {
    console.error('[verify:team-ops-antihollow] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:team-ops-antihollow] OK runtime probes + skip guard');
  process.exit(0);
}

main();
