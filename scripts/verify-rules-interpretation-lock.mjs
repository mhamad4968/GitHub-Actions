#!/usr/bin/env node
/**
 * data/rules-interpretation-lock.json — I1–I10 存在
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK = path.join(root, 'data/rules-interpretation-lock.json');

function fail(msg) {
  console.error(`[verify:rules-interpretation-lock] ❌ ${msg}`);
  process.exit(2);
}

function main() {
  if (!fs.existsSync(LOCK)) fail('missing data/rules-interpretation-lock.json');
  const data = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
  const ids = (data.locks || []).map((l) => l.id);
  const required = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8', 'I9', 'I10', 'I11', 'I12'];
  const missing = required.filter((id) => !ids.includes(id));
  if (missing.length) fail(`missing lock ids: ${missing.join(', ')}`);
  const i12 = data.locks.find((l) => l.id === 'I12');
  if (!i12?.summary?.includes('G0')) fail('I12 must define GO phases (G0)');
  const charter28 = path.join(root, 'docs/constitution/28-ceo-go-phases-charter.md');
  if (!fs.existsSync(charter28)) fail('missing 28-ceo-go-phases-charter.md');
  for (const l of data.locks) {
    if (!l.summary || l.summary.length < 10) fail(`${l.id}: summary too short`);
  }
  console.log('[verify:rules-interpretation-lock] ✅ OK (I1–I12)');
  process.exit(0);
}

main();
