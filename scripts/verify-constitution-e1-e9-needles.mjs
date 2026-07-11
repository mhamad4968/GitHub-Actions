#!/usr/bin/env node
/**
 * Phase 1 E1–E9 — .mdc needle 整合 + AGENTS ミラー
 * @see data/cio-e1-e9-needles.json · R3-9
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_REL = 'data/cio-e1-e9-needles.json';
const rulesDir = path.join(root, '.cursor', 'rules');

function main() {
  const issues = [];
  const indexPath = path.join(root, INDEX_REL);
  if (!fs.existsSync(indexPath)) {
    console.error('[verify:constitution-e1-e9-needles] NG missing', INDEX_REL);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  const checklist = path.join(root, data.checklist || '');
  if (!fs.existsSync(checklist)) issues.push(`missing checklist ${data.checklist}`);

  for (const entry of data.entries || []) {
    const abs = path.join(rulesDir, entry.mdc);
    if (!fs.existsSync(abs)) {
      issues.push(`${entry.id}: missing mdc ${entry.mdc}`);
      continue;
    }
    const body = fs.readFileSync(abs, 'utf8');
    for (const n of entry.needles || []) {
      if (!body.includes(n)) issues.push(`${entry.id} (${entry.mdc}): missing needle "${n}"`);
    }
  }

  const agentsPath = path.join(root, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    issues.push('missing AGENTS.md');
  } else {
    const agents = fs.readFileSync(agentsPath, 'utf8');
    for (const { id, needle } of data.agentsNeedles || []) {
      if (!agents.includes(needle)) issues.push(`AGENTS.md missing ${id} needle "${needle}"`);
    }
  }

  const cioConst = path.join(rulesDir, 'cio-constitution.mdc');
  if (fs.existsSync(cioConst)) {
    const body = fs.readFileSync(cioConst, 'utf8');
    if (!body.includes('cio-e1-e9-needles.json')) {
      issues.push('cio-constitution.mdc missing cio-e1-e9-needles.json pointer');
    }
    for (const id of ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9']) {
      if (!body.includes(id)) issues.push(`cio-constitution.mdc missing ${id} anchor`);
    }
  } else {
    issues.push('missing cio-constitution.mdc');
  }

  const nav = path.join(root, 'docs/constitution/27-constitution-navigation-charter.md');
  if (fs.existsSync(nav)) {
    const body = fs.readFileSync(nav, 'utf8');
    if (!body.includes('cio-e1-e9-needles.json')) {
      issues.push('27-navigation-charter missing e1-e9 needles pointer');
    }
  }

  if ((data.entries || []).length !== 9) {
    issues.push(`entries must be 9 (got ${data.entries?.length})`);
  }

  if (issues.length) {
    console.error('[verify:constitution-e1-e9-needles] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }

  console.log(
    `[verify:constitution-e1-e9-needles] OK (9 mdc anchors · AGENTS mirror · ${INDEX_REL})`,
  );
  process.exit(0);
}

main();
