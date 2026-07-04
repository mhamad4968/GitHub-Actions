#!/usr/bin/env node
/**
 * 736 deploy 前ゲート — build-desktop + ux-gate + sync-gate + calc-gate + rowkey-gate + lint + diff-smoke リマインド
 * @see docs/runbooks/push-deploy-quality-gates-v2.md
 * @see docs/runbooks/jikkou-yosan-ux-regression-gate.md
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const diffSmokePath = path.join(root, 'docs/runbooks/jikkou-yosan-diff-smoke.md');

function runNpm(script) {
  const r = runNpmScriptSync(root, script, [], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

function runNode(rel, args = []) {
  const r = spawnSync(node, [path.join(root, rel), ...args], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

function main() {
  console.log('[jikkou-yosan:deploy-gate] build-desktop → ux-gate → sync-gate → calc-gate → rowkey-gate → lint:customize');
  runNpm('jikkou-yosan:build-desktop');
  runNode('scripts/jikkou-yosan-ux-gate.mjs');
  runNode('scripts/jikkou-yosan-ui-js-sync-gate.mjs', ['--skip-mtime']);
  runNpm('jikkou-yosan:calc-gate');
  runNpm('jikkou-yosan:rowkey-gate');
  runNpm('lint:customize');

  if (!existsSync(diffSmokePath)) {
    console.warn(
      '[jikkou-yosan:deploy-gate] ⚠️ R15/B-2 WARN: docs/runbooks/jikkou-yosan-diff-smoke.md がありません',
    );
  } else {
    console.log('[jikkou-yosan:deploy-gate] diff-smoke runbook: docs/runbooks/jikkou-yosan-diff-smoke.md');
    console.log('[jikkou-yosan:deploy-gate] deploy 前に手動スモーク（差分+UX）を実施し handoff に 1 行記録してください');
  }

  console.log('[jikkou-yosan:deploy-gate] OK app=736');
}

main();
