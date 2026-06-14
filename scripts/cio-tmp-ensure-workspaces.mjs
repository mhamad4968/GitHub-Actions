#!/usr/bin/env node
/**
 * C:\tmp 都度作成フォルダを ensure（data/c-tmp-workspace-registry.json）
 *
 * Usage:
 *   npm run cio:tmp:ensure-workspaces
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'data', 'c-tmp-workspace-registry.json');

function main() {
  if (!fs.existsSync(registryPath)) {
    console.error('[cio:tmp:ensure-workspaces] NG registry missing:', registryPath);
    process.exit(1);
  }
  const { folders = [] } = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const targets = folders.filter((f) => f.ensureBeforeUse || f.status === 'on-demand');
  let created = 0;
  for (const f of targets) {
    const dir = f.path;
    if (!dir) continue;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('[cio:tmp:ensure-workspaces] created', dir);
      created++;
    } else {
      console.log('[cio:tmp:ensure-workspaces] exists', dir);
    }
  }
  console.log('[cio:tmp:ensure-workspaces] OK', `checked=${targets.length}`, `created=${created}`);
}

main();
