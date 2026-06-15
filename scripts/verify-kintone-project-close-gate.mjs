#!/usr/bin/env node
/**
 * R36 — kintone CLOSED 前ゲート（lint + spec-close + customize registry）
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNpm(script) {
  const r = spawnSync('npm', ['run', script, '--silent'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  return r.status === 0;
}

function main() {
  const steps = [
    'lint:customize',
    'verify:cio-spec-close-git',
    'verify:kintone-customize-path-registry',
    'verify:constitution-handoff',
    'verify:checkpoint-archive-tracked',
  ];
  const failed = [];
  for (const s of steps) {
    if (!runNpm(s)) failed.push(s);
  }
  if (failed.length) {
    console.error('[verify:kintone-project-close-gate] NG', failed.join(', '));
    process.exit(1);
  }
  console.log('[verify:kintone-project-close-gate] OK R36 lint + R24 + R37 + handoff + archive');
  process.exit(0);
}

main();
