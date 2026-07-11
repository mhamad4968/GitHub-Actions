#!/usr/bin/env node
/**
 * data/rules-preservation-needles.json ↔ .mdc 本文 needle 整合
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEEDLES = path.join(root, 'data', 'rules-preservation-needles.json');
const rulesDir = path.join(root, '.cursor/rules');

function fail(msg) {
  console.error(`[verify:rules-preservation-needles] ❌ ${msg}`);
  process.exit(2);
}

function main() {
  if (!fs.existsSync(NEEDLES)) fail('missing data/rules-preservation-needles.json');
  const data = JSON.parse(fs.readFileSync(NEEDLES, 'utf8'));
  const issues = [];

  for (const [file, needles] of Object.entries(data.files || {})) {
    const abs = path.join(rulesDir, file);
    if (!fs.existsSync(abs)) {
      issues.push(`missing file ${file}`);
      continue;
    }
    const body = fs.readFileSync(abs, 'utf8');
    for (const n of needles) {
      if (!body.includes(n)) issues.push(`${file}: missing needle "${n}"`);
    }
  }

  if (issues.length) {
    for (const i of issues) console.error('  -', i);
    fail(`${issues.length} issue(s)`);
  }

  const count = Object.values(data.files || {}).flat().length;
  console.log(`[verify:rules-preservation-needles] ✅ OK (${count} needles)`);
  process.exit(0);
}

main();
