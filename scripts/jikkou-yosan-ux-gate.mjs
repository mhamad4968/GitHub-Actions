#!/usr/bin/env node
/**
 * B-3 — 736 依頼者UX v2 / v2d 先祖返りゲート
 * desktop.ui.js（正本）と desktop.js（deploy 物）の両方に不変条件を検証する。
 *
 * @see scripts/data/jikkou-yosan-ux-invariants.json
 * @see docs/runbooks/jikkou-yosan-ux-regression-gate.md
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const invPath = path.join(root, 'scripts/data/jikkou-yosan-ux-invariants.json');

function loadInvariants() {
  if (!existsSync(invPath)) {
    console.error('[jikkou-yosan:ux-gate] NG missing', invPath);
    process.exit(2);
  }
  return JSON.parse(readFileSync(invPath, 'utf8'));
}

function readRel(rel) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) {
    return { abs, src: null };
  }
  return { abs, src: readFileSync(abs, 'utf8') };
}

function checkFile(label, rel, src, inv) {
  const fails = [];
  if (src == null) {
    fails.push(`${label}: file missing (${rel})`);
    return fails;
  }
  const norm = src.replace(/\r\n/g, '\n');
  for (const rule of inv.must || []) {
    const needle = String(rule.needle).replace(/\r\n/g, '\n');
    if (!norm.includes(needle)) {
      fails.push(`${label} MUST [${rule.id}] ${rule.note}: ${needle.slice(0, 72)}…`);
    }
  }
  for (const rule of inv.mustNot || []) {
    const needle = String(rule.needle).replace(/\r\n/g, '\n');
    if (norm.includes(needle)) {
      fails.push(`${label} MUST-NOT [${rule.id}] ${rule.note}: ${needle.slice(0, 72)}…`);
    }
  }
  return fails;
}

function main() {
  const inv = loadInvariants();
  const uiRel = inv.files?.ui || 'customize/736/desktop.ui.js';
  const builtRel = inv.files?.built || 'customize/736/desktop.js';
  const ui = readRel(uiRel);
  const built = readRel(builtRel);

  console.log(`[jikkou-yosan:ux-gate] ${inv.label} (v${inv.version})`);

  const fails = [
    ...checkFile('ui', uiRel, ui.src, inv),
    ...checkFile('built', builtRel, built.src, inv),
  ];

  if (fails.length) {
    console.error('[jikkou-yosan:ux-gate] FAIL');
    for (const f of fails) console.error('  -', f);
    console.error('[jikkou-yosan:ux-gate] 正本:', inv.spec || invPath);
    process.exit(1);
  }

  console.log('[jikkou-yosan:ux-gate] OK', {
    ui: uiRel,
    built: builtRel,
    must: (inv.must || []).length,
    mustNot: (inv.mustNot || []).length,
  });
}

main();
