#!/usr/bin/env node
/**
 * タスクC — 安全な置換のみで方式Bゾンビ記述を自動修正
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  applySafePruneToFile,
  collectZombieScanFiles,
  scanFileForZombies,
  scanRepoForZombies,
} from './lib/cio-four-ai-governance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');

function main() {
  let touched = 0;

  for (const rel of collectZombieScanFiles(root)) {
    const abs = path.join(root, rel);
    const before = fs.readFileSync(abs, 'utf8');
    const { content: after, changed: c } = applySafePruneToFile(before);
    if (c && apply) {
      fs.writeFileSync(abs, after, 'utf8');
      touched++;
      console.log(`[cio-prune:mode-b-zombie-docs] updated ${rel}`);
    }
  }

  if (!apply) {
    const issues = scanRepoForZombies(root);
    console.log('[cio-prune:mode-b-zombie-docs] dry-run (pass --apply to write)');
    for (const i of issues) {
      console.log(`  - ${i.relPath} [${i.id}] ${i.hint}`);
    }
    process.exit(issues.length ? 1 : 0);
  }

  const remaining = scanRepoForZombies(root);
  if (remaining.length) {
    console.warn('[cio-prune:mode-b-zombie-docs] manual fix still needed:', remaining.length);
    for (const i of remaining.slice(0, 15)) {
      console.warn(`  - ${i.relPath} [${i.id}] ${i.hint}`);
    }
    process.exit(1);
  }

  console.log(`[cio-prune:mode-b-zombie-docs] OK files touched=${touched}`);
  process.exit(0);
}

main();
