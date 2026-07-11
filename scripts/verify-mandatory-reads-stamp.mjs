#!/usr/bin/env node
/**
 * mandatory_reads stamp 配線検証（entry-points ↔ cold-start ↔ sessionStart）
 * @see docs/plans/2026-07-11-constitution-round3-master-spec.md R3-5
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditMandatoryReadFiles,
  flattenMandatoryReads,
  loadMandatoryReads,
} from './lib/cio-mandatory-reads-entry-points.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const issues = [];
  const cold = fs.readFileSync(path.join(root, 'scripts/cio-session-cold-start.mjs'), 'utf8');
  const hook = fs.readFileSync(
    path.join(root, '.cursor/hooks/session-start-autopilot.mjs'),
    'utf8',
  );

  if (!cold.includes('cio:mandatory-reads:stamp')) {
    issues.push('cio-session-cold-start.mjs missing cio:mandatory-reads:stamp phase');
  }
  if (!hook.includes('cio-mandatory-reads-stamp.mjs')) {
    issues.push('session-start-autopilot.mjs missing mandatory-reads stamp');
  }

  const mr = loadMandatoryReads(root);
  if (!mr.wake_once_per_session.length) {
    issues.push('entry-points E1 missing wake_once_per_session');
  }
  if (!mr.every_session.length) {
    issues.push('entry-points E1 missing every_session');
  }

  const audit = auditMandatoryReadFiles(root);
  for (const { rel, exists } of audit) {
    if (!exists) issues.push(`mandatory_reads missing on disk: ${rel}`);
  }

  const flat = flattenMandatoryReads(mr);
  if (flat.length < 9) {
    issues.push(`mandatory_reads too few paths (${flat.length})`);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.['cio:mandatory-reads:stamp']) {
    issues.push('package.json missing cio:mandatory-reads:stamp');
  }

  if (issues.length) {
    console.error('[verify:mandatory-reads-stamp] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log(`[verify:mandatory-reads-stamp] OK (${flat.length} paths · cold-start · sessionStart)`);
  process.exit(0);
}

main();
