/**
 * Git working tree scope — Lite lane / session audit
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getLiteLimits,
  loadDocLaneLiteScope,
  pathForbiddenForLiteScope,
} from './cio-doc-lane-lite-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const _scope = loadDocLaneLiteScope(root);

/** v3.2 doc-lane lite コア禁止（JSON 正本と同期 — verify:doc-lane-lite-scope） */
export const LITE_FORBIDDEN_PREFIXES = _scope.forbiddenPrefixes;
export const LITE_FORBIDDEN_CONSTITUTION_PREFIXES = _scope.forbiddenConstitutionPrefixes;
export const LITE_FORBIDDEN_EXACT = _scope.forbiddenExact;
export const LITE_MAX_LINES = getLiteLimits(_scope).maxAddedLines;

function gitDiff(root) {
  const r = spawnSync('git', ['diff', 'HEAD'], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const staged = spawnSync('git', ['diff', '--cached'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return `${r.stdout || ''}\n${staged.stdout || ''}`;
}

export function workingTreeHasChanges(root) {
  return gitDiff(root).trim().length > 0;
}

export function countAddedLines(diff) {
  let n = 0;
  for (const line of String(diff || '').split(/\r?\n/)) {
    if (line.startsWith('+') && !line.startsWith('+++')) n += 1;
  }
  return n;
}

export function listChangedPaths(root) {
  const r = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  const staged = spawnSync('git', ['diff', '--cached', '--name-only'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  const set = new Set();
  for (const block of [r.stdout, staged.stdout]) {
    for (const p of String(block || '').split(/\r?\n/).filter(Boolean)) set.add(p.replace(/\\/g, '/'));
  }
  return [...set];
}

export function sessionTouchesCustomize(root) {
  return listChangedPaths(root).some((p) => p.startsWith('customize/'));
}

export function pathForbiddenForLite(relPath) {
  return pathForbiddenForLiteScope(_scope, relPath);
}

export function validateLiteScope(root) {
  const paths = listChangedPaths(root);
  const { maxPaths, maxAddedLines } = getLiteLimits(_scope);
  if (paths.length === 0) return { ok: true, paths: [] };
  if (paths.length > maxPaths) {
    return { ok: false, reason: `Lite は ${maxPaths} path のみ（現在 ${paths.length}）` };
  }
  const only = paths[0];
  if (pathForbiddenForLite(only)) {
    return { ok: false, reason: `Lite 禁止パス: ${only}` };
  }
  const diff = gitDiff(root);
  const added = countAddedLines(diff);
  if (added > maxAddedLines) {
    return { ok: false, reason: `Lite は追加 ${maxAddedLines} 行以下（現在 +${added}）` };
  }
  return { ok: true, paths: [only], addedLines: added };
}

export function quickTierBlockedByDiff(diffText) {
  return String(diffText || '').trim().length > 0;
}
