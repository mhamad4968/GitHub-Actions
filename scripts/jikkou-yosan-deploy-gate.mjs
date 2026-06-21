#!/usr/bin/env node
/**
 * 736 deploy 前ゲート — build-desktop + calc-gate + lint
 * @see docs/runbooks/push-deploy-quality-gates-v2.md
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNpm(script) {
  const r = runNpmScriptSync(root, script, [], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

function main() {
  console.log('[jikkou-yosan:deploy-gate] build-desktop → calc-gate → lint:customize');
  runNpm('jikkou-yosan:build-desktop');
  runNpm('jikkou-yosan:calc-gate');
  runNpm('lint:customize');
  console.log('[jikkou-yosan:deploy-gate] OK app=736');
}

main();
