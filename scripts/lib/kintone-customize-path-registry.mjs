/**
 * R37 — customize ディレクトリ名 → appId 正本ローダ
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT_FROM_LIB = path.resolve(libDir, '../..');

export function loadCustomizePathRegistry(root = REPO_ROOT_FROM_LIB) {
  const p = path.join(root, 'data/kintone-customize-path-registry.json');
  if (!fs.existsSync(p)) {
    throw new Error(`missing ${p}`);
  }
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!json.mappings || typeof json.mappings !== 'object') {
    throw new Error('kintone-customize-path-registry.json: mappings required');
  }
  return json;
}

/** @returns {Record<string, string>} dirName → appId */
export function getCustomizeDirToApp(root = REPO_ROOT_FROM_LIB) {
  return { ...loadCustomizePathRegistry(root).mappings };
}
