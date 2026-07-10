#!/usr/bin/env node
/**
 * 18 恒久対策パッケージの存在検証（2026-05-30）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'scripts/cio-turn-start.mjs',
  'scripts/cio-doc-lane-gate.mjs',
  'docs/runbooks/cio-18-violation-root-cause-2026-05-30.md',
  '.cursor/rules/cio-18-zero-tolerance.mdc',
  'chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt',
];

const PKG_SCRIPTS = ['cio:turn-start', 'cio:doc-lane-gate', 'verify:cio-18-countermeasures'];

function main() {
  const issues = [];

  for (const rel of REQUIRED) {
    if (!fs.existsSync(path.join(root, rel))) {
      issues.push(`missing file: ${rel}`);
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const name of PKG_SCRIPTS) {
    if (!pkg.scripts?.[name]) issues.push(`package.json scripts.${name} 未定義`);
  }

  const eighteen = fs.readFileSync(
    path.join(root, 'chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt'),
    'utf8'
  );
  if (!eighteen.includes('2026-05-30 追記・18違反根本原因と恒久対策')) {
    issues.push('18-重要確認.txt に 2026-05-30 恒久対策追記なし');
  }
  if (!eighteen.includes('npm run cio:turn-start')) {
    issues.push('18-重要確認.txt に cio:turn-start 未記載');
  }
  if (!eighteen.includes('cio:session:close-git')) {
    issues.push('18-重要確認.txt に cio:session:close-git 未記載');
  }
  if (!eighteen.includes('B1/B4')) {
    issues.push('18-重要確認.txt に B1/B4 未記載');
  }

  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-18-countermeasures')) {
    issues.push('verify:cio-four-ai-governance に verify:cio-18-countermeasures 未連結');
  }

  const turnStart = fs.readFileSync(path.join(root, 'scripts/cio-turn-start.mjs'), 'utf8');
  for (const needle of ['【ターン契約', 'Goal:', 'Touch:', 'SPEC_TOUCHED:']) {
    if (!turnStart.includes(needle)) {
      issues.push(`cio-turn-start.mjs missing turn contract: ${needle}`);
    }
  }

  if (issues.length) {
    console.error('[verify:cio-18-countermeasures] NG');
    for (const i of issues) console.error(`  - ${i}`);
    process.exit(1);
  }

  console.log('[verify:cio-18-countermeasures] OK 恒久対策パッケージ整合');
  process.exit(0);
}

main();
