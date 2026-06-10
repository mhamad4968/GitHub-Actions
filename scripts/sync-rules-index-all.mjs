#!/usr/bin/env node
/** rules:sync-mdc-index + rules:sync-section-mdc + rules:sync-section-genre を一括 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;

for (const script of [
  'sync-rules-index-mdc-links.mjs',
  'sync-rules-index-section-mdc.mjs',
  'sync-rules-index-section-genre.mjs',
]) {
  const r = spawnSync(node, [path.join(root, 'scripts', script)], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}
