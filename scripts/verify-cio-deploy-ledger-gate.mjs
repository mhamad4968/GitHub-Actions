#!/usr/bin/env node
/**
 * R21 — deploy 台帳整合ゲート（registry ↔ repo ↔ kintone-apps.md）
 *
 * デフォルト --session-only: origin/main 以降の diff で触った appId のみ検査。
 * --all: registry 全件（customize 正本あり）— 月次メンテ用。
 *
 * Usage:
 *   node scripts/verify-cio-deploy-ledger-gate.mjs
 *   node scripts/verify-cio-deploy-ledger-gate.mjs --all
 *   node scripts/verify-cio-deploy-ledger-gate.mjs --apps 736,688
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractBuildFromSource,
  readLiveBuildRegistry,
} from './cio-live-build-registry.mjs';
import {
  parsePortfolioMachineBuild,
  parsePortfolioDetailBuild,
} from './lib/cio-kintone-apps-portfolio-build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mdPath = path.join(root, 'kintone-apps.md');

const allMode = process.argv.includes('--all');
const appsArgIdx = process.argv.indexOf('--apps');
const explicitApps =
  appsArgIdx >= 0
    ? String(process.argv[appsArgIdx + 1] || '')
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter((s) => /^\d{3}$/.test(s))
    : [];

/** テナント削除済 — 台帳行が残っていても gate 対象外 */
const EXCLUDED_APP_IDS = new Set(['594', '626', '627', '651', '652', '653', '668', '681']);

function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return (r.stdout || '').trim();
}

function normalizeRel(rel) {
  if (!rel) return null;
  return String(rel).replace(/\\/g, '/').replace(/^[a-z]:\//i, (m) => m.toLowerCase());
}

function repoSourceRel(appId, registryRel) {
  const norm = normalizeRel(registryRel);
  if (norm && norm.startsWith('customize/') && existsSync(path.join(root, norm))) {
    return norm;
  }
  const candidates = [
    `customize/${appId}/desktop.js`,
    `customize/${appId}/desktop.bundle.js`,
  ];
  for (const c of candidates) {
    if (existsSync(path.join(root, c))) return c;
  }
  return null;
}

function discoverSessionAppIds() {
  const ids = new Set(explicitApps);
  const upstream = git(['rev-parse', '--abbrev-ref', '@{u}']);
  const range =
    upstream && !upstream.includes('fatal') ? `${upstream}...HEAD` : 'HEAD~20..HEAD';
  const files = new Set([
    ...git(['diff', '--name-only', range]).split(/\r?\n/).filter(Boolean),
    ...git(['diff', '--name-only']).split(/\r?\n/).filter(Boolean),
    ...git(['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean),
  ]);

  for (const f of files) {
    const num = f.match(/^customize\/(\d{3})\//);
    if (num) ids.add(num[1]);
    if (f === 'data/cio-live-builds.json' || f.endsWith('cio-live-builds.json')) {
      const upstream = git(['rev-parse', '--abbrev-ref', '@{u}']);
      const range =
        upstream && !upstream.includes('fatal') ? `${upstream}...HEAD` : 'HEAD~20..HEAD';
      const diff = git(['diff', range, '--', 'data/cio-live-builds.json']);
      for (const line of diff.split(/\r?\n/)) {
        const m = line.match(/^\+.*"(\d{3})"\s*:\s*\{/);
        if (m) ids.add(m[1]);
      }
    }
    if (f === 'kintone-apps.md') {
      /* kintone-apps 単独変更 — registry 全件は見ない。BUILD 行パースは下流 check で */
    }
  }
  return [...ids].filter((id) => !EXCLUDED_APP_IDS.has(id));
}

function discoverAllAppIds() {
  const reg = readLiveBuildRegistry();
  return Object.keys(reg.apps || {}).filter((id) => !EXCLUDED_APP_IDS.has(id));
}

function checkApp(appId, md, reg) {
  const entry = reg.apps?.[appId];
  const issues = [];
  if (!entry?.build) {
    issues.push('registry: BUILD なし');
    return issues;
  }

  const srcRel = repoSourceRel(appId, entry.relPath);
  if (srcRel) {
    const src = readFileSync(path.join(root, srcRel), 'utf8');
    const repoBuild = extractBuildFromSource(src);
    if (!repoBuild) issues.push(`repo: BUILD 未検出 (${srcRel})`);
    else if (repoBuild !== entry.build) {
      issues.push(`registry≠repo (${entry.build} vs ${repoBuild})`);
    }
  }

  const machineBuild = parsePortfolioMachineBuild(md, appId);
  if (!machineBuild) {
    issues.push('kintone-apps: ポートフォリオ機械表に BUILD 行なし（R21 NG）');
  } else if (machineBuild !== entry.build) {
    issues.push(`kintone-apps機械表≠registry (${machineBuild} vs ${entry.build})`);
  }

  const detailBuild = parsePortfolioDetailBuild(md, appId);
  if (!detailBuild && machineBuild) {
    issues.push('kintone-apps: 詳細行 BUILD なし（R15/R21 NG — sync:kintone-apps-build --strict）');
  } else if (detailBuild && detailBuild !== entry.build) {
    issues.push(`kintone-apps詳細行≠registry (${detailBuild} vs ${entry.build})`);
  }

  return issues;
}

function main() {
  if (!existsSync(mdPath)) {
    console.error('[verify:deploy-ledger-gate] NG kintone-apps.md 不在');
    process.exit(1);
  }

  const md = readFileSync(mdPath, 'utf8');
  const reg = readLiveBuildRegistry();
  const appIds = allMode ? discoverAllAppIds() : discoverSessionAppIds();

  if (appIds.length === 0) {
    console.log('[verify:deploy-ledger-gate] OK skip（deploy/customize 触媒なし）');
    process.exit(0);
  }

  let ng = 0;
  for (const appId of appIds.sort()) {
    const issues = checkApp(appId, md, reg);
    if (issues.length) {
      ng++;
      console.error(`[verify:deploy-ledger-gate] NG app=${appId} → ${issues.join('; ')}`);
      console.error(`  fix: npm run sync:kintone-apps-build -- ${appId}  + kintone-apps 機械表行を確認`);
    } else {
      console.log(`[verify:deploy-ledger-gate] OK app=${appId} BUILD=${reg.apps[appId].build}`);
    }
  }

  if (ng > 0) {
    console.error(`[verify:deploy-ledger-gate] NG ${ng}/${appIds.length} — セッション締め不可（R21）`);
    process.exit(1);
  }
  console.log(`[verify:deploy-ledger-gate] OK ${appIds.length} app(s)`);
  process.exit(0);
}

main();
