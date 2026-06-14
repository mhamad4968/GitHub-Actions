#!/usr/bin/env node
/**
 * 第13層 — MCP×CLI 単一窓・handoff/deploy 連鎖・月次 portfolio 整合
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MARKERS = [
  { file: 'AGENTS.md', text: '第13層 — MCP×CLI 単一窓' },
  { file: '.cursor/rules/mcp-tool-discipline.mdc', text: '第12/13層 — MCP×CLI 単一窓' },
  { file: 'docs/constitution/12-mcp-usage.md', text: '第13層 — MCP×CLI 単一窓' },
  { file: 'scripts/verify-session-handoff-integrity.mjs', text: 'verify-git-history-alignment.mjs' },
  { file: 'scripts/cio-deploy-preflight-guard.mjs', text: 'verify-kintone-live-schema.mjs' },
  { file: 'scripts/cio-guard-composer-mcp-audit.mjs', text: 'liveSchemaOk' },
  { file: 'scripts/cio-mcp-quickprobe.mjs', text: 'verify-cio-mcp-layer12-probe.mjs' },
  { file: 'scripts/cio-portfolio-apps.mjs', text: 'LIVE_SCHEMA_MONTHLY_IDS' },
  { file: 'scripts/lib/kintone-live-schema.mjs', text: 'discoverManagedPortfolioApps' },
  { file: 'scripts/cio-precommit-governance-sync.mjs', text: 'sync:git-history-generations' },
  { file: 'data/kintone-accepted-gaps.json', text: '"640"' },
  { file: 'scripts/verify-kintone-accepted-gaps.mjs', text: 'verify:kintone-accepted-gaps' },
  { file: 'data/git-history-guard-manifest.json', text: '"generations"' },
  { file: 'data/kintone-field-registry.json', text: '"674"' },
  { file: 'docs/runbooks/cio-periodic-ops-schedule.md', text: 'verify:kintone-live-schema --portfolio' },
];

function main() {
  const issues = [];
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const monthly = pkg.scripts?.['cio:periodic:monthly'] || '';
  if (!monthly.includes('verify-kintone-live-schema') || !monthly.includes('--portfolio')) {
    issues.push('package.json cio:periodic:monthly に live-schema --portfolio 未連結');
  }
  const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/cio-mcp-four-ai-matrix.json'), 'utf8'));
  for (const role of ['cio', 'composer']) {
    const allow = matrix.roles?.[role]?.mcpAllow || [];
    if (!allow.includes('kintone-schema-mcp') || !allow.includes('git-history-mcp')) {
      issues.push(`cio-mcp-four-ai-matrix roles.${role}.mcpAllow に layer12 MCP 不足`);
    }
  }
  for (const { file, text } of MARKERS) {
    const abs = path.join(root, file);
    if (!fs.existsSync(abs)) {
      issues.push(`missing: ${file}`);
      continue;
    }
    if (!fs.readFileSync(abs, 'utf8').includes(text)) {
      issues.push(`${file} missing marker: ${text.slice(0, 40)}`);
    }
  }
  const triggers = fs.readFileSync(path.join(root, '.cursor/rules/mcp-server-use-triggers.mdc'), 'utf8');
  if (!triggers.includes('kintone-schema-mcp') || !triggers.includes('git-history-mcp')) {
    issues.push('mcp-server-use-triggers.mdc に layer12 トリガー不足');
  }

  if (issues.length) {
    console.error('[verify:cio-weekend-layer13-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-weekend-layer13-infra] OK 第13層 MCP×CLI 単一窓 整合');
  process.exit(0);
}

main();
