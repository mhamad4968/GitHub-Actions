#!/usr/bin/env node
/**
 * R10 — 687/688 deploy 前ゲート一括（R1 verify-built-ui + R4 calc-gate）
 * Usage: node scripts/workdays-deploy-gate.mjs <687|688>
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const app = String(process.argv[2] || '').trim();
if (!['687', '688'].includes(app)) {
  console.error('[workdays-deploy-gate] Usage: node scripts/workdays-deploy-gate.mjs <687|688>');
  process.exit(2);
}

const node = process.execPath;
const steps = [
  ['scripts/workdays-verify-built-ui.mjs', app],
  ['scripts/workdays-calc-gate.mjs'],
];

for (const args of steps) {
  const r = spawnSync(node, args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

console.log(`[workdays-deploy-gate] OK app=${app}`);
