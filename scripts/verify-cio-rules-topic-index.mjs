#!/usr/bin/env node
/**
 * cursor-rules-topic-index の全 .mdc が cio-rules-topic-index に登録されていること
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
  const issues = [];
  const cursor = JSON.parse(
    fs.readFileSync(path.join(root, 'data/cursor-rules-topic-index.json'), 'utf8'),
  );
  const cio = JSON.parse(
    fs.readFileSync(path.join(root, 'data/cio-rules-topic-index.json'), 'utf8'),
  );

  const cioSet = new Set();
  for (const t of cio.topics) {
    for (const r of t.rules) {
      cioSet.add(path.basename(r));
    }
  }

  const cursorSet = new Set();
  for (const t of cursor.topics) {
    for (const f of t.files) {
      const name = fileName(f);
      cursorSet.add(name);
      if (name === 'constitution.mdc') continue;
      if (!cioSet.has(name)) {
        issues.push(`cio-index missing: ${name} (in cursor ${t.id})`);
      }
    }
  }

  const rulesDir = path.join(root, '.cursor/rules');
  const onDisk = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.mdc'));
  for (const name of onDisk) {
    if (name === 'constitution.mdc') continue;
    if (!cursorSet.has(name)) {
      issues.push(`cursor-index missing on-disk: ${name}`);
    }
  }

  if (issues.length) {
    console.error('[verify:cio-rules-topic-index] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }

  console.log(
    `[verify:cio-rules-topic-index] OK cursor=${cursorSet.size} cio=${cioSet.size} disk=${onDisk.length}`,
  );
  process.exit(0);
}

main();
