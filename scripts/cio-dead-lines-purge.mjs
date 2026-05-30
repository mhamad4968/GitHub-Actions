#!/usr/bin/env node
/**
 * 改善案2 — 死に文スキャン / 安全退避（Kimi 精査職分・週末監査連動）
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { purgeDeadLines, scanDeadLines } from './lib/cio-dead-lines-purge.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.includes('--scan')) {
    const hits = scanDeadLines(root);
    console.log('[cio:dead-lines-purge] scan', hits.length, 'candidates');
    for (const h of hits) console.log(`  - ${h.rel} (${h.reason})`);
    process.exit(0);
  }
  const moved = purgeDeadLines(root, { apply });
  console.log(`[cio:dead-lines-purge] ${apply ? 'OK moved' : 'dry-run'}`, moved.length);
  for (const m of moved) console.log(`  ${m.from} → ${m.to}`);
  process.exit(0);
}

main();
