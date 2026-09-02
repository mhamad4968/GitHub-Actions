#!/usr/bin/env node
/**
 * 2026-07-28 夕反省 GO 実装テスト（#R-UI-VIS-01 / #D-GHA-01）
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coalesceReportRel } from './lib/resolve-archived-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;

for (const rel of [
  'docs/approved-changes/2026-07-28-evening-reflection-hamada-go.md',
  'docs/runbooks/jikkou-yosan-v2-chrome-accept-checklist.md',
  'docs/runbooks/gha-fix-handoff-one-liner.md',
  'docs/reports/2026-07-28-evening-reflection.md',
  'scripts/cio-handoff-gha-fix.mjs',
]) {
  assert.ok(fs.existsSync(path.join(root, coalesceReportRel(root, rel))), `missing ${rel}`);
}

{
  const chrome = fs.readFileSync(
    path.join(root, 'docs/runbooks/jikkou-yosan-v2-chrome-accept-checklist.md'),
    'utf8',
  );
  assert.match(chrome, /#R-UI-VIS-01/);
  assert.match(chrome, /視覚1巡/);
  assert.match(chrome, /定義及び品名/);
}

{
  const rb = fs.readFileSync(
    path.join(root, 'docs/runbooks/gha-fix-handoff-one-liner.md'),
    'utf8',
  );
  assert.match(rb, /#D-GHA-01/);
  assert.match(rb, /cio:handoff:gha-fix/);
}

{
  const dry = spawnSync(
    node,
    [
      path.join(root, 'scripts/cio-handoff-gha-fix.mjs'),
      '--dry-run',
      '--cause',
      'inventory ACTIVE 68≠66',
      '--fix',
      'HEAD',
      '--workflow',
      'constitution-gates',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(dry.status, 0, dry.stderr || dry.stdout);
  assert.match(dry.stdout || '', /GHA是正: inventory ACTIVE 68≠66/);
  assert.match(dry.stdout || '', /#D-GHA-01/);
}

{
  const bad = spawnSync(
    node,
    [path.join(root, 'scripts/cio-handoff-gha-fix.mjs'), '--dry-run'],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(bad.status, 2);
}

console.log('[test:evening-improvements-2026-07-28] OK');
