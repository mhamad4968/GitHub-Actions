#!/usr/bin/env node
/**
 * 776 DEPT_MASTER_680 を scripts/data/employee-roster-776-dept-master.json から同期／検査。
 *
 *   node scripts/sync-776-dept-master-from-json.mjs           # sync
 *   node scripts/sync-776-dept-master-from-json.mjs --check   # verify only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'scripts/data/employee-roster-776-dept-master.json');
const jsPath = path.join(root, 'customize/776/desktop.js');
const BEGIN = '  /** BEGIN DEPT_MASTER_680 — synced from scripts/data/employee-roster-776-dept-master.json */';
const END = '  /** END DEPT_MASTER_680 */';
const checkOnly = process.argv.includes('--check');

function buildBlock(rows) {
  const lines = rows.map((r) => {
    const d = String(r.dept_name).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const g = String(r.group_name).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `    { dept_name: "${d}", group_name: "${g}" },`;
  });
  return [
    BEGIN,
    '  var DEPT_MASTER_680 = [',
    ...lines,
    '  ];',
    END,
  ].join('\n');
}

function extractPairsFromJs(src) {
  let body = '';
  const marked = src.match(
    /\/\*\* BEGIN DEPT_MASTER_680[\s\S]*?var DEPT_MASTER_680 = \[([\s\S]*?)\];\s*\n\s*\/\*\* END DEPT_MASTER_680/,
  );
  if (marked) {
    body = marked[1];
  } else {
    const m = src.match(/var DEPT_MASTER_680 = \[([\s\S]*?)\];/);
    if (!m) throw new Error('DEPT_MASTER_680 block not found in desktop.js');
    body = m[1];
  }
  const pairs = [];
  const re = /dept_name:\s*"([^"]+)"\s*,\s*group_name:\s*"([^"]+)"/g;
  let x;
  while ((x = re.exec(body))) pairs.push({ dept_name: x[1], group_name: x[2] });
  return pairs;
}

const rows = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
if (!Array.isArray(rows) || !rows.length) {
  console.error('[sync-776-dept-master] empty JSON');
  process.exit(2);
}

let js = fs.readFileSync(jsPath, 'utf8');
const live = extractPairsFromJs(js);
const want = rows.map((r) => ({
  dept_name: r.dept_name,
  group_name: r.group_name,
}));
const same =
  live.length === want.length &&
  live.every(
    (p, i) =>
      p.dept_name === want[i].dept_name && p.group_name === want[i].group_name,
  );

if (checkOnly) {
  if (!same) {
    console.error('[sync-776-dept-master] MISMATCH — run without --check to sync');
    console.error('  live reform:', live.filter((p) => p.group_name === 'reform'));
    console.error('  want reform:', want.filter((p) => p.group_name === 'reform'));
    process.exit(1);
  }
  console.log('[sync-776-dept-master] OK check', want.length, 'rows');
  process.exit(0);
}

const block = buildBlock(want);
if (js.includes('BEGIN DEPT_MASTER_680')) {
  js = js.replace(
    /  \/\*\* BEGIN DEPT_MASTER_680[\s\S]*?\/\*\* END DEPT_MASTER_680 \*\//,
    block,
  );
} else {
  js = js.replace(
    /  \/\*\* 680 並び[\s\S]*?var DEPT_MASTER_680 = \[[\s\S]*?\];/,
    block,
  );
}
fs.writeFileSync(jsPath, js, 'utf8');
console.log('[sync-776-dept-master] synced', want.length, 'rows →', jsPath);
