/**
 * R37 — customize registry への安全な追記（実装時登録）
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadCustomizePathRegistry, REPO_ROOT_FROM_LIB } from './kintone-customize-path-registry.mjs';

/**
 * @param {object} opts
 * @param {string} opts.dir — customize ディレクトリ名（例 jr-ipad-db）
 * @param {string|number} opts.appId
 * @param {string} [opts.bundleNpm] — bundle 型のみ（例 jr-ipad:bundle-dash）
 * @param {string} [opts.root]
 * @param {boolean} [opts.dryRun]
 */
export function ensureCustomizeRegistryMapping(opts) {
  const root = opts.root || REPO_ROOT_FROM_LIB;
  const dir = String(opts.dir || '').trim();
  const appId = String(opts.appId || '').trim();
  if (!dir || !/^\d+$/.test(appId)) {
    throw new Error(`ensureCustomizeRegistryMapping: invalid dir=${dir} appId=${appId}`);
  }

  const registryPath = path.join(root, 'data/kintone-customize-path-registry.json');
  const json = loadCustomizePathRegistry(root);
  const existing = json.mappings[dir];
  if (existing && existing !== appId) {
    throw new Error(`registry conflict: ${dir} is ${existing}, cannot set ${appId}`);
  }

  let changed = false;
  if (!existing) {
    json.mappings[dir] = appId;
    changed = true;
  }

  if (opts.bundleNpm) {
    json.bundlePatterns = json.bundlePatterns || {};
    const bp = json.bundlePatterns[dir] || {};
    const next = {
      deployFile: 'desktop.js',
      lintFile: 'desktop.src.js',
      bundleNpm: opts.bundleNpm,
    };
    if (JSON.stringify(bp) !== JSON.stringify(next)) {
      json.bundlePatterns[dir] = next;
      changed = true;
    }
  }

  if (!changed) {
    return { changed: false, registryPath };
  }
  if (opts.dryRun) {
    return { changed: true, dryRun: true, registryPath };
  }
  fs.writeFileSync(registryPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  return { changed: true, registryPath };
}
