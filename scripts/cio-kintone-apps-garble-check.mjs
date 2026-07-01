#!/usr/bin/env node
/**
 * kintone-apps.md BUILD/rev 行 garble 検知（R-SEC-02・2026-07-01 浜田承認）
 *
 * 検出例:
 *   - rev **30**** rev **28**
 *   - BUILD=`...` rev ** 111 ****
 *   - 同一行に rev ** が2回以上
 *
 * Usage:
 *   node scripts/cio-kintone-apps-garble-check.mjs --staged
 *   node scripts/cio-kintone-apps-garble-check.mjs --file kintone-apps.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = 'kintone-apps.md';

const PATTERNS = [
  { re: /rev\s+\*\*\s*\d+\s*\*\*\s*\*\*\s*rev/i, msg: 'rev ** N **** rev 重複' },
  { re: /BUILD=`[^`]+`\s*rev\s+\*\*\s*\d+\s*\*\*\s*\*\*/i, msg: 'BUILD 行末尾 **** garble' },
  { re: /rev\s+\*\*[^*]*rev\s+\*\*/i, msg: '同一行に rev ** が2回以上' },
  { re: /\*\*\*\*\s*rev/i, msg: '**** rev 連続 garble' },
];

function readTarget(mode, fileArg) {
  if (mode === 'file') {
    const p = path.isAbsolute(fileArg) ? fileArg : path.join(root, fileArg);
    return fs.readFileSync(p, 'utf8');
  }
  if (mode === 'staged') {
    const out = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: root, encoding: 'utf8' });
    if (!out.split(/\r?\n/).some((f) => f === TARGET || f.endsWith('/' + TARGET))) {
      return null;
    }
    const staged = execFileSync('git', ['show', `:${TARGET}`], { cwd: root, encoding: 'utf8' });
    return staged;
  }
  return fs.readFileSync(path.join(root, TARGET), 'utf8');
}

function check(text) {
  const violations = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/BUILD|rev\s+\*\*/i.test(line)) continue;
    for (const { re, msg } of PATTERNS) {
      if (re.test(line)) {
        violations.push({ line: i + 1, msg, text: line.trim().slice(0, 120) });
      }
    }
  }
  return violations;
}

const args = process.argv.slice(2);
const staged = args.includes('--staged');
const fileIdx = args.indexOf('--file');
const fileArg = fileIdx >= 0 ? args[fileIdx + 1] : null;

if (!staged && !fileArg) {
  console.error('Usage: node scripts/cio-kintone-apps-garble-check.mjs --staged|--file kintone-apps.md');
  process.exit(2);
}

const text = readTarget(staged ? 'staged' : 'file', fileArg);
if (text === null) {
  console.log('[cio-kintone-apps-garble-check] skip: kintone-apps.md not staged');
  process.exit(0);
}

const violations = check(text);
if (violations.length === 0) {
  console.log('[cio-kintone-apps-garble-check] OK');
  process.exit(0);
}

console.error('[cio-kintone-apps-garble-check] NG — kintone-apps.md BUILD/rev garble');
for (const v of violations) {
  console.error(`  L${v.line}: ${v.msg}`);
  console.error(`    ${v.text}`);
}
console.error('  対処: BUILD=`…` rev **N** / fileKey を1セットに整理して再ステージ');
process.exit(1);
