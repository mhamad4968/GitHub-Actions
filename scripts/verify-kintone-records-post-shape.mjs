#!/usr/bin/env node
/**
 * S-741-03 — kintone records.json POST が record 単体になっていないか検査
 *
 * Usage:
 *   node scripts/verify-kintone-records-post-shape.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptsDir = path.join(root, 'scripts');

function walkMjs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules') continue;
      walkMjs(full, out);
    } else if (name.endsWith('.mjs')) {
      out.push(full);
    }
  }
  return out;
}

function hasBadRecordsPost(src) {
  const parts = src.split('/k/v1/records.json');
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i].slice(0, 900);
    if (!/method:\s*['"]POST['"]/i.test(chunk)) continue;
    const bodyMatch = chunk.match(/JSON\.stringify\(\s*(\{[\s\S]*?\})\s*[,)]/);
    if (!bodyMatch) continue;
    const body = bodyMatch[1];
    if (/\brecords\s*:/.test(body)) continue;
    if (/\brecord\s*:/.test(body)) return true;
  }
  return false;
}

function main() {
  const files = walkMjs(scriptsDir);
  const violations = [];
  for (const file of files) {
    if (file.includes('verify-kintone-records-post-shape')) continue;
    const src = readFileSync(file, 'utf8');
    if (!src.includes('/k/v1/records.json')) continue;
    if (hasBadRecordsPost(src)) {
      violations.push(path.relative(root, file));
    }
  }
  if (violations.length) {
    console.error('[verify:kintone-records-post-shape] NG — use records: [{ ... }] not record: { ... }');
    for (const v of violations) console.error(`  ${v}`);
    process.exit(1);
  }
  console.log('[verify:kintone-records-post-shape] OK');
}

main();
