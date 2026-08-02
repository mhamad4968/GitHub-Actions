#!/usr/bin/env node
/**
 * ナレッジWAKE 配線検証（registry ↔ cold-start ↔ sessionStart）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveNeedles } from './lib/cio-active-knowledge-needles.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const issues = [];
  const cold = fs.readFileSync(path.join(root, 'scripts/cio-session-cold-start.mjs'), 'utf8');
  const hook = fs.readFileSync(
    path.join(root, '.cursor/hooks/session-start-autopilot.mjs'),
    'utf8',
  );

  if (!cold.includes('cio:knowledge:wake-stamp')) {
    issues.push('cio-session-cold-start.mjs missing cio:knowledge:wake-stamp phase');
  }
  if (!hook.includes('cio-knowledge-wake-stamp.mjs')) {
    issues.push('session-start-autopilot.mjs missing knowledge-wake stamp');
  }

  const { active, issues: needleIssues } = auditActiveNeedles(root);
  for (const i of needleIssues) issues.push(i);
  if (!active.length) {
    issues.push('no active knowledge needles (registry empty?)');
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.['cio:knowledge:wake-stamp']) {
    issues.push('package.json missing cio:knowledge:wake-stamp');
  }
  if (!pkg.scripts?.['verify:knowledge-wake-stamp']) {
    issues.push('package.json missing verify:knowledge-wake-stamp');
  }

  if (issues.length) {
    console.error('[verify:knowledge-wake-stamp] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log(
    `[verify:knowledge-wake-stamp] OK (active=${active.length} · cold-start · sessionStart)`,
  );
  process.exit(0);
}

main();
