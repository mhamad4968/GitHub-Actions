#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { coalesceReportRel, resolveReportRel } from './resolve-archived-report.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-report-'));
const liveRel = 'docs/reports/2026-08-11-evening-reflection.md';

try {
  assert.equal(resolveReportRel(tmp, liveRel), null);
  assert.equal(coalesceReportRel(tmp, liveRel), liveRel);
  assert.equal(coalesceReportRel(tmp, 'scripts/lib/foo.mjs'), 'scripts/lib/foo.mjs');

  const archDir = path.join(tmp, 'docs', 'reports', 'archive', '2026-08');
  fs.mkdirSync(archDir, { recursive: true });
  fs.writeFileSync(path.join(archDir, '2026-08-11-evening-reflection.md'), 'archived\n');
  assert.equal(resolveReportRel(tmp, liveRel), 'docs/reports/archive/2026-08/2026-08-11-evening-reflection.md');
  assert.equal(coalesceReportRel(tmp, liveRel), 'docs/reports/archive/2026-08/2026-08-11-evening-reflection.md');

  const liveDir = path.join(tmp, 'docs', 'reports');
  fs.mkdirSync(liveDir, { recursive: true });
  fs.writeFileSync(path.join(liveDir, '2026-08-11-evening-reflection.md'), 'live\n');
  assert.equal(resolveReportRel(tmp, liveRel), liveRel);
  assert.equal(coalesceReportRel(tmp, liveRel), liveRel);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('[test:resolve-archived-report] OK');
