#!/usr/bin/env node
/**
 * data/cio-session-close-chain.json ↔ CLOSE .mdc ↔ session-lifecycle-v2.md 整合
 * @see docs/plans/2026-07-11-rules-optimization-spec.md §11.1
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHAIN = path.join(root, 'data', 'cio-session-close-chain.json');

const MDC_PATHS = [
  '.cursor/rules/session-boundary-close-gate.mdc',
  '.cursor/rules/session-close-execute-first.mdc',
];

const LIFECYCLE = path.join(root, 'docs/runbooks/session-lifecycle-v2.md');

function fail(msg) {
  console.error(`[verify:rules-close-chain] ❌ ${msg}`);
  process.exit(2);
}

function main() {
  const issues = [];
  if (!fs.existsSync(CHAIN)) fail('missing data/cio-session-close-chain.json');

  const chain = JSON.parse(fs.readFileSync(CHAIN, 'utf8'));
  const npmSteps = chain.fullClose.steps
    .filter((s) => s.npm)
    .map((s) => (s.args?.length ? `${s.npm} ${s.args.join(' ')}` : s.npm));

  for (const rel of MDC_PATHS) {
    const body = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const step of chain.fullClose.steps) {
      if (!step.npm) continue;
      const needle = step.npm;
      if (!body.includes(needle)) {
        issues.push(`${rel}: missing npm step ${needle}`);
      }
    }
    if (!body.includes('R-SESS-01')) issues.push(`${rel}: missing R-SESS-01`);
    if (!body.includes('R-SESS-03')) issues.push(`${rel}: missing R-SESS-03`);
  }

  const life = fs.readFileSync(LIFECYCLE, 'utf8');
  for (const step of chain.fullClose.steps) {
    if (!step.npm) continue;
    if (!life.includes(step.npm)) {
      issues.push(`session-lifecycle-v2.md: missing ${step.npm}`);
    }
  }

  const boundary = fs.readFileSync(
    path.join(root, '.cursor/rules/session-boundary-close-gate.mdc'),
    'utf8',
  );
  const syncIdx = boundary.indexOf('session-starter:sync-desktop');
  const gitIdx = boundary.indexOf('cio:session:close-git');
  if (syncIdx < 0 || gitIdx < 0 || syncIdx > gitIdx) {
    issues.push('session-boundary-close-gate: sync-desktop must appear before close-git');
  }

  if (issues.length) {
    for (const i of issues) console.error('  -', i);
    fail(`${issues.length} issue(s)`);
  }

  console.log(
    `[verify:rules-close-chain] ✅ OK (${npmSteps.length} npm steps · R-SESS-01/03 · 3 surfaces)`,
  );
  process.exit(0);
}

main();
