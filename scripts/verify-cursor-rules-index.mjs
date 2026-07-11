#!/usr/bin/env node
/**
 * data/cursor-rules-topic-index.json ↔ .cursor/rules/*.mdc ↔ RULES-INDEX 自動節の整合
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOPIC_INDEX = path.join(root, 'data', 'cursor-rules-topic-index.json');
const RULES_DIR = path.join(root, '.cursor', 'rules');
const RULES_INDEX = path.join(root, 'RULES-INDEX.md');
const BEGIN = '<!-- RULES-INDEX:CURSOR-RULES-AUTO:BEGIN -->';

/** @param {string | { name: string; discoveryOnly?: boolean }} entry */
function fileName(entry) {
  const n = typeof entry === 'string' ? entry : entry.name;
  return n.endsWith('.mdc') ? n : `${n}.mdc`;
}

function main() {
  const issues = [];
  const index = JSON.parse(fs.readFileSync(TOPIC_INDEX, 'utf8'));
  const onDisk = fs.readdirSync(RULES_DIR).filter((n) => n.endsWith('.mdc'));
  const onDiskSet = new Set(onDisk);

  const listed = new Set();
  for (const t of index.topics) {
    for (const f of t.files) {
      const name = fileName(f);
      listed.add(name);
      if (!onDiskSet.has(name)) {
        issues.push(`topic-index lists missing file: ${name}`);
      }
    }
  }

  for (const name of onDisk) {
    if (name === 'constitution.mdc') continue;
    if (!listed.has(name)) {
      issues.push(`on disk but not in topic-index: ${name}`);
    }
  }

  const ri = fs.readFileSync(RULES_INDEX, 'utf8');
  if (!ri.includes(BEGIN)) {
    issues.push('RULES-INDEX missing auto section — run npm run rules:sync-mdc-index');
  }

  if (issues.length) {
    console.error('[verify-cursor-rules-index] NG', issues.length);
    for (const x of issues) console.error('  -', x);
    process.exit(1);
  }
  console.log('[verify-cursor-rules-index] OK', onDisk.length, 'mdc files indexed');
  process.exit(0);
}

main();
