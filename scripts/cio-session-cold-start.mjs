#!/usr/bin/env node
/**
 * セッション cold-start 統合オーケストレータ
 *
 *   npm run cio:session:cold-start
 *   npm run cio:session:cold-start -- --skip-bootstrap
 *   npm run cio:session:cold-start -- --full-morning   # 朝報をフル生成
 *
 * 状態: IDLE → MORNING → PREFLIGHT → ROLLUP → BOOTSTRAP → IMPORT → READY
 *
 * @see docs/runbooks/session-cold-start-v1.md
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { jstYmdIso } from './lib/repo-node-env.mjs';
import {
  ensureMorningPrep,
  readMorningPrepMode,
  runNpmScript,
  runSessionPreflight,
} from './lib/cio-session-preflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd) {
  console.log(`\n━━ ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
  const skipBootstrap = process.argv.includes('--skip-bootstrap');
  const skipRollup = process.argv.includes('--skip-rollup');
  const fullMorning = process.argv.includes('--full-morning');
  const ymd = jstYmdIso();

  console.log('═══════════════════════════════════════');
  console.log('  CIO session cold-start（統合立ち上げ）');
  console.log(`  ${new Date().toISOString()}  JST ${ymd}`);
  console.log('═══════════════════════════════════════\n');

  // Phase 1 — 朝報（無ければ fast 生成。--full-morning で常にフル）
  console.log('▶ Phase 1 MORNING');
  if (fullMorning) {
    const r = ensureMorningPrep(root, { fast: false });
    console.log(`[cold-start] morning: ${r.action} ok=${r.ok}`);
    if (!r.ok) {
      console.error('[cold-start] ❌ morning-prep 生成失敗 — 以降は続行しますが §46 要確認');
    }
  } else {
    const mode = readMorningPrepMode(root, ymd);
    if (mode === 'missing') {
      const r = ensureMorningPrep(root, { fast: true });
      console.log(`[cold-start] morning: ${r.action} ok=${r.ok}`);
      if (!r.ok) {
        console.error('[cold-start] ❌ fast morning-prep 失敗');
        process.exit(2);
      }
    } else {
      console.log(`[cold-start] morning: 既存 (${mode}) — スキップ`);
    }
  }

  // Phase 2 — 引き継ぎ修復（scores + bridge 鮮度）
  console.log('\n▶ Phase 2 PREFLIGHT');
  const pf = runSessionPreflight(root, { forceHandoff: false });
  console.log(`[cold-start] preflight actions: ${pf.actions.join(' → ')}`);
  for (const w of pf.warnings) console.warn(`[cold-start] ⚠ ${w}`);
  if (!pf.ok) {
    console.error('[cold-start] ❌ preflight に失敗ステップあり');
    process.exit(2);
  }

  // Phase 3 — 凍結ゾーン + rollup + handoff 整合
  console.log('\n▶ Phase 3 ROLLUP');
  run('npm run verify:checkpoint-freeze-zone -- --auto-rollup');
  if (!skipRollup) {
    run('npm run cio:checkpoint:rollup -- --keep 3');
  }
  run('npm run cio:session:export-handoff');
  run('npm run verify:session-handoff-integrity -- --strict-staleness');
  run('npm run verify:checkpoint-project-closure');

  // Phase 4 — quick health（朝報 verify 込み）
  console.log('\n▶ Phase 4 QUICK-HEALTH');
  try {
    run('npm run cio:quick-health');
  } catch {
    console.warn('[cold-start] quick-health NG — 詳細は上記ログ。bootstrap は続行可');
  }

  // Phase 5 — bootstrap + import
  if (!skipBootstrap) {
    console.log('\n▶ Phase 5 BOOTSTRAP');
    run('npm run session:bootstrap');
  }

  console.log('\n▶ Phase 6 IMPORT');
  run('npm run verify:session-handoff-integrity -- --import');

  console.log('\n═══════════════════════════════════════');
  console.log('  cold-start READY');
  console.log('  Skill: .cursor/skills/kintone-session-bootstrap/SKILL.md');
  console.log('  Lifecycle: docs/runbooks/session-lifecycle-v2.md');
  console.log('═══════════════════════════════════════\n');
}

main();
