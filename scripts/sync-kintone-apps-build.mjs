#!/usr/bin/env node
/** R3 — kintone-apps.md の BUILD=`...` を live registry / desktop.js と同期 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { extractBuildFromSource, readLiveBuildRegistry } from './cio-live-build-registry.mjs';

const appId = String(process.argv[2] || '').trim();
if (!/^\d{3}$/.test(appId)) {
  console.error('Usage: node scripts/sync-kintone-apps-build.mjs <appId>');
  process.exit(2);
}

const mdPath = path.join(process.cwd(), 'kintone-apps.md');
let md = readFileSync(mdPath, 'utf8');

const reg = readLiveBuildRegistry();
let build = reg.apps?.[appId]?.build || null;
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
  console.warn(`[sync-kintone-apps-build] skip app=${appId} (no BUILD)`);
  process.exit(0);
}

const rowRe = new RegExp(
  `(\\|\\s*\\*\\*[^|]*\\*\\*\\s*\\|\\s*\\*\\*${appId}\\*\\*\\s*\\|[^|]*\\|[^|]*\\*\\*BUILD=\`)([^\`]+)(\`[^|]*\\|)`,
  'm',
);
if (!rowRe.test(md)) {
  console.warn(`[sync-kintone-apps-build] skip app=${appId} (row not found)`);
  process.exit(0);
}

const next = md.replace(rowRe, `$1${build}$3`);
if (next === md) {
  console.log(`[sync-kintone-apps-build] already synced app=${appId} BUILD=${build}`);
  process.exit(0);
}

writeFileSync(mdPath, next, 'utf8');
console.log(`[sync-kintone-apps-build] updated app=${appId} BUILD=${build}`);
