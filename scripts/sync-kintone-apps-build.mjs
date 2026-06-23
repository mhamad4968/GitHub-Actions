#!/usr/bin/env node
/** R3/R21 — kintone-apps.md の BUILD を live registry / desktop.js と同期 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { extractBuildFromSource, readLiveBuildRegistry } from './cio-live-build-registry.mjs';
import {
  parsePortfolioMachineBuild,
  updatePortfolioMachineBuild,
  updatePortfolioDetailBuild,
} from './lib/cio-kintone-apps-portfolio-build.mjs';

const appId = String(process.argv[2] || '').trim();
const strict = process.argv.includes('--strict');
if (!/^\d{3}$/.test(appId)) {
  console.error('Usage: node scripts/sync-kintone-apps-build.mjs <appId> [--strict]');
  process.exit(2);
}

const mdPath = path.join(process.cwd(), 'kintone-apps.md');
let md = readFileSync(mdPath, 'utf8');

const reg = readLiveBuildRegistry();
const entry = reg.apps?.[appId] || null;
let build = entry?.build || null;
let revision = entry?.revision || null;
if (!build) {
  const rel = appId === '688' ? 'customize/688/desktop.js' : appId === '687' ? 'customize/687/desktop.js' : null;
  if (rel) {
    try {
      build = extractBuildFromSource(readFileSync(path.join(process.cwd(), rel), 'utf8'));
    } catch {
      /* noop */
    }
  }
}
if (!build) {
  const msg = `[sync-kintone-apps-build] skip app=${appId} (no BUILD)`;
  if (strict) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
  process.exit(0);
}

const rowRe = new RegExp(
  `(\\|\\s*\\*\\*[^|]*\\*\\*\\s*\\|\\s*\\*\\*${appId}\\*\\*\\s*\\|[^|]*\\|[^|]*\\*\\*BUILD=\`)([^\`]+)(\`[^|]*\\|)`,
  'm',
);
let changed = false;

const machineBefore = parsePortfolioMachineBuild(md, appId);
const machineUpdate = updatePortfolioMachineBuild(md, appId, build, revision);
if (machineUpdate.changed) {
  md = machineUpdate.md;
  changed = true;
  console.log(`[sync-kintone-apps-build] machine table app=${appId} BUILD=${build}`);
} else if (!machineBefore) {
  const warn = `[sync-kintone-apps-build] ⚠️ R15/R21 WARN: app=${appId} — ポートフォリオ機械表に行がありません。手動追加してください。`;
  console.warn(warn);
  if (strict) process.exit(1);
}

if (!rowRe.test(md)) {
  const warn = `[sync-kintone-apps-build] ⚠️ R15 WARN: app=${appId} — kintone-apps.md 詳細行（**BUILD=**）がありません。`;
  console.warn(warn);
  if (strict) process.exit(1);
} else {
  const detailUpdate = updatePortfolioDetailBuild(md, appId, build, revision);
  if (detailUpdate.changed) {
    md = detailUpdate.md;
    changed = true;
    console.log(
      `[sync-kintone-apps-build] detail row app=${appId} BUILD=${build} rev=${revision || '—'}`,
    );
  }
}

if (!changed) {
  console.log(`[sync-kintone-apps-build] already synced app=${appId} BUILD=${build}`);
  process.exit(0);
}

writeFileSync(mdPath, md, 'utf8');
console.log(`[sync-kintone-apps-build] updated app=${appId} BUILD=${build}`);
