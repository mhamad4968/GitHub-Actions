#!/usr/bin/env node
/**
 * §↔mdc マップと RULES-INDEX 自動節の整合
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildMergedMap, toJsonSerializable } from './lib/rules-index-section-mdc.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BEGIN = '<!-- RULES-INDEX:SECTION-MDC-AUTO:BEGIN -->';

function main() {
  const issues = [];
  const ri = fs.readFileSync(path.join(root, 'RULES-INDEX.md'), 'utf8');
  if (!ri.includes(BEGIN)) {
    issues.push('RULES-INDEX missing SECTION-MDC-AUTO — run npm run rules:sync-section-mdc');
  }

  const mapPath = path.join(root, 'data', 'rules-index-section-mdc-map.json');
  if (!fs.existsSync(mapPath)) {
    issues.push('missing data/rules-index-section-mdc-map.json');
  } else {
    const onDisk = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const fresh = toJsonSerializable(buildMergedMap(root));
    if (JSON.stringify(onDisk.sectionToMdc) !== JSON.stringify(fresh.sectionToMdc)) {
      issues.push('section-mdc-map.json stale — run npm run rules:sync-section-mdc');
    }
  }

  const must = ['§1-2-3-4', '§50-3-8', '§50-3-11'];
  if (fs.existsSync(mapPath)) {
    const m = JSON.parse(fs.readFileSync(mapPath, 'utf8')).sectionToMdc;
    for (const s of must) {
      if (!m[s]?.length) issues.push(`map missing required ${s}`);
    }
  }

  if (issues.length) {
    console.error('[verify-rules-index-section-mdc] NG', issues.length);
    for (const x of issues) console.error('  -', x);
    process.exit(1);
  }
  console.log('[verify-rules-index-section-mdc] OK');
  process.exit(0);
}

main();
