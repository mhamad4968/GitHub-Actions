#!/usr/bin/env node
/**
 * 7/1 デモ導線スモーク（骨格）
 * - 実装OK seal 確認
 * - Space 57 設定
 * - Playwright MCP / chrome-devtools は手動または Phase D 自動化へ委譲
 *
 * Usage:
 *   npm run smoke:bi-demo -- --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEAL = path.join(root, 'docs/handoff/implementation-ok-seal.json');

const DEMO_STEPS = [
  '新③ ご利用ガイドを開く（Space 57）',
  '共有IDで「提案を出す」',
  '新① 申請画面 — 部署・代表提案者・種別・5ブロック',
  '部長個人IDで評価待ち一覧',
  '評価・承認（または差戻し→再申請）',
  '新② 社員検索が動作',
];

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const issues = [];

  if (!fs.existsSync(SEAL)) {
    issues.push('implementation-ok-seal.json 未記録（デモ本番前に必須）');
  } else {
    const seal = JSON.parse(fs.readFileSync(SEAL, 'utf8'));
    if (seal.project !== 'business-improvement-ver02') {
      issues.push(`seal.project=${seal.project}（期待: business-improvement-ver02）`);
    }
  }

  console.log('═══════════════════════════════════════');
  console.log('  業務改善 7/1 デモ導線スモーク');
  console.log(`  mode: ${dryRun ? 'dry-run' : 'check'}`);
  console.log('═══════════════════════════════════════\n');

  if (issues.length) {
    console.log('⚠ 前提未充足:');
    issues.forEach((i) => console.log(`  - ${i}`));
    console.log('');
  }

  console.log('デモステップ（Playwright / chrome-devtools MCP で実施）:');
  DEMO_STEPS.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));

  console.log('\nツール: user-playwright / user-chrome-devtools MCP');
  console.log('正本: docs/runbooks/cursor-automations-weekly.md §デモスモーク');

  if (!dryRun && issues.length) process.exit(1);
  console.log('\n[smoke:bi-demo] OK scaffold');
}

main();
