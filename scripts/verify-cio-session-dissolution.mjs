#!/usr/bin/env node
/**
 * 3重コンテキスト強制解体インフラ — 存在・package.json 連結検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'scripts/lib/cio-session-bridge.mjs',
  'scripts/cio-session-turn-guard.mjs',
  'scripts/cio-session-export-handoff.mjs',
  'scripts/verify-session-handoff-integrity.mjs',
  '.cursor/rules/cio-context-dissolution-interlock.mdc',
  'docs/handoff/.gitkeep',
];

const PKG = [
  'cio:session:export-handoff',
  'cio:session:turn-guard',
  'verify:session-handoff-integrity',
  'verify:cio-session-dissolution',
];

function main() {
  const issues = [];
  for (const rel of REQUIRED) {
    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing: ${rel}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const name of PKG) {
    if (!pkg.scripts?.[name]) issues.push(`package.json scripts.${name}`);
  }
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  if (!agents.includes('cio:session:export-handoff')) {
    issues.push('AGENTS.md に cio:session:export-handoff 未記載');
  }
  if (!agents.includes('15ターン')) issues.push('AGENTS.md に 15ターン 未記載');
  const mdc = fs.readFileSync(path.join(root, '.cursor/rules/mode-b-canonical.mdc'), 'utf8');
  if (!mdc.includes('mermaid')) issues.push('mode-b-canonical.mdc に mermaid 図解なし');

  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-session-dissolution')) {
    issues.push('verify:cio-four-ai-governance に verify-cio-session-dissolution 未連結');
  }

  if (issues.length) {
    console.error('[verify:cio-session-dissolution] NG');
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-session-dissolution] OK 3重解体インフラ整合');
  process.exit(0);
}

main();
