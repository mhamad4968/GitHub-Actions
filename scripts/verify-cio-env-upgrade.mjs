#!/usr/bin/env node
/**
 * Cursor 環境アップグレード Phase A〜D 成果物の存在・整合検証（CI 向け）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { bridgeSchemaOk, loadBridge } from './lib/cio-session-bridge.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FILES = [
  'docs/plans/2026-06-06-cursor-environment-upgrade-plan.md',
  'data/cursor-environment-upgrade.json',
  'data/cursor-env-config.json',
  'data/cio-mcp-manifest.json',
  'data/rag-business-improvement-manifest.json',
  '.cursor/skills/kintone-session-bootstrap/SKILL.md',
  '.cursor/skills/kintone-pre-implement-gate/SKILL.md',
  '.cursor/skills/kintone-deploy-lane/SKILL.md',
  '.cursor/skills/kintone-business-improvement-lane/SKILL.md',
  '.cursor/skills/kintone-create-app/SKILL.md',
  '.cursor/skills/kintone-doc-lane/SKILL.md',
  '.cursor/rules/autonomous-cold-start.mdc',
  'data/cio-project-lanes.json',
  'data/cio-rules-topic-index.json',
  'docs/handoff/task-complete-seal.schema.json',
  'docs/runbooks/chrome-devtools-mcp-setup.md',
  'docs/handoff/implementation-ok-seal.schema.json',
  'docs/handoff/second-reviewer-latest.json',
  'docs/runbooks/cursor-automations-weekly.md',
  'docs/runbooks/cursor-automations-register.md',
  'data/cursor-automations/manifest.json',
  'data/cursor-automations/friday-mcp-health.prefill.json',
  'data/cursor-automations/monday-portfolio-audit.prefill.json',
  'data/cursor-automations/wednesday-env-verify.prefill.json',
  'data/cursor-automations/daily-rag-bi-sync.prefill.json',
  '.cursor/skills/kintone-cursor-automation-register/SKILL.md',
  'scripts/smoke-business-improvement-demo.mjs',
  'scripts/lib/cio-bridge-staleness.mjs',
];

const REQUIRED_SCRIPTS_IN_PACKAGE = [
  'cio:session:start',
  'cio:checkpoint:rollup',
  'cio:morning:pre-implement',
  'cio:morning:ready',
  'cio:implementation-ok-seal',
  'cio:task-complete-seal',
  'cio:second-reviewer:capture',
  'verify:cio-env-upgrade',
  'verify:cio-mcp-manifest',
  'rag:sync-business-improvement',
  'smoke:bi-demo',
  'cio:cursor-automation:prefill',
];

function main() {
  const issues = [];

  for (const rel of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing file: ${rel}`);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const name of REQUIRED_SCRIPTS_IN_PACKAGE) {
    if (!pkg.scripts?.[name]) issues.push(`missing npm script: ${name}`);
  }

  const bridge = loadBridge(root);
  if (!bridge || !bridgeSchemaOk(bridge)) {
    issues.push('invalid or missing docs/handoff/latest-session-bridge.json');
  }

  if (issues.length) {
    console.error('[verify:cio-env-upgrade] NG', issues.length);
    for (const i of issues) console.error(' ', i);
    process.exit(1);
  }

  console.log('[verify:cio-env-upgrade] OK Phase artifacts', REQUIRED_FILES.length);
  process.exit(0);
}

main();
