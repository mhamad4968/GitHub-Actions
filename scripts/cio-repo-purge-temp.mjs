#!/usr/bin/env node
/**
 * リポジトリ内の一時ファイル・作業残骸を purge
 *
 * Usage:
 *   npm run cio:repo:purge-temp           # dry-run
 *   npm run cio:repo:purge-temp -- --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { isSessionCloseTempPath } from './lib/cio-session-close-temp-paths.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function rel(p) {
  return path.relative(root, p).replace(/\\/g, '/');
}

function collectCandidates() {
  const found = new Set();

  const scanDirs = [
    path.join(root, 'data'),
    path.join(root, 'docs', 'approved-changes', 'pending'),
    path.join(root, 'scripts'),
    path.join(root, 'logs'),
  ];

  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const r = rel(full);
      if (isSessionCloseTempPath(r)) found.add(full);
      if (dir.endsWith('scripts') && /^tmp-.*\.mjs$/i.test(name)) found.add(full);
      if (dir.endsWith('scripts') && /^_tmp-.*\.mjs$/i.test(name)) found.add(full);
      if (dir.endsWith('data') && /^tmp-.*\.(txt|json)$/i.test(name)) found.add(full);
      if (dir.endsWith('logs') && (/^tmp-.*\.md$/i.test(name) || /^_cio-draft-.*\.txt$/i.test(name) || /^tmp-briefing-.*\.md$/i.test(name))) {
        found.add(full);
      }
    }
  }

  return [...found].sort();
}

function main() {
  const apply = process.argv.includes('--apply');
  const candidates = collectCandidates();
  if (!candidates.length) {
    console.log('[cio:repo:purge-temp] OK nothing to purge');
    process.exit(0);
  }

  let removed = 0;
  for (const full of candidates) {
    if (!fs.existsSync(full)) continue;
    if (apply) {
      fs.unlinkSync(full);
      removed++;
    }
    console.log(`[cio:repo:purge-temp] ${apply ? 'removed' : 'would remove'}`, rel(full));
  }

  console.log('[cio:repo:purge-temp]', apply ? 'OK' : 'dry-run', `count=${candidates.length}`, apply ? `removed=${removed}` : '');
  if (!apply) {
    console.log('[cio:repo:purge-temp] hint: npm run cio:repo:purge-temp -- --apply');
  }
  process.exit(0);
}

main();
