#!/usr/bin/env node
/**
 * 第11層 土日環境改善3大自律インフラ — 整合検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'data/kintone-field-registry.json',
  'data/kintone-field-allowlist.json',
  'scripts/lib/kintone-field-extract.mjs',
  'scripts/verify-kintone-fields.mjs',
  'scripts/cio-commit-msg-kimi-draft.mjs',
  'git-hooks/prepare-commit-msg',
  '.cursor/hooks/prepare-commit-msg.sh',
  'scripts/lib/cio-handoff-export-validate.mjs',
  '.cursor/rules/cio-kintone-fields-gate.mdc',
  '.cursor/rules/cio-commit-msg-kimi-gate.mdc',
  '.cursor/rules/cio-handoff-export-validate-gate.mdc',
];

const SCRIPTS = [
  'verify:kintone-fields',
  'cio:commit-msg:kimi-draft',
  'verify:cio-weekend-layer11-infra',
];

const AGENTS_MARKERS = [
  '第11層',
  'verify:kintone-fields',
  'cio:commit-msg:kimi-draft',
  '--validate-export',
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
  if (!vh.includes('--validate-export')) {
    issues.push('verify-session-handoff-integrity.mjs に --validate-export 未実装');
  }
  if (!vh.includes('validateExportHandoff')) {
    issues.push('verify-session-handoff-integrity.mjs に handoff crosscheck 未連結');
  }
  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-weekend-layer11-infra')) {
    issues.push('verify:cio-four-ai-governance に layer11 未連結');
  }
  if (!gov.includes('verify-kintone-fields')) {
    issues.push('verify:cio-four-ai-governance に verify:kintone-fields 未連結');
  }

  if (issues.length) {
    console.error('[verify:cio-weekend-layer11-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-weekend-layer11-infra] OK 第11層 3大インフラ整合');
  process.exit(0);
}

main();
