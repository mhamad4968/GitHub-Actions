#!/usr/bin/env node
/**
 * 736 push 前 — ui/js 変更検知時に build + ux/sync ゲート
 * customize/736 未変更なら no-op（高速）
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const UI = 'customize/736/desktop.ui.js';
const BUILT = 'customize/736/desktop.js';
const PREFIX = 'customize/736/';

function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (r.status !== 0 && r.status !== 1) {
    console.warn('[jikkou-yosan:pre-push-gate] git warn', args.join(' '), r.stderr?.trim());
  }
  return (r.stdout || '').split(/\r?\n/).filter(Boolean);
}

function changed736() {
  const sets = [
    git(['diff', '--name-only', 'HEAD']),
    git(['diff', '--name-only', '--cached']),
    git(['ls-files', '--others', '--exclude-standard', PREFIX]),
  ];
  const all = new Set(sets.flat());
  return [...all].some((f) => f.startsWith(PREFIX));
}

function uiChangedWithoutBuilt() {
  const changed = new Set([
    ...git(['diff', '--name-only', 'HEAD']),
    ...git(['diff', '--name-only', '--cached']),
  ]);
  const uiTouched = [...changed].includes(UI);
  const builtTouched = [...changed].includes(BUILT);
  return uiTouched && !builtTouched;
}

function runNode(rel, extraArgs = []) {
  const r = spawnSync(node, [path.join(root, rel), ...extraArgs], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

function runNpm(script) {
  const r = runNpmScriptSync(root, script, [], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

function main() {
  if (!changed736()) {
    console.log('[jikkou-yosan:pre-push-gate] skip — customize/736 unchanged');
    return;
  }

  console.log('[jikkou-yosan:pre-push-gate] customize/736 changed — ux/sync checks');

  if (uiChangedWithoutBuilt()) {
    console.error('[jikkou-yosan:pre-push-gate] NG desktop.ui.js changed but desktop.js not in diff');
    console.error('[jikkou-yosan:pre-push-gate] → npm run jikkou-yosan:build-desktop && git add customize/736/desktop.js');
    process.exit(1);
  }

  runNode('scripts/jikkou-yosan-ux-gate.mjs');
  runNode('scripts/jikkou-yosan-ui-js-sync-gate.mjs');
  runNpm('jikkou-yosan:rowkey-gate');

  console.log('[jikkou-yosan:pre-push-gate] OK app=736');
}

main();
