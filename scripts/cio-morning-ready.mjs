#!/usr/bin/env node
/**
 * 朝の立ち上げワンコマンド — rollup → handoff → 鮮度 → health → 実装前ゲート
 *
 * Usage:
 *   npm run cio:morning:ready
 *   npm run cio:morning:ready -- --project business-improvement
 *   npm run cio:morning:ready -- --skip-health
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  console.log(`\n━━ ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
  const skipHealth = process.argv.includes('--skip-health');
  const skipRollup = process.argv.includes('--skip-rollup');
  const projIdx = process.argv.indexOf('--project');
  const project = projIdx >= 0 ? process.argv[projIdx + 1] : null;

  console.log('═══════════════════════════════════════');
  console.log('  CIO 朝 ready（立ち上げ一括）');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════\n');

  if (!skipRollup) {
    run('npm run cio:checkpoint:rollup');
  }

  run('npm run cio:session:export-handoff');
  run('npm run verify:session-handoff-integrity -- --strict-staleness');

  if (!skipHealth) {
    try {
      run('npm run cio:quick-health');
    } catch {
      console.warn('[cio:morning:ready] quick-health NG — 続行（--skip-health で省略可）');
    }
  }

  if (project) {
    run(`npm run cio:morning:pre-implement -- --project ${project}`);
  } else {
    console.log('\n💡 業務改善: npm run cio:morning:ready -- --project business-improvement\n');
  }

  console.log('═══════════════════════════════════════');
  console.log('  朝 ready 完了 — Skill: kintone-session-bootstrap');
  console.log('  索引: data/cio-project-lanes.json');
  console.log('═══════════════════════════════════════\n');
}

main();
