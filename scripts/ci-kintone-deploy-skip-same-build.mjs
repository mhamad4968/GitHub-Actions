#!/usr/bin/env node
/**
 * CI: リポ BUILD と cio-live-builds が同一なら kintone API 再デプロイをスキップ（#I-688-GHA-01）
 *
 * Usage: node scripts/ci-kintone-deploy-skip-same-build.mjs <appId> <srcPath> [--force]
 * Exit 0 = deploy 続行 / Exit 1 = skip（同一 BUILD）
 */
import { readFileSync, existsSync } from 'node:fs';
import { extractBuildFromSource, readLiveBuildRegistry } from './cio-live-build-registry.mjs';

const appId = process.argv[2];
const srcPath = process.argv[3];
const force = process.argv.includes('--force');

if (!appId || !/^\d+$/.test(appId) || !srcPath) {
  console.error('Usage: node scripts/ci-kintone-deploy-skip-same-build.mjs <appId> <srcPath> [--force]');
  process.exit(2);
}

if (!existsSync(srcPath)) {
  console.error(`[ci-kintone-deploy-skip-same-build] NG missing file: ${srcPath}`);
  process.exit(2);
}

const build = extractBuildFromSource(readFileSync(srcPath, 'utf8'));
if (!build) {
  console.log(`[ci-kintone-deploy-skip-same-build] DEPLOY app=${appId} (BUILD not found in source — skip guard off)`);
  process.exit(0);
}

const live = readLiveBuildRegistry().apps?.[String(appId)];
if (!force && live?.build === build) {
  console.log(
    `[ci-kintone-deploy-skip-same-build] SKIP app=${appId} BUILD=${build} (matches cio-live-builds)`,
  );
  process.exit(1);
}

console.log(
  `[ci-kintone-deploy-skip-same-build] DEPLOY app=${appId} BUILD=${build} registry=${live?.build ?? '—'}`,
);
process.exit(0);
