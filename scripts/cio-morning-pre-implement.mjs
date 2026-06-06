#!/usr/bin/env node
/**
 * 朝の実装前ゲート一括 — 浜田「実装OK」サイン前の AI 再確認用
 *
 * Usage:
 *   npm run cio:morning:pre-implement
 *   npm run cio:morning:pre-implement -- --project business-improvement
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PROJECTS = {
  'business-improvement': {
    label: '業務改善提案 ver.02',
    gates: [
      'npm run business-improvement:compare-83',
      'npm run cio:pre-implement-gate -- --strict',
    ],
    reads: [
      'docs/plans/2026-05-23-business-improvement-proposal-spec.md',
      'docs/plans/2026-05-28-business-improvement-implementation-handbook.md',
      'docs/plans/2026-05-23-business-improvement-proposal-spec-checklist.md',
    ],
    hamadaConfirmed: [
      '設定マスタ Excel 30行 — 確定版',
      '本社部長評価 — あり（E列 LoginID）',
      '人事部長共通 — jinji',
      'Space 57 — ログイン確認済み',
      '着手 — 実装OKサイン後（6/7 or 6/8）',
    ],
    scopeB1: [
      '新①②③④ スケルトン（fields + create-app）',
      '新④: 30行 + jinji + 評価20段階',
      'customize はサイン後の別フェーズ',
      '新⑤・旧83/84移行は対象外',
    ],
  },
};

function run(cmd) {
  console.log(`\n━━ ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
  const projIdx = process.argv.indexOf('--project');
  const projectKey = projIdx >= 0 ? process.argv[projIdx + 1] : null;
  const project = projectKey ? PROJECTS[projectKey] : null;

  console.log('═══════════════════════════════════════');
  console.log('  CIO 朝の実装前ゲート');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════');
  console.log('\n⚠ 人間ゲート: 本スクリプト成功 ≠ 実装OK。浜田サイン必須。\n');

  run('npm run cio:guard:5038 --stamp');

  if (project) {
    console.log(`\n📋 プロジェクト: ${project.label}\n`);
    for (const g of project.gates) run(g);
    console.log('\n── 浜田確定事項（2026-06-06）──');
    project.hamadaConfirmed.forEach((l) => console.log(`  ✅ ${l}`));
    console.log('\n── 案B1 スコープ ──');
    project.scopeB1.forEach((l) => console.log(`  • ${l}`));
    console.log('\n── 必読正本 ──');
    for (const rel of project.reads) {
      const ok = fs.existsSync(path.join(root, rel));
      console.log(`  ${ok ? '✅' : '❌'} ${rel}`);
    }
  } else {
    run('npm run cio:pre-implement-gate -- --strict');
    console.log('\n💡 業務改善: npm run cio:morning:pre-implement -- --project business-improvement');
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  次: 仕様突合サマリを浜田に提示 →「実装OK」待ち');
  console.log('═══════════════════════════════════════\n');
}

main();
