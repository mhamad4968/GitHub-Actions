#!/usr/bin/env node
/**
 * S-741-01 — *-app-ids.json 整合（registry に app があるのに null 禁止）
 *
 * Usage:
 *   node scripts/verify-kintone-app-ids.mjs
 *   node scripts/verify-kintone-app-ids.mjs --slug mfp-ledger
 *   node scripts/verify-kintone-app-ids.mjs --all
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'data/kintone-customize-path-registry.json');

function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function slugFromArgv() {
  const i = process.argv.indexOf('--slug');
  if (i >= 0) return String(process.argv[i + 1] || '').trim();
  return '';
}

function appIdsPathForSlug(slug) {
  return path.join(root, 'scripts/data', `${slug}-app-ids.json`);
}

function inferSlugFromRegistryDir(dir) {
  const base = dir.replace(/-db$/, '').replace(/-dash$/, '');
  return base;
}

function collectSlugs(registry) {
  const dirs = Object.keys(registry.paths || {});
  const slugs = new Set();
  for (const dir of dirs) {
    if (dir.endsWith('-db') || dir.endsWith('-dash')) {
      slugs.add(inferSlugFromRegistryDir(dir));
    }
  }
  return [...slugs].sort();
}

function verifySlug(slug) {
  const idsPath = appIdsPathForSlug(slug);
  if (!existsSync(idsPath)) {
    console.warn(`[verify:kintone-app-ids] skip ${slug}: no ${idsPath}`);
    return true;
  }
  const ids = loadJson(idsPath);
  const errors = [];
  if (ids.dbAppId == null && ids.dashAppId == null) {
    errors.push(`${slug}: both dbAppId and dashAppId are null`);
  }
  if (ids.dbAppId === null && ids.dashAppId != null) {
    errors.push(`${slug}: dbAppId is null but dashAppId=${ids.dashAppId}`);
  }
  if (ids.dashAppId === null && ids.dbAppId != null) {
    errors.push(`${slug}: dashAppId is null but dbAppId=${ids.dbAppId}`);
  }
  if (errors.length) {
    for (const e of errors) console.error(`[verify:kintone-app-ids] NG ${e}`);
    return false;
  }
  console.log(`[verify:kintone-app-ids] OK ${slug} db=${ids.dbAppId} dash=${ids.dashAppId}`);
  return true;
}

function main() {
  const slugArg = slugFromArgv();
  const all = process.argv.includes('--all');
  const registry = loadJson(registryPath);

  let slugs;
  if (slugArg) {
    slugs = [slugArg];
  } else if (all) {
    slugs = collectSlugs(registry);
  } else {
    slugs = ['mfp-ledger'];
  }

  let ok = true;
  for (const slug of slugs) {
    if (!verifySlug(slug)) ok = false;
  }
  process.exit(ok ? 0 : 1);
}

main();
