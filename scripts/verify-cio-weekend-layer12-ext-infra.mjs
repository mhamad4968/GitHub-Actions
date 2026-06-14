#!/usr/bin/env node
/**
 * 第12層拡張 — live-schema + git-history-alignment 整合検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'scripts/lib/kintone-live-schema.mjs',
  'scripts/verify-kintone-live-schema.mjs',
  'scripts/lib/git-history-alignment.mjs',
  'scripts/verify-git-history-alignment.mjs',
  'data/git-history-guard-manifest.json',
  '.cursor/rules/cio-kintone-live-schema-gate.mdc',
  '.cursor/rules/cio-git-history-alignment-gate.mdc',
];

const SCRIPTS = ['verify:kintone-live-schema', 'verify:git-history-alignment'];

const AGENTS_MARKERS = [
  'verify:kintone-live-schema',
  'verify:git-history-alignment',
  '拡張案1',
  '拡張案2',
  'live-schema=OK',
  'git-history-alignment',
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
  const composer = fs.readFileSync(path.join(root, '.cursor/rules/composer-mcp-audit-gate.mdc'), 'utf8');
  if (!composer.includes('verify:kintone-live-schema')) {
    issues.push('composer-mcp-audit-gate.mdc に verify:kintone-live-schema 未連結');
  }
  const guard = fs.readFileSync(path.join(root, 'scripts/cio-guard-composer-mcp-audit.mjs'), 'utf8');
  if (!guard.includes('liveSchemaOk')) {
    issues.push('cio-guard-composer-mcp-audit.mjs に liveSchemaOk 未実装');
  }
  const liveLib = fs.readFileSync(path.join(root, 'scripts/lib/kintone-live-schema.mjs'), 'utf8');
  if (!liveLib.includes('resolveCustomizeDirsForApp')) {
    issues.push('kintone-live-schema.mjs に resolveCustomizeDirsForApp 未実装');
  }
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'data/kintone-field-registry.json'), 'utf8'));
  if (!registry.apps?.['674']?.relatedAppFieldsFrom?.length) {
    issues.push('kintone-field-registry.json に 674 relatedAppFieldsFrom 未登録');
  }
  const handoff = fs.readFileSync(path.join(root, 'scripts/verify-session-handoff-integrity.mjs'), 'utf8');
  if (!handoff.includes('verify-git-history-alignment.mjs')) {
    issues.push('verify-session-handoff-integrity.mjs に git-history handoff 連鎖未実装');
  }
  const constitution = fs.readFileSync(path.join(root, 'docs/constitution/12-mcp-usage.md'), 'utf8');
  if (!constitution.includes('第12層 — 2大新規MCP')) {
    issues.push('docs/constitution/12-mcp-usage.md に 第12層 未記載');
  }
  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-kintone-live-schema') || !gov.includes('verify-git-history-alignment')) {
    issues.push('verify:cio-four-ai-governance に layer12 拡張未連結');
  }

  if (issues.length) {
    console.error('[verify:cio-weekend-layer12-ext-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-weekend-layer12-ext-infra] OK 第12層拡張 live+history 整合');
  process.exit(0);
}

main();
