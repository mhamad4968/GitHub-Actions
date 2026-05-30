#!/usr/bin/env node
/**
 * 環境改善インフラ（改善案1〜3）— 整合検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'data/cio-env-manifest.json',
  'scripts/lib/cio-env-integrity.mjs',
  'scripts/verify-cio-env-integrity.mjs',
  'scripts/lib/cio-dead-lines-purge.mjs',
  'scripts/cio-dead-lines-purge.mjs',
  'scripts/lib/cio-error-ticket.mjs',
  'scripts/cio-error-generate-ticket.mjs',
  'docs/issues/.gitkeep',
  'docs/archive/dead-lines/.gitkeep',
  '.cursor/rules/cio-env-integrity-gate.mdc',
  '.cursor/rules/cio-error-ticket-gate.mdc',
];

const SCRIPTS = [
  'verify:cio-env-integrity',
  'cio:dead-lines-purge',
  'cio:error:generate-ticket',
  'verify:cio-environment-infra',
];

const AGENTS_MARKERS = [
  '第7層',
  'verify:cio-env-integrity',
  'cio:error:generate-ticket',
  'dead-lines',
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
  const guard = fs.readFileSync(path.join(root, 'scripts/cio-composer-escalation-guard.mjs'), 'utf8');
  if (!guard.includes('writeTicket')) issues.push('escalation-guard に ticket 連動なし');
  const wk = fs.readFileSync(path.join(root, 'scripts/cio-weekend-autonomous-audit.mjs'), 'utf8');
  if (!wk.includes('dead-lines')) issues.push('weekend audit に dead-lines 未連結');

  if (issues.length) {
    console.error('[verify:cio-environment-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-environment-infra] OK 改善案1〜3 整合');
  process.exit(0);
}

main();
