#!/usr/bin/env node
/**
 * git-history-guard-manifest.json の generations[] を git log から同期
 * npm run sync:git-history-generations [-- --apply]
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  discoverGovernanceGenerationsFromGit,
  getCommitDetail,
  loadGuardManifest,
} from './lib/git-history-alignment.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(root, 'data/git-history-guard-manifest.json');

function main() {
  const apply = process.argv.includes('--apply');
  const fresh = discoverGovernanceGenerationsFromGit(root, 3);
  if (!fresh.length) {
    console.error('[sync:git-history-generations] NG governance コミット未検出');
    process.exit(1);
  }

  const manifest = loadGuardManifest(root);
  const nextGenerations = fresh.map((hash) => {
    const d = getCommitDetail(root, hash);
    return {
      hash,
      label: d.subject.slice(0, 120),
      at: new Date().toISOString().slice(0, 10),
    };
  });

  const prev = (manifest.generations || []).map((g) => (typeof g === 'string' ? g : g.hash)).join(',');
  const cur = nextGenerations.map((g) => g.hash).join(',');

  console.log('[sync:git-history-generations] fresh', cur);
  if (prev === cur) {
    console.log('[sync:git-history-generations] OK 変更なし');
    process.exit(0);
  }

  console.log('[sync:git-history-generations] drift', `${prev || '(none)'} → ${cur}`);

  if (!apply) {
    console.log('[sync:git-history-generations] dry-run — pass --apply to write manifest');
    process.exit(0);
  }

  manifest.generations = nextGenerations;
  manifest.version = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('[sync:git-history-generations] OK wrote data/git-history-guard-manifest.json');
  process.exit(0);
}

main();
