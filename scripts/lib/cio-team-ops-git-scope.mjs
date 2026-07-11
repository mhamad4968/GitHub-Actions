/**
 * Git working tree scope — Lite lane / session audit
 */
import { spawnSync } from 'node:child_process';

export const LITE_FORBIDDEN_PREFIXES = [
  'customize/',
  '.cursor/rules/',
  'AGENTS.md',
];

export const LITE_MAX_LINES = 20;

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
  const p = String(relPath || '').replace(/\\/g, '/');
  if (LITE_FORBIDDEN_PREFIXES.some((pre) => p === pre || p.startsWith(pre))) return true;
  if (/deploy:/i.test(p)) return true;
  return false;
}

export function validateLiteScope(root) {
  const paths = listChangedPaths(root);
  if (paths.length === 0) return { ok: true, paths: [] };
  if (paths.length > 1) {
    return { ok: false, reason: `Lite は 1 path のみ（現在 ${paths.length}）` };
  }
  const only = paths[0];
  if (pathForbiddenForLite(only)) {
    return { ok: false, reason: `Lite 禁止パス: ${only}` };
  }
  const diff = gitDiff(root);
  const added = countAddedLines(diff);
  if (added > LITE_MAX_LINES) {
    return { ok: false, reason: `Lite は追加 ${LITE_MAX_LINES} 行以下（現在 +${added}）` };
  }
  return { ok: true, paths: [only], addedLines: added };
}

export function quickTierBlockedByDiff(diffText) {
  return String(diffText || '').trim().length > 0;
}
