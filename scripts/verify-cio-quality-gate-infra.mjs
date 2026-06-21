#!/usr/bin/env node
/**
 * B v2 品質ゲート infra 検査
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'docs/runbooks/push-deploy-quality-gates-v2.md',
  'data/cio-app-quality-gates.json',
  'scripts/cio-quality-gate.mjs',
  'scripts/jikkou-yosan-deploy-gate.mjs',
  'scripts/lib/cio-eslint-report-summary.mjs',
];

const needles = [
  { rel: 'scripts/git-hook-pre-push.mjs', needles: ['cio-quality-gate.mjs', '--push'] },
  { rel: 'data/cio-app-quality-gates.json', needles: ['736', '687', '688', 'jikkou-yosan:deploy-gate'] },
  { rel: 'docs/runbooks/session-lifecycle-v2.md', needles: ['cio:pre-commit-check', 'push-deploy-quality-gates-v2'] },
];

function main() {
  const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)));
  if (missing.length) {
    console.error('[verify:cio-quality-gate-infra] NG missing', missing.join(', '));
    process.exit(1);
  }
  for (const { rel, needles: ns } of needles) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const n of ns) {
      if (!text.includes(n)) {
        console.error(`[verify:cio-quality-gate-infra] NG "${n}" not in ${rel}`);
        process.exit(1);
      }
    }
  }
  console.log('[verify:cio-quality-gate-infra] OK B v2 push/deploy quality gates');
  process.exit(0);
}

main();
