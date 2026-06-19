#!/usr/bin/env node
/**
 * セッション内で触ったアプリの BUILD 三重照合（repo ↔ cio-live-builds ↔ kintone live JS）。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/cio-audit-session-builds.mjs
 *   ... 595 674 688
 *   ... --strict   # NG で exit 2（portfolio audit と同型）
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { extractBuildFromSource, readLiveBuildRegistry } from './cio-live-build-registry.mjs';

const DEFAULT_APPS = [
  ['595', 'customize/595/desktop.js'],
  ['674', 'customize/new-pc-ledger-v1/desktop.js'],
  ['688', 'customize/688/desktop.js'],
  ['700', 'customize/business-improvement-proposal/desktop.js'],
  ['721', 'customize/jr-ipad-dash/desktop.js'],
  ['734', 'customize/vpn-account-dash/desktop.js'],
];

const strict = process.argv.includes('--strict');
const ids = process.argv.filter((a) => /^\d{3}$/.test(a));

function resolveApps() {
  if (!ids.length) return DEFAULT_APPS;
  const reg = readLiveBuildRegistry();
  return ids.map((id) => {
    const rel = reg.apps?.[id]?.relPath;
    if (rel && existsSync(path.join(process.cwd(), rel))) return [id, rel.replace(/\\/g, '/')];
    throw new Error(`app=${id}: registry relPath missing or file not found (${rel || '-'})`);
  });
}

function kintoneBase() {
  let base = String(process.env.KINTONE_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!base && process.env.KINTONE_DOMAIN) {
    base = `https://${String(process.env.KINTONE_DOMAIN).trim().replace(/^https?:\/\//, '')}`;
  }
  base = base.replace(/\/k$/, '');
  if (!base) throw new Error('KINTONE_BASE_URL or KINTONE_DOMAIN required');
  return base;
}

function authHeaders() {
  const user = process.env.KINTONE_USERNAME;
  const pass = process.env.KINTONE_PASSWORD;
  if (!user || !pass) throw new Error('KINTONE_USERNAME / KINTONE_PASSWORD required');
  return {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  };
}

async function liveBuild(appId) {
  const base = kintoneBase();
  const h = authHeaders();
  const url = new URL(`${base}/k/v1/preview/app/customize.json`);
  url.searchParams.set('app', String(appId));
  const res = await fetch(url, { method: 'GET', headers: h });
  const json = await res.json();
  if (!res.ok) throw new Error(`customize GET ${appId}: ${json?.message || res.status}`);
  const fk = json?.desktop?.js?.[0]?.file?.fileKey;
  if (!fk) return { build: null, revision: json?.revision };
  const fr = await fetch(`${base}/k/v1/file.json?fileKey=${encodeURIComponent(fk)}`, { headers: h });
  if (!fr.ok) throw new Error(`file GET ${appId}: HTTP ${fr.status}`);
  return { build: extractBuildFromSource(await fr.text()), revision: json?.revision };
}

async function main() {
  const apps = resolveApps();
  const reg = readLiveBuildRegistry();
  let ng = 0;

  console.log(`[cio-audit-session-builds] apps=${apps.map((a) => a[0]).join(', ')}`);

  for (const [id, rel] of apps) {
    const repo = extractBuildFromSource(readFileSync(path.join(process.cwd(), rel), 'utf8'));
    const ledger = reg.apps?.[id]?.build || null;
    const live = await liveBuild(id);
    const issues = [];
    if (repo !== ledger) issues.push(`ledger≠repo (${ledger} vs ${repo})`);
    if (repo !== live.build) issues.push(`live≠repo (${live.build} vs ${repo})`);
    const status = issues.length ? 'NG' : 'OK';
    if (status === 'NG') ng++;
    console.log(
      `[${status}] app=${id} repo=${repo} ledger=${ledger || '-'} live=${live.build || '-'} rev=${live.revision ?? '-'}`,
    );
    if (issues.length) console.log('  →', issues.join('; '));
  }

  if (ng > 0) {
    console.error(`[cio-audit-session-builds] NG ${ng}/${apps.length}`);
    process.exit(strict ? 2 : 1);
  }
  console.log(`[cio-audit-session-builds] OK ${apps.length}/${apps.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
