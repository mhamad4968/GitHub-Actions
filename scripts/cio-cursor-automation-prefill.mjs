#!/usr/bin/env node
/**
 * Cursor Automations 登録用 prefill の表示・検証・クリップボードコピー（Windows）
 *
 * Usage:
 *   npm run cio:cursor-automation:prefill -- --list
 *   npm run cio:cursor-automation:prefill -- --id friday-mcp-health
 *   npm run cio:cursor-automation:prefill -- --id friday-mcp-health --copy
 *   npm run cio:cursor-automation:prefill -- --validate-all
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(root, 'data/cursor-automations');
const MANIFEST = path.join(DIR, 'manifest.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

function validatePrefill(obj) {
  const issues = [];
  if (!obj.name) issues.push('name missing');
  if (!obj.workflow) issues.push('workflow missing');
  if (!obj.workflow?.triggers?.length) issues.push('triggers empty');
  if (!obj.workflow?.prompts?.length) issues.push('prompts empty');
  if (!obj.workflow?.gitConfig?.repo) issues.push('gitConfig.repo missing');
  if (!obj.workflow?.gitConfig?.branch) issues.push('gitConfig.branch missing');
  for (const t of obj.workflow?.triggers || []) {
    if (t.cron && !t.cron.cron) issues.push('cron.cron empty');
    if (t.cron && Object.keys(t.cron).length === 1 && !t.cron.cron) issues.push('invalid cron');
  }
  return issues;
}

function copyWindows(text) {
  try {
    execSync('clip', { input: text, encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const manifest = loadManifest();

  if (args.includes('--list')) {
    console.log('Cursor Automations prefill 一覧:\n');
    for (const a of manifest.automations) {
      console.log(`  ${a.id}`);
      console.log(`    名前: ${a.name}`);
      console.log(`    スケジュール: ${a.schedule}`);
      console.log(`    ファイル: data/cursor-automations/${a.file}\n`);
    }
    console.log('登録手順: docs/runbooks/cursor-automations-register.md');
    console.log('Agents Window で open_automation 可能なら Skill: kintone-cursor-automation-register');
    return;
  }

  if (args.includes('--validate-all')) {
    let ng = 0;
    for (const a of manifest.automations) {
      const p = path.join(DIR, a.file);
      const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
      const issues = validatePrefill(obj);
      if (issues.length) {
        ng++;
        console.error(`NG ${a.id}:`, issues.join(', '));
      } else {
        console.log(`OK ${a.id}`);
      }
    }
    process.exit(ng ? 1 : 0);
  }

  const idIdx = args.indexOf('--id');
  if (idIdx < 0) {
    console.error('Usage: --list | --validate-all | --id <id> [--copy]');
    process.exit(1);
  }
  const id = args[idIdx + 1];
  const entry = manifest.automations.find((a) => a.id === id);
  if (!entry) {
    console.error('Unknown id:', id);
    process.exit(1);
  }
  const raw = fs.readFileSync(path.join(DIR, entry.file), 'utf8');
  const obj = JSON.parse(raw);
  const issues = validatePrefill(obj);
  if (issues.length) {
    console.error('Validation NG:', issues.join(', '));
    process.exit(1);
  }

  const wrapped = JSON.stringify({ prefillWorkflowData: obj }, null, 2);
  console.log('━━ prefillWorkflowData（open_automation 用）━━\n');
  console.log(wrapped);
  console.log('\n━━ 登録手順 ━━');
  console.log('1. Cursor → Automations → New automation');
  console.log('2. Agents Window で「open_automation で prefill を開いて」と依頼');
  console.log('   または手動でトリガー・プロンプト・リポジトリを上記に合わせて入力');
  console.log(`3. リポジトリ: ${manifest.repo} / branch: ${manifest.branch}`);
  console.log('4. Cloud Agent が有効か dashboard で確認');
  console.log('5. Save');

  if (args.includes('--copy')) {
    if (copyWindows(wrapped)) {
      console.log('\n✅ クリップボードにコピーしました（Agents Window 貼付用）');
    } else {
      console.log('\n⚠ clip 失敗 — 上記 JSON を手動コピー');
    }
  }
}

main();
