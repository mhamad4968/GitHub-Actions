#!/usr/bin/env node
/**
 * doc-lane Word フェーズ2 インフラ検査
 * @see docs/plans/2026-06-27-doc-lane-phase2-word-spec.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadToolRoutingManifest, validateRoutingManifest, buildRoutePlan } from './lib/cio-tool-routing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'docs/plans/2026-06-27-doc-lane-phase2-word-spec.md',
  'docs/runbooks/doc-lane-docx-mcp.md',
  '.cursor/skills/office-docx-doc-lane/SKILL.md',
  'data/cio-ai-team-tool-routing.json',
  'scripts/build-monthly-security-report.py',
  'docs/runbooks/monthly-security-report.md',
];

const docLaneTools = [
  'create_document',
  'add_heading',
  'add_paragraph',
  'add_table',
  'add_picture',
  'get_document_text',
  'get_document_outline',
];

const winWordServer = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'Office-Word-MCP-Server',
  'word_mcp_server.py'
);

function main() {
  let ok = true;
  console.log('[verify:doc-lane-word-phase2] doc-lane Word フェーズ2 検査\n');

  for (const rel of requiredFiles) {
    const p = path.join(root, rel);
    if (fs.existsSync(p)) {
      console.log(`  OK file: ${rel}`);
    } else {
      console.error(`  NG missing: ${rel}`);
      ok = false;
    }
  }

  if (process.platform === 'win32' && process.env.USERPROFILE) {
    if (fs.existsSync(winWordServer)) {
      console.log('  OK Windows: Office-Word-MCP-Server installed');
    } else {
      console.error(`  NG Windows: missing ${winWordServer}`);
      ok = false;
    }
  } else {
    console.log('  WARN non-Windows — office-word MCP は Win Cursor 専用');
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
    if (!skill.includes('office-docx-doc-lane') && !skill.includes('office-pptx-doc-lane')) {
      console.error('  NG doc-lane skill missing office-docx-doc-lane');
      ok = false;
    } else {
      console.log(`  OK doc-lane skill: ${skill}`);
    }

    const rb = docLane.runbook || '';
    if (!rb.includes('doc-lane-docx-mcp') && !rb.includes('doc-lane-autonomous-governance')) {
      console.error('  NG doc-lane runbook missing docx reference');
      ok = false;
    } else {
      console.log(`  OK doc-lane runbook: ${rb}`);
    }

    const word = (docLane.mcp || []).find((m) => m.server === 'office-word');
    if (!word) {
      console.error('  NG office-word not in doc-lane mcp');
      ok = false;
    } else {
      const tools = word.tools || [];
      const missingTools = docLaneTools.filter((t) => !tools.includes(t));
      if (missingTools.length) {
        console.error(`  NG office-word tools missing: ${missingTools.join(', ')}`);
        ok = false;
      } else {
        console.log(`  OK office-word tools (${tools.length} listed)`);
      }
    }

    const npm = docLane.npm || [];
    if (!npm.includes('verify:doc-lane-word-phase2')) {
      console.error('  NG verify:doc-lane-word-phase2 not in doc-lane npm');
      ok = false;
    } else {
      console.log('  OK doc-lane npm includes verify:doc-lane-word-phase2');
    }
  }

  const plan = buildRoutePlan(manifest, 'Word セキュリティレポート 図解 グラフ');
  if (plan.primaryIntentId !== 'doc-lane') {
    console.error(`  NG route test: expected doc-lane got ${plan.primaryIntentId}`);
    ok = false;
  } else {
    console.log('  OK route test: Word セキュリティレポート → doc-lane');
  }

  const gov = path.join(root, 'docs/runbooks/doc-lane-autonomous-governance.md');
  if (fs.existsSync(gov)) {
    const text = fs.readFileSync(gov, 'utf8');
    if (text.includes('verify:doc-lane-word-phase2')) {
      console.log('  OK governance references verify:doc-lane-word-phase2');
    } else {
      console.error('  NG governance missing verify:doc-lane-word-phase2');
      ok = false;
    }
  }

  if (!ok) {
    console.error('\n[verify:doc-lane-word-phase2] NG');
    process.exit(1);
  }

  console.log('\n[verify:doc-lane-word-phase2] OK');
  console.log('  次: npm run health-check → Windows Cursor で office-word 確認');
  process.exit(0);
}

main();
