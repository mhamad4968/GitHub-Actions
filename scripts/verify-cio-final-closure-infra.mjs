#!/usr/bin/env node
/**
 * 第9層 最終完結自律防衛インフラ — 整合検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'scripts/lib/cio-weekend-rollback.mjs',
  'scripts/cio-rollback-weekend-actions.mjs',
  'scripts/lib/cio-spec-logic-linter.mjs',
  'scripts/verify-cio-spec-logic.mjs',
  'scripts/lib/cio-debug-tips-stock.mjs',
  'data/cio-weekend-rollback-baseline.json',
  'data/cio-spec-logic-rules.json',
  'docs/knowledge/debug-tips.md',
  '.cursor/rules/cio-weekend-rollback-gate.mdc',
  '.cursor/rules/cio-spec-logic-gate.mdc',
  '.cursor/rules/cio-debug-tips-stock-gate.mdc',
];

const SCRIPTS = [
  'cio:rollback:weekend-actions',
  'verify:cio-spec-logic',
  'verify:cio-final-closure-infra',
];

const AGENTS_MARKERS = [
  '第9層',
  'cio:rollback:weekend-actions',
  'verify:cio-spec-logic',
  'debug-tips.md',
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
  const handoff = fs.readFileSync(path.join(root, 'scripts/cio-session-export-handoff.mjs'), 'utf8');
  if (!handoff.includes('stockDebugTips')) issues.push('export-handoff に debug-tips 未連結');
  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-final-closure-infra')) {
    issues.push('verify:cio-four-ai-governance に final-closure 未連結');
  }

  if (issues.length) {
    console.error('[verify:cio-final-closure-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-final-closure-infra] OK 拡張案1〜3 整合');
  process.exit(0);
}

main();
