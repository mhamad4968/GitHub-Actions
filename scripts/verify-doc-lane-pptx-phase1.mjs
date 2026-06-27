#!/usr/bin/env node
/**
 * doc-lane PPTX フェーズ1 インフラ検査
 * @see docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadToolRoutingManifest, validateRoutingManifest, buildRoutePlan } from './lib/cio-tool-routing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'docs/plans/2026-06-27-doc-lane-pptx-phase1-spec.md',
  'docs/runbooks/doc-lane-pptx-mcp.md',
  '.cursor/skills/office-pptx-doc-lane/SKILL.md',
  'templates/doc-lane/README.md',
  'data/cio-ai-team-tool-routing.json',
];

const docLaneTools = [
  'create_presentation',
  'add_shape',
  'add_connector',
  'add_chart',
  'manage_image',
];

function main() {
  let ok = true;
  console.log('[verify:doc-lane-pptx-phase1] doc-lane PPTX フェーズ1 検査\n');

  for (const rel of requiredFiles) {
    const p = path.join(root, rel);
    if (fs.existsSync(p)) {
      console.log(`  OK file: ${rel}`);
    } else {
      console.error(`  NG missing: ${rel}`);
      ok = false;
    }
  }

  const manifest = loadToolRoutingManifest(root);
  const validation = validateRoutingManifest(manifest);
  if (!validation.ok) {
    console.error('  NG routing manifest:', validation.issues.join('; '));
    ok = false;
  }

  const docLane = (manifest.intents || []).find((i) => i.id === 'doc-lane');
  if (!docLane) {
    console.error('  NG intent doc-lane missing');
    ok = false;
  } else {
    const skill = docLane.skill || '';
    if (!skill.includes('doc-lane')) {
      console.error('  NG doc-lane skill missing doc-lane reference');
      ok = false;
    } else {
      console.log(`  OK doc-lane skill: ${skill}`);
    }

    const rb = docLane.runbook || '';
    if (!rb.includes('doc-lane-pptx-mcp') && !rb.includes('doc-lane-autonomous-governance')) {
      console.error('  NG doc-lane runbook missing pptx reference');
      ok = false;
    } else {
      console.log(`  OK doc-lane runbook: ${rb}`);
    }

    const ppt = (docLane.mcp || []).find((m) => m.server === 'office-powerpoint');
    if (!ppt) {
      console.error('  NG office-powerpoint not in doc-lane mcp');
      ok = false;
    } else {
      const tools = ppt.tools || [];
      const missingTools = docLaneTools.filter((t) => !tools.includes(t));
      if (missingTools.length) {
        console.error(`  NG office-powerpoint tools missing: ${missingTools.join(', ')}`);
        ok = false;
      } else {
        console.log(`  OK office-powerpoint tools (${tools.length} listed)`);
      }
    }

    const kws = docLane.keywords || [];
    if (!kws.some((k) => /フロー|図解|PowerPoint|pptx/i.test(k))) {
      console.error('  NG doc-lane keywords missing pptx/diagram terms');
      ok = false;
    } else {
      console.log('  OK doc-lane keywords include pptx/diagram');
    }
  }

  const plan = buildRoutePlan(manifest, 'PowerPoint 資料 フロー図 作成');
  if (plan.primaryIntentId !== 'doc-lane') {
    console.error(`  NG route test: expected doc-lane got ${plan.primaryIntentId}`);
    ok = false;
  } else {
    console.log('  OK route test: PowerPoint 資料 → doc-lane');
  }

  const registryPath = path.join(root, 'data/c-tmp-workspace-registry.json');
  if (fs.existsSync(registryPath)) {
    const reg = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const folder = (reg.folders || []).find((f) => f.path && f.path.includes('資料作成'));
    if (folder && (folder.runbook || '').includes('doc-lane-pptx')) {
      console.log('  OK c-tmp registry: 資料作成 → doc-lane-pptx');
    } else if (folder) {
      console.log('  WARN c-tmp registry: 資料作成 runbook not yet doc-lane-pptx (optional)');
    }
  }

  if (process.platform !== 'win32') {
    console.log('\n  WARN non-Windows — office-powerpoint MCP は Win Cursor 専用');
  }

  if (!ok) {
    console.error('\n[verify:doc-lane-pptx-phase1] NG');
    process.exit(1);
  }

  console.log('\n[verify:doc-lane-pptx-phase1] OK');
  console.log('  次: npm run health-check → Windows Cursor で office-powerpoint 確認');
  process.exit(0);
}

main();
