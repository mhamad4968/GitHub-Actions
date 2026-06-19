#!/usr/bin/env node
/**
 * 朝の立ち上げワンコマンド — rollup → handoff → 鮮度 → health → 実装前ゲート
 *
 * Usage:
 *   npm run cio:morning:ready
 *   npm run cio:morning:ready -- --project business-improvement
 *   npm run cio:morning:ready -- --skip-health
 *   npm run cio:morning:ready -- --full-morning
 *
 * 推奨: 新セッションは `npm run cio:session:cold-start`（本スクリプト + bootstrap を統合）
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { formatClosureBanner, isProjectClosed } from './lib/cio-project-closure.mjs';
import { ensureMorningPrep, runSessionPreflight } from './lib/cio-session-preflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  console.log(`\n━━ ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
  const skipHealth = process.argv.includes('--skip-health');
  const skipRollup = process.argv.includes('--skip-rollup');
  const fullMorning = process.argv.includes('--full-morning');
  const projIdx = process.argv.indexOf('--project');
  const project = projIdx >= 0 ? process.argv[projIdx + 1] : null;

  console.log('═══════════════════════════════════════');
  console.log('  CIO 朝 ready（立ち上げ一括）');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════\n');

  // 朝報（未作成なら fast 自動生成）
  console.log('▶ 朝報 ensure');
  const morning = ensureMorningPrep(root, { fast: !fullMorning });
  console.log(`[cio:morning:ready] morning: ${morning.action} ok=${morning.ok}`);
  if (!morning.ok) {
    console.error('[cio:morning:ready] ❌ 朝報を生成できませんでした');
    process.exit(2);
  }

  // 引き継ぎ修復（scores + 必要時 bridge）
  console.log('\n▶ preflight');
  const pf = runSessionPreflight(root);
  console.log(`[cio:morning:ready] preflight: ${pf.actions.join(' → ')}`);
  for (const w of pf.warnings) console.warn(`[cio:morning:ready] ⚠ ${w}`);
  if (!pf.ok) {
    console.error('[cio:morning:ready] ❌ preflight 失敗');
    process.exit(2);
  }

  if (!skipRollup) {
    run('npm run cio:checkpoint:rollup');
  }

  run('npm run cio:session:export-handoff');
  run('npm run verify:session-handoff-integrity -- --strict-staleness');
  run('npm run verify:checkpoint-project-closure');

  if (!skipHealth) {
    try {
      run('npm run cio:quick-health');
    } catch {
      console.warn('[cio:morning:ready] quick-health NG — 続行（--skip-health で省略可）');
    }
  }

  if (project) {
    if (isProjectClosed(root, project)) {
      console.log(`\n${formatClosureBanner(root, project)}\n`);
      console.warn('[cio:morning:ready] --project はクローズ済 — pre-implement はスキップされます\n');
    }
    run(`npm run cio:morning:pre-implement -- --project ${project}`);
  } else {
    if (!isProjectClosed(root, 'business-improvement')) {
      console.log('\n💡 業務改善（未クローズ）: npm run cio:morning:ready -- --project business-improvement\n');
    } else {
      console.log('\n💡 業務改善 ver.02 v1 クローズ済 — 当日レーンは 項番 -0 で合意\n');
    }
  }

  console.log('═══════════════════════════════════════');
  console.log('  朝 ready 完了 — 次: npm run cio:session:cold-start または session:bootstrap');
  console.log('  Skill: kintone-session-bootstrap');
  console.log('  索引: data/cio-project-lanes.json');
  console.log('═══════════════════════════════════════\n');
}

main();
