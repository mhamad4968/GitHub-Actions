#!/usr/bin/env node
/**
 * 超自律化インフラ（方針1〜3）— 存在・package.json・憲法追補検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'scripts/lib/cio-composer-escalation.mjs',
  'scripts/cio-composer-escalation-guard.mjs',
  'scripts/cio-task-score-spec.mjs',
  'scripts/lib/cio-handoff-visual-map.mjs',
  '.cursor/rules/cio-composer-escalation-interlock.mdc',
];

const SCRIPTS = [
  'cio:composer:escalation-guard',
  'cio:task:score-spec',
  'verify:cio-autonomous-infra',
];

const AGENTS_MARKERS = [
  '第6層',
  'cio:composer:escalation-guard',
  'cio:task:score-spec',
  '4AI引っ越し完了マッピング表',
  '§35-1',
  '§56-1a',
  '§41',
  '§51',
  '§1-2-2',
  '§52',
];

function main() {
  const issues = [];
  for (const rel of FILES) {
    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing: ${rel}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const s of SCRIPTS) {
    if (!pkg.scripts?.[s]) issues.push(`package.json scripts.${s}`);
  }
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  for (const m of AGENTS_MARKERS) {
    if (!agents.includes(m)) issues.push(`AGENTS.md missing: ${m}`);
  }
  const vh = fs.readFileSync(path.join(root, 'scripts/verify-session-handoff-integrity.mjs'), 'utf8');
  if (!vh.includes('renderHandoffVisualMap')) {
    issues.push('verify-session-handoff-integrity.mjs に visual map 未連結');
  }
  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-autonomous-infra')) {
    issues.push('verify:cio-four-ai-governance に verify-cio-autonomous-infra 未連結');
  }

  if (issues.length) {
    console.error('[verify:cio-autonomous-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-autonomous-infra] OK 方針1〜3 整合');
  process.exit(0);
}

main();
