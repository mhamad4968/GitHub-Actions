#!/usr/bin/env node
/**
 * doc-lane 自律運用ルール（R-DOC）infra 検査
 * @see docs/runbooks/doc-lane-autonomous-governance.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'docs/runbooks/doc-lane-autonomous-governance.md',
  'docs/approved-changes/2026-06-27-rules-doc-autonomous-hamada-go.md',
  'docs/plans/2026-06-27-doc-lane-phase2-word-spec.md',
  '.cursor/rules/doc-lane-gate.mdc',
  'docs/runbooks/doc-lane-pptx-mcp.md',
  '.cursor/skills/office-pptx-doc-lane/SKILL.md',
];

const needles = [
  { rel: 'docs/runbooks/doc-lane.md', needles: ['doc-lane-autonomous-governance'] },
  { rel: '.cursor/skills/office-pptx-doc-lane/SKILL.md', needles: ['verify:doc-lane-governance'] },
  { rel: 'data/cio-project-lanes.json', needles: ['verify:doc-lane-governance', 'doc-lane-autonomous-governance'] },
  { rel: '.cursor/rules/mcp-server-use-triggers.mdc', needles: ['office-powerpoint'] },
  { rel: 'docs/constitution/00-preamble.md', needles: ['doc-lane'] },
];

function main() {
  let ok = true;
  console.log('[verify:doc-lane-governance] R-DOC 自律運用 infra 検査\n');

  for (const rel of required) {
    if (fs.existsSync(path.join(root, rel))) {
      console.log(`  OK file: ${rel}`);
    } else {
      console.error(`  NG missing: ${rel}`);
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

  const gov = fs.readFileSync(
    path.join(root, 'docs/runbooks/doc-lane-autonomous-governance.md'),
    'utf8'
  );
  for (const id of ['R-DOC-01', 'R-DOC-07', 'R-DOC-09', 'R-DOC-10']) {
    if (gov.includes(id)) {
      console.log(`  OK ${id} in governance runbook`);
    } else {
      console.error(`  NG ${id} missing`);
      ok = false;
    }
  }

  if (!ok) {
    console.error('\n[verify:doc-lane-governance] NG');
    process.exit(1);
  }
  console.log('\n[verify:doc-lane-governance] OK');
  process.exit(0);
}

main();
