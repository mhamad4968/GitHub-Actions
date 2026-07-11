#!/usr/bin/env node
/**
 * doc-lane lite スコープ — JSON 正本 ↔ git-scope ↔ マトリクス整合
 * @see docs/plans/2026-07-11-constitution-round3-master-spec.md R3-7
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LITE_FORBIDDEN_CONSTITUTION_PREFIXES,
  LITE_FORBIDDEN_EXACT,
  LITE_FORBIDDEN_PREFIXES,
  LITE_MAX_LINES,
  pathForbiddenForLite,
} from './lib/cio-team-ops-git-scope.mjs';
import { loadDocLaneLiteScope, pathForbiddenForLiteScope } from './lib/cio-doc-lane-lite-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function main() {
  const issues = [];
  const scope = loadDocLaneLiteScope(root);

  if (!arraysEqual(scope.forbiddenPrefixes, LITE_FORBIDDEN_PREFIXES)) {
    issues.push('git-scope LITE_FORBIDDEN_PREFIXES ≠ cio-doc-lane-lite-scope.json');
  }
  if (!arraysEqual(scope.forbiddenConstitutionPrefixes, LITE_FORBIDDEN_CONSTITUTION_PREFIXES)) {
    issues.push('git-scope LITE_FORBIDDEN_CONSTITUTION_PREFIXES ≠ JSON');
  }
  if (!arraysEqual(scope.forbiddenExact, LITE_FORBIDDEN_EXACT)) {
    issues.push('git-scope LITE_FORBIDDEN_EXACT ≠ JSON');
  }
  if ((scope.limits?.maxAddedLines ?? 20) !== LITE_MAX_LINES) {
    issues.push('git-scope LITE_MAX_LINES ≠ JSON limits.maxAddedLines');
  }

  const matrix = JSON.parse(
    fs.readFileSync(path.join(root, 'data/cio-turn-start-tier-lane-matrix.json'), 'utf8'),
  );
  if (matrix.lanes?.['doc-lane']?.lite !== true) {
    issues.push('tier matrix: doc-lane lite must be true');
  }
  if (matrix.lanes?.report?.lite !== false || matrix.lanes?.customize?.lite !== false) {
    issues.push('tier matrix: report/customize lite must be false');
  }

  const lifecycle = fs.readFileSync(
    path.join(root, 'docs/plans/2026-07-11-constitution-lifecycle-v2-spec.md'),
    'utf8',
  );
  if (!lifecycle.includes('cio-doc-lane-lite-scope.json')) {
    issues.push('lifecycle-v2-spec §6 missing cio-doc-lane-lite-scope.json pointer');
  }
  if (!lifecycle.includes('docs/constitution/25–28')) {
    issues.push('lifecycle-v2-spec §6 missing 25–28 charter prefixes');
  }
  if (!lifecycle.includes('E4')) {
    issues.push('lifecycle-v2-spec §6 missing E4 boundary');
  }

  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  if (!agents.includes('doc-lane lite')) {
    issues.push('AGENTS.md missing doc-lane lite row');
  }

  const registry = JSON.parse(
    fs.readFileSync(path.join(root, 'data/cio-formalization-registry.json'), 'utf8'),
  );
  const h8 = registry.items?.find((i) => i.id === 'H8');
  if (!h8) issues.push('registry missing H8');

  const cases = [
    { p: 'docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md', forbidden: false },
    { p: 'chat-sessions/checkpoint-latest.md', forbidden: false },
    { p: 'AGENTS.md', forbidden: true },
    { p: 'customize/736/desktop.js', forbidden: true },
    { p: 'data/cio-rule-entry-points.json', forbidden: true },
    { p: 'docs/constitution/27-constitution-navigation-charter.md', forbidden: true },
    { p: 'scripts/verify-constitution-evening.mjs', forbidden: true },
    { p: 'scripts/cio-turn-start.mjs', forbidden: true },
  ];
  for (const { p, forbidden } of cases) {
    const a = pathForbiddenForLite(p);
    const b = pathForbiddenForLiteScope(scope, p);
    if (a !== b) issues.push(`scope mismatch for ${p}: git-scope=${a} json=${b}`);
    if (a !== forbidden) issues.push(`expected forbidden=${forbidden} for ${p}, got ${a}`);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.['verify:doc-lane-lite-scope']) {
    issues.push('package.json missing verify:doc-lane-lite-scope');
  }

  if (!scope.e4Boundary?.e4StillApplies) {
    issues.push('JSON missing e4Boundary.e4StillApplies');
  }

  if (issues.length) {
    console.error('[verify:doc-lane-lite-scope] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:doc-lane-lite-scope] OK (JSON · git-scope · matrix · E4 boundary)');
  process.exit(0);
}

main();
