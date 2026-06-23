#!/usr/bin/env node
import { buildSample2623001, verifySample, EXPECTED } from './jikkou-yosan-sample-2623001.mjs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const state = buildSample2623001();
const fails = verifySample(state);
if (fails.length) {
  console.error('FAIL', fails.join('; '));
  process.exit(1);
}

const rowkey = spawnSync(process.execPath, ['scripts/jikkou-yosan-rowkey-gate.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (rowkey.status !== 0) process.exit(rowkey.status || 1);

console.log('OK calc-gate 2623001-001', EXPECTED);
