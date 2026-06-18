#!/usr/bin/env node
import { buildSample2623001, verifySample, EXPECTED } from './jikkou-yosan-sample-2623001.mjs';

const state = buildSample2623001();
const fails = verifySample(state);
if (fails.length) {
  console.error('FAIL', fails.join('; '));
  process.exit(1);
}
console.log('OK calc-gate 2623001-001', EXPECTED);
