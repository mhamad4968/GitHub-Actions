#!/usr/bin/env node
/**
 * S-TMP-01 — C:\tmp 台帳 vs 実フォルダ突合
 * @see data/c-tmp-workspace-registry.json
 * @see docs/runbooks/c-tmp-workspace-lifecycle.md
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_REL = 'data/c-tmp-workspace-registry.json';
const ARCHIVE_REL = 'scripts/data/archive/closed-v1-migration-sources';

/** @param {string} p */
function pathExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function main() {
  const regPath = path.join(root, REGISTRY_REL);
  const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  const issues = [];

  for (const f of reg.folders || []) {
    if (f.status === 'on-demand' && f.ensureBeforeUse) continue;
    if (f.status === 'keep' && f.path && !pathExists(f.path)) {
      issues.push(`keep フォルダ欠落: ${f.path} (${f.id})`);
    }
  }

  for (const r of reg.removedClosedV1Folders || []) {
    if (r.path && pathExists(r.path)) {
      issues.push(`removedClosedV1 が残存: ${r.path} (${r.closure})`);
    }
  }

  if ((reg.removedClosedV1Folders || []).length > 0) {
    const readme = path.join(root, ARCHIVE_REL, 'README.md');
    if (!fs.existsSync(readme)) {
      issues.push(`archive 正本欠落: ${ARCHIVE_REL}/README.md`);
    }
  }

  if (issues.length) {
    console.error('[verify:c-tmp-registry] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }

  const keep = (reg.folders || []).filter((f) => f.status === 'keep').length;
  const removed = (reg.removedClosedV1Folders || []).length;
  console.log(`[verify:c-tmp-registry] OK keep=${keep} removedClosedV1=${removed} version=${reg.version}`);
  process.exit(0);
}

main();
