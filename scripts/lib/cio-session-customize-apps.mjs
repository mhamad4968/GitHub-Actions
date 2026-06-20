/**
 * セッション diff から customize 触媒 appId を検出（R21/R55 共通）
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { readLiveBuildRegistry } from '../cio-live-build-registry.mjs';

/** 台帳行が残っていても gate 対象外 */
export const EXCLUDED_CUSTOMIZE_APP_IDS = new Set([
  '594',
  '626',
  '627',
  '651',
  '652',
  '653',
  '668',
  '681',
]);

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return (r.stdout || '').trim();
}

function normalizeRel(rel) {
  if (!rel) return null;
  return String(rel).replace(/\\/g, '/').replace(/^[a-z]:\//i, (m) => m.toLowerCase());
}

/**
 * @param {string} root — リポジトリルート
 * @param {{ explicitAppIds?: string[] }} opts
 * @returns {string[]}
 */
export function discoverSessionCustomizeAppIds(root, opts = {}) {
  const explicit = (opts.explicitAppIds || [])
    .map((s) => String(s).trim())
    .filter((s) => /^\d{3}$/.test(s));
  const ids = new Set(explicit);

  const upstream = git(root, ['rev-parse', '--abbrev-ref', '@{u}']);
  const range =
    upstream && !upstream.includes('fatal') ? `${upstream}...HEAD` : 'HEAD~20..HEAD';
  const files = new Set([
    ...git(root, ['diff', '--name-only', range]).split(/\r?\n/).filter(Boolean),
    ...git(root, ['diff', '--name-only']).split(/\r?\n/).filter(Boolean),
    ...git(root, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean),
  ]);

  const reg = readLiveBuildRegistry();
  const registryPaths = Object.entries(reg.apps || {}).map(([appId, entry]) => ({
    appId,
    rel: normalizeRel(entry.relPath),
  }));

  for (const f of files) {
    const norm = normalizeRel(f);
    const num = f.match(/^customize\/(\d{3})\//);
    if (num) ids.add(num[1]);

    for (const { appId, rel } of registryPaths) {
      if (!rel || !norm) continue;
      if (norm === rel || norm.startsWith(rel.replace(/\/[^/]+$/, '/'))) {
        ids.add(appId);
      }
    }

    if (f === 'data/cio-live-builds.json' || f.endsWith('cio-live-builds.json')) {
      const diff = git(root, ['diff', range, '--', 'data/cio-live-builds.json']);
      for (const line of diff.split(/\r?\n/)) {
        const m = line.match(/^\+.*"(\d{3})"\s*:\s*\{/);
        if (m) ids.add(m[1]);
      }
    }
  }

  return [...ids].filter((id) => !EXCLUDED_CUSTOMIZE_APP_IDS.has(id));
}

/**
 * @param {string} root
 * @param {string[]} appIds
 * @returns {Array<[string, string]>}
 */
export function resolveCustomizeAppPaths(root, appIds) {
  const reg = readLiveBuildRegistry();
  const out = [];
  for (const id of appIds) {
    const rel = reg.apps?.[id]?.relPath;
    const norm = normalizeRel(rel);
    if (norm && norm.startsWith('customize/')) {
      if (existsSync(path.join(root, norm))) {
        out.push([id, norm]);
        continue;
      }
    }
    const fallback = `customize/${id}/desktop.js`;
    if (existsSync(path.join(root, fallback))) {
      out.push([id, fallback]);
    }
  }
  return out;
}
