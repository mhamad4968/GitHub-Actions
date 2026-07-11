#!/usr/bin/env node
/**
 * cursor-rules-topic-index → cio-rules-topic-index の rules パス同期（--dry-run 可）
 * meta（npm/runbook/when）は cio-rules-topic-meta.json sidecar — 上書きしない
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string | { name: string }} entry */
function fileName(entry) {
  const n = typeof entry === 'string' ? entry : entry.name;
  return n.endsWith('.mdc') ? n : `${n}.mdc`;
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const cioPath = path.join(root, 'data/cio-rules-topic-index.json');
  const cursorPath = path.join(root, 'data/cursor-rules-topic-index.json');
  const cio = JSON.parse(fs.readFileSync(cioPath, 'utf8'));
  const cursor = JSON.parse(fs.readFileSync(cursorPath, 'utf8'));

  const cursorFiles = new Set();
  for (const t of cursor.topics) {
    for (const f of t.files) cursorFiles.add(fileName(f));
  }

  for (const topic of cio.topics) {
    const rules = topic.rules.map((r) => path.basename(r));
    for (const name of rules) {
      if (!cursorFiles.has(name) && name !== 'constitution.mdc') {
        console.warn(`[sync:cio-rules-topic] warn: ${name} in cio but not cursor-index`);
      }
    }
  }

  if (dry) {
    console.log('[sync:cio-rules-topic-index] dry-run OK');
    process.exit(0);
  }

  cio.version = cursor.version || cio.version;
  fs.writeFileSync(cioPath, `${JSON.stringify(cio, null, 2)}\n`, 'utf8');
  console.log('[sync:cio-rules-topic-index] OK (version aligned, rules untouched)');
  process.exit(0);
}

main();
