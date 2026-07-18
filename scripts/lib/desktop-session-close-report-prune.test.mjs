#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pruneStaleSessionCloseReports } from './desktop-session-close-report-prune.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-close-report-prune-'));
try {
  const oldName = 'SESSION-CLOSE-REPORT_20260717.txt';
  const keepName = 'SESSION-CLOSE-REPORT_20260718.txt';
  const unrelated = 'SESSION-CLOSE-REPORT-20260717.txt';
  for (const name of [oldName, keepName, unrelated]) {
    fs.writeFileSync(path.join(dir, name), name, 'utf8');
  }

  assert.deepEqual(pruneStaleSessionCloseReports(dir, '20260718'), [oldName]);
  assert.equal(fs.existsSync(path.join(dir, keepName)), true);
  assert.equal(fs.existsSync(path.join(dir, unrelated)), true);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('[test:desktop-session-close-report-prune] OK');
