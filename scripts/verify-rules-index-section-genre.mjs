#!/usr/bin/env node
/**
 * §↔ジャンル マップと RULES-INDEX 自動節の整合
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  buildMergedSectionGenreMap,
  toJsonSerializable,
} from './lib/rules-index-section-genre.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BEGIN = '<!-- RULES-INDEX:SECTION-GENRE-AUTO:BEGIN -->';

function main() {
  const issues = [];
  const ri = fs.readFileSync(path.join(root, 'RULES-INDEX.md'), 'utf8');
  if (!ri.includes(BEGIN)) {
    issues.push('RULES-INDEX missing SECTION-GENRE-AUTO — run npm run rules:sync-section-genre');
  }

  const mapPath = path.join(root, 'data', 'constitution-section-genre-map.json');
  const catalogPath = path.join(root, 'data', 'constitution-genre-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    issues.push('missing data/constitution-genre-catalog.json');
  }
  if (!fs.existsSync(mapPath)) {
    issues.push('missing data/constitution-section-genre-map.json');
  } else {
    const onDisk = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const fresh = toJsonSerializable(buildMergedSectionGenreMap(root));
    if (JSON.stringify(onDisk.sectionToGenre) !== JSON.stringify(fresh.sectionToGenre)) {
      issues.push('section-genre-map.json stale — run npm run rules:sync-section-genre');
    }
    if (onDisk.catalogVersion && catalogPath) {
      const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      if (onDisk.catalogVersion !== cat.version) {
        issues.push('section-genre-map catalogVersion mismatch — run npm run rules:sync-section-genre');
      }
    }
  }

  const must = ['§41', '§50-3-8', '§50-3-11', '§35-1'];
  if (fs.existsSync(mapPath)) {
    const m = JSON.parse(fs.readFileSync(mapPath, 'utf8')).sectionToGenre;
    for (const s of must) {
      if (!m[s]?.length) issues.push(`map missing required ${s}`);
    }
  }

  if (issues.length) {
    console.error('[verify-rules-index-section-genre] NG', issues.length);
    for (const x of issues) console.error('  -', x);
    process.exit(1);
  }
  console.log('[verify-rules-index-section-genre] OK');
  process.exit(0);
}

main();
