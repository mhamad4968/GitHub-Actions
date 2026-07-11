#!/usr/bin/env node
/**
 * Team ops v3.3 — anti-hollow runtime probes（K · △H1 完走）
 */
import fs from 'node:fs';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAntihollowProbes } from './lib/cio-team-ops-antihollow.mjs';
import { workingTreeHasChanges } from './lib/cio-team-ops-git-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function probeSkipGuardRejectsBannedPhrase() {
  const r = spawnSync(
    process.execPath,
    ['scripts/cio-deepseek-5038-evidence-guard.mjs', '--stamp', '--skip', '形式のみ'],
    { cwd: root, encoding: 'utf8' },
  );
  return (r.status ?? 0) === 1;
}

function probeTurnStartStrictNoEvidence() {
  const stampPath = path.join(root, 'logs/cio-four-ai-governance/5038-stamp.json');
  let backup = null;
  try {
    if (fs.existsSync(stampPath)) {
      backup = fs.readFileSync(stampPath, 'utf8');
      fs.unlinkSync(stampPath);
    }
    const r = spawnSync(process.execPath, ['scripts/cio-turn-start.mjs', '--strict'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CIO_TURN_START_PROBE_NO_EVIDENCE: '1' },
    });
    return (r.status ?? 0) === 2;
  } finally {
    if (backup !== null) {
      fs.mkdirSync(path.dirname(stampPath), { recursive: true });
      fs.writeFileSync(stampPath, backup);
    }
  }
}

function probeQuickTierBlocksDirtyTree() {
  if (!workingTreeHasChanges(root)) return true;
  const r = spawnSync(process.execPath, ['scripts/cio-turn-start.mjs', '--tier', 'quick'], {
    cwd: root,
    encoding: 'utf8',
  });
  return (r.status ?? 0) === 2;
}

function main() {
  const issues = [];
  const { ok, issues: libIssues } = runAntihollowProbes();
  if (!ok) issues.push(...libIssues);

  if (!probeSkipGuardRejectsBannedPhrase()) {
    issues.push('runtime: cio:guard:5038 --stamp --skip "形式のみ" should exit 1');
  }
  if (!probeTurnStartStrictNoEvidence()) {
    issues.push('runtime: cio:turn-start --strict without evidence should exit 2');
  }
  if (!probeQuickTierBlocksDirtyTree()) {
    issues.push('runtime: cio:turn-start --tier quick with dirty tree should exit 2');
  }

  if (issues.length) {
    console.error('[verify:team-ops-antihollow] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:team-ops-antihollow] OK runtime probes 3/3 + lib');
  process.exit(0);
}

main();
