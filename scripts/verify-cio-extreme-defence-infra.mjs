#!/usr/bin/env node
/**
 * 極限自律防衛インフラ（拡張案1〜3 / 第8層）— 整合検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'scripts/lib/cio-env-self-healing.mjs',
  'scripts/cio-env-self-healing.mjs',
  'scripts/cio-env-encrypt-backup.mjs',
  'scripts/lib/cio-error-ticket-apply.mjs',
  'scripts/cio-error-apply-ticket-choice.mjs',
  'scripts/lib/cio-dead-code-purge.mjs',
  'scripts/cio-dead-code-purge.mjs',
  'docs/secure/README.md',
  'docs/archive/dead-codes/.gitkeep',
  '.cursor/rules/cio-error-ticket-apply-gate.mdc',
  '.cursor/rules/cio-env-self-healing-gate.mdc',
];

const SCRIPTS = [
  'cio:env:self-healing',
  'cio:env:encrypt-backup',
  'cio:error:apply-ticket-choice',
  'cio:dead-code-purge',
  'verify:cio-extreme-defence-infra',
];

const AGENTS_MARKERS = [
  '第8層',
  'cio:error:apply-ticket-choice',
  'cio:env:self-healing',
  'dead-codes',
  'WEEKEND-DEAD-CODE-PURGE',
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
  const ticket = fs.readFileSync(path.join(root, 'scripts/lib/cio-error-ticket.mjs'), 'utf8');
  if (!ticket.includes('CIO-EXEC-CHOICE')) issues.push('ticket に CIO-EXEC-CHOICE 未埋込');
  const wk = fs.readFileSync(path.join(root, 'scripts/cio-weekend-autonomous-audit.mjs'), 'utf8');
  if (!wk.includes('dead-code-purge')) issues.push('weekend audit に dead-code 未連結');

  if (issues.length) {
    console.error('[verify:cio-extreme-defence-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-extreme-defence-infra] OK 拡張案1〜3 整合');
  process.exit(0);
}

main();
