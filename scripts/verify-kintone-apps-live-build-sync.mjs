#!/usr/bin/env node
/**
 * R-595-03 — kintone-apps.md の BUILD/rev が cio-live-builds.json と一致するか（garble 検知）
 * #S-SYNC-01 — fileKey もレジストリと三点照合（BUILD/rev だけでは不足）
 *
 * Usage:
 *   node scripts/verify-kintone-apps-live-build-sync.mjs <appId> [--strict]
 *   node scripts/verify-kintone-apps-live-build-sync.mjs --all [--strict]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { readLiveBuildRegistry } from './cio-live-build-registry.mjs';
import {
  parsePortfolioDetailBuild,
  parsePortfolioDetailFileKey,
  parsePortfolioMachineBuild,
  parsePortfolioMachineFileKey,
} from './lib/cio-kintone-apps-portfolio-build.mjs';

const strict = process.argv.includes('--strict');
const all = process.argv.includes('--all');
const appId = process.argv.find((a) => /^\d{3}$/.test(a)) || null;

if (!all && !appId) {
  console.error('Usage: node scripts/verify-kintone-apps-live-build-sync.mjs <appId>|--all [--strict]');
  process.exit(2);
}

const mdPath = path.join(process.cwd(), 'kintone-apps.md');
const md = readFileSync(mdPath, 'utf8');
const reg = readLiveBuildRegistry();

function detectDetailGarble(mdText, id) {
  const lineRe = new RegExp(`^\\|[^\\n]*\\*\\*${id}\\*\\*[^\\n]*\\|`, 'm');
  const line = mdText.match(lineRe)?.[0];
  if (!line) return null;
  const revHits = line.match(/rev\s*\*\*/g) || [];
  if (revHits.length > 1) return `duplicate rev markers (${revHits.length})`;
  const buildHits = line.match(/BUILD=`/g) || [];
  if (buildHits.length > 1) return `duplicate BUILD markers (${buildHits.length})`;
  return null;
}

function verifyOne(id) {
  const issues = [];
  const entry = reg.apps?.[id];
  if (!entry?.build) {
    issues.push('registry BUILD missing');
    return issues;
  }
  const garble = detectDetailGarble(md, id);
  if (garble) issues.push(`garble: ${garble}`);

  const machine = parsePortfolioMachineBuild(md, id);
  const detail = parsePortfolioDetailBuild(md, id);
  if (!machine) issues.push('machine table row missing');
  else if (machine !== entry.build) issues.push(`machine BUILD mismatch (${machine} vs ${entry.build})`);
  if (!detail) issues.push('detail BUILD row missing');
  else if (detail !== entry.build) issues.push(`detail BUILD mismatch (${detail} vs ${entry.build})`);

  if (entry.revision != null && machine) {
    const revRe = new RegExp(`^\\|\\s*${id}\\s*\\|\\s*\`[^\`]+\`\\s*\\|\\s*\\*\\*([^*]+)\\*\\*`, 'm');
    const revM = md.match(revRe);
    const revCell = revM ? revM[1].trim() : null;
    if (revCell && revCell !== String(entry.revision)) {
      issues.push(`machine rev mismatch (${revCell} vs ${entry.revision})`);
    }
  }

  // #S-SYNC-01 — fileKey 三点（レジストリに fileKey があるアプリのみ必須）
  if (entry.fileKey) {
    const machineKey = parsePortfolioMachineFileKey(md, id);
    const detailKey = parsePortfolioDetailFileKey(md, id);
    if (!machineKey) issues.push('machine fileKey missing (#S-SYNC-01)');
    else if (machineKey !== entry.fileKey) {
      issues.push(`machine fileKey mismatch (${machineKey} vs ${entry.fileKey}) (#S-SYNC-01)`);
    }
    if (!detailKey) issues.push('detail fileKey missing (#S-SYNC-01)');
    else if (detailKey !== entry.fileKey) {
      issues.push(`detail fileKey mismatch (${detailKey} vs ${entry.fileKey}) (#S-SYNC-01)`);
    }
  }
  return issues;
}

const ids = all ? Object.keys(reg.apps || {}).filter((k) => /^\d{3}$/.test(k)) : [appId];
let ng = 0;

for (const id of ids) {
  const issues = verifyOne(id);
  if (issues.length) {
    ng++;
    console.error(`[verify-kintone-apps-live-build-sync] NG app=${id}: ${issues.join('; ')}`);
    console.error(`  → npm run sync:kintone-apps-build -- ${id} --strict`);
  } else {
    console.log(`[verify-kintone-apps-live-build-sync] OK app=${id}`);
  }
}

if (ng) {
  process.exit(strict ? 1 : 0);
}
console.log(`[verify-kintone-apps-live-build-sync] OK ${ids.length}/${ids.length}`);
process.exit(0);
