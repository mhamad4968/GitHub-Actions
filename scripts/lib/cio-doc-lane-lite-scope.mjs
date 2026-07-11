/**
 * data/cio-doc-lane-lite-scope.json — doc-lane lite スコープ正本ローダ
 * @see docs/plans/2026-07-11-constitution-lifecycle-v2-spec.md §6
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCOPE_REL = 'data/cio-doc-lane-lite-scope.json';

/** @param {string} [root] */
export function loadDocLaneLiteScope(root = defaultRoot) {
  const p = path.join(root, SCOPE_REL);
  if (!fs.existsSync(p)) {
    throw new Error(`missing ${SCOPE_REL}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * @param {object} scope
 * @param {string} relPath
 */
export function pathForbiddenForLiteScope(scope, relPath) {
  const p = String(relPath || '').replace(/\\/g, '/');
  for (const pre of scope.forbiddenPrefixes || []) {
    if (p === pre || p.startsWith(pre)) return true;
  }
  for (const pre of scope.forbiddenConstitutionPrefixes || []) {
    if (p.startsWith(pre)) return true;
  }
  for (const exact of scope.forbiddenExact || []) {
    if (p === exact) return true;
  }
  for (const pat of scope.forbiddenPatterns || []) {
    if (pat.includes(':') ? new RegExp(pat, 'i').test(p) : p.includes(pat)) return true;
  }
  return false;
}

export function getLiteLimits(scope) {
  return {
    maxPaths: scope.limits?.maxPaths ?? 1,
    maxAddedLines: scope.limits?.maxAddedLines ?? 20,
  };
}
