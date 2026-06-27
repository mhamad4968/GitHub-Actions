#!/usr/bin/env node
/**
 * 経営会議 情報セキュリティレポート 運用 infra 検査
 * @see docs/runbooks/keiei-kaigi-security-report.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'docs/runbooks/keiei-kaigi-security-report.md',
  'templates/doc-lane/keiei-kaigi-security-report-structure.md',
  'templates/doc-lane/keiei-kaigi-docx-registry.json',
  'scripts/data/monthly-security-report-TEMPLATE.json',
  'docs/runbooks/monthly-security-report.md',
];

const needles = [
  { rel: 'docs/runbooks/doc-lane-autonomous-governance.md', needles: ['R-DOC-11', 'R7'] },
  { rel: 'docs/runbooks/monthly-security-report.md', needles: ['R7', 'keiei-kaigi'] },
  { rel: '.cursor/rules/doc-lane-gate.mdc', needles: ['R-DOC-11', '経営会議'] },
  { rel: '.cursor/skills/office-docx-doc-lane/SKILL.md', needles: ['R7', '経営会議'] },
  { rel: 'data/cio-project-lanes.json', needles: ['verify:doc-lane-keiei-kaigi', 'keiei-kaigi'] },
];

function main() {
  let ok = true;
  console.log('[verify:doc-lane-keiei-kaigi] 経営会議セキュリティ infra 検査\n');

  for (const rel of required) {
    if (fs.existsSync(path.join(root, rel))) {
      console.log(`  OK file: ${rel}`);
    } else {
      console.error(`  NG missing: ${rel}`);
      ok = false;
    }
  }

  const regPath = path.join(root, 'templates/doc-lane/keiei-kaigi-docx-registry.json');
  if (fs.existsSync(regPath)) {
    const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    if (reg.recommendedTemplate && (reg.templates || []).length >= 1) {
      console.log(`  OK registry: ${reg.templates.length} template(s), recommended=${reg.recommendedTemplate}`);
    } else {
      console.error('  NG registry incomplete');
      ok = false;
    }
  }

  const tpl = path.join(root, 'scripts/data/monthly-security-report-TEMPLATE.json');
  if (fs.existsSync(tpl)) {
    const j = JSON.parse(fs.readFileSync(tpl, 'utf8'));
    if (j.r7_mode && (j.section2 || []).some((s) => s.includes('浜田入力'))) {
      console.log('  OK TEMPLATE.json R7 placeholders');
    } else {
      console.error('  NG TEMPLATE.json missing R7 placeholders');
      ok = false;
    }
  }

  for (const { rel, needles: ns } of needles) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) {
      console.error(`  NG missing: ${rel}`);
      ok = false;
      continue;
    }
    const text = fs.readFileSync(p, 'utf8');
    for (const n of ns) {
      if (text.includes(n)) {
        console.log(`  OK needle "${n}" in ${rel}`);
      } else {
        console.error(`  NG needle "${n}" not in ${rel}`);
        ok = false;
      }
    }
  }

  if (!ok) {
    console.error('\n[verify:doc-lane-keiei-kaigi] NG');
    process.exit(1);
  }
  console.log('\n[verify:doc-lane-keiei-kaigi] OK');
  process.exit(0);
}

main();
