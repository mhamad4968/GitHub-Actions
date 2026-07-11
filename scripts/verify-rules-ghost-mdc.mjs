#!/usr/bin/env node
/**
 * 幽霊 .mdc リンク解消 — persist-policies / preflight-checklist 実在
 * @see docs/plans/2026-07-11-rules-optimization-spec.md T2/T3
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDir = path.join(root, '.cursor/rules');

const REQUIRED = ['persist-policies.mdc', 'preflight-checklist.mdc'];

function fail(msg) {
  console.error(`[verify:rules-ghost-mdc] ❌ ${msg}`);
  process.exit(2);
}

function main() {
  const issues = [];
  for (const f of REQUIRED) {
    const abs = path.join(rulesDir, f);
    if (!fs.existsSync(abs)) issues.push(`missing ${f}`);
    else {
      const raw = fs.readFileSync(abs, 'utf8');
      if (!/^---\r?\n[\s\S]*?\r?\n---/.test(raw)) issues.push(`${f}: no frontmatter`);
      if (/alwaysApply:\s*true/.test(raw.split('---').slice(0, 3).join('---'))) {
        issues.push(`${f}: must not be alwaysApply true`);
      }
    }
  }

  const con = path.join(rulesDir, 'constitution.mdc');
  if (fs.existsSync(con)) {
    const body = fs.readFileSync(con, 'utf8');
    for (const f of REQUIRED) {
      if (!body.includes(f)) {
        issues.push(`constitution.mdc: no link to ${f} (optional warn)`);
      }
    }
  }

  const warnings = issues.filter((i) => i.includes('optional warn'));
  const errors = issues.filter((i) => !i.includes('optional warn'));

  if (errors.length) {
    for (const e of errors) console.error('  -', e);
    fail(`${errors.length} error(s)`);
  }

  console.log(`[verify:rules-ghost-mdc] ✅ OK (${REQUIRED.join(', ')})`);
  if (warnings.length) {
    for (const w of warnings) console.warn(`[verify:rules-ghost-mdc] ⚠ ${w}`);
  }
  process.exit(0);
}

main();
