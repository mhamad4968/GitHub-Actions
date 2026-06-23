#!/usr/bin/env node
/**
 * 736 deploy 前ゲート — build-desktop + calc-gate + rowkey-gate + lint + diff-smoke リマインド
 * @see docs/runbooks/push-deploy-quality-gates-v2.md
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const diffSmokePath = path.join(root, 'docs/runbooks/jikkou-yosan-diff-smoke.md');

function runNpm(script) {
  const r = runNpmScriptSync(root, script, [], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

function main() {
  console.log('[jikkou-yosan:deploy-gate] build-desktop → calc-gate → lint:customize');
  runNpm('jikkou-yosan:build-desktop');
  runNpm('jikkou-yosan:calc-gate');
  runNpm('lint:customize');

  if (!existsSync(diffSmokePath)) {
    console.warn(
      '[jikkou-yosan:deploy-gate] ⚠️ R15/B-2 WARN: docs/runbooks/jikkou-yosan-diff-smoke.md がありません',
    );
  } else {
    console.log('[jikkou-yosan:deploy-gate] diff-smoke runbook: docs/runbooks/jikkou-yosan-diff-smoke.md');
    console.log('[jikkou-yosan:deploy-gate] deploy 前に手動スモークを実施し handoff に 1 行記録してください');
  }

  console.log('[jikkou-yosan:deploy-gate] OK app=736');
}

main();
