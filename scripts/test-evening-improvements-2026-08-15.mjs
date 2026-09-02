#!/usr/bin/env node
/**
 * 2026-08-15 夕反省 GO 針
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coalesceReportRel } from './lib/resolve-archived-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, coalesceReportRel(root, rel)), 'utf8');

for (const rel of [
  'docs/approved-changes/2026-08-15-evening-reflection-hamada-go.md',
  'docs/runbooks/cio-ops-2026-08-15-evening-improvements.md',
  'docs/runbooks/cio-day-close-v1.md',
  'docs/runbooks/cursor-plan-usage-watch.md',
  '.cursor/rules/cio-ops-2026-08-15-evening-improvements.mdc',
  'docs/reports/2026-08-15-evening-reflection.md',
  'scripts/cio-day-close.mjs',
  'scripts/verify-session-close-git-warn.mjs',
]) {
  assert.ok(fs.existsSync(path.join(root, coalesceReportRel(root, rel))), `missing ${rel}`);
}

{
  const go = read('docs/approved-changes/2026-08-15-evening-reflection-hamada-go.md');
  assert.match(go, /すべて承認/);
  assert.match(go, /MCP-2/);
  assert.match(go, /CON-1/);
  assert.match(go, /OPS-1/);
  assert.match(go, /ORG-1/);
  assert.match(go, /RULE-3/);
}

{
  const warn = read('scripts/verify-session-close-git-warn.mjs');
  assert.match(warn, /isPhantomStatDirty/);
  assert.match(warn, /function gitStatusShort/);
  assert.match(warn, /xy\.includes\('\?'\)/);
  assert.match(warn, /xy\.includes\('D'\)/);
  assert.match(warn, /xy\.includes\('R'\)/);
}

{
  const close = read('scripts/cio-day-close.mjs');
  assert.match(close, /運用→体制→MCP→ルール→憲法/);
}

{
  const watch = read('docs/runbooks/cursor-plan-usage-watch.md');
  assert.match(watch, /reset_day/);
  assert.match(watch, /内訳ですか/);
}

{
  const mdc = read('.cursor/rules/cio-ops-2026-08-15-evening-improvements.mdc');
  assert.match(mdc, /alwaysApply:\s*false/);
  assert.doesNotMatch(mdc, /alwaysApply:\s*true/);
}

{
  const pkg = read('package.json');
  assert.match(pkg, /test:evening-improvements-2026-08-15/);
}

console.log('[test:evening-improvements-2026-08-15] OK');
