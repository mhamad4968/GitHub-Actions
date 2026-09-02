/**
 * Z-3 が docs/reports/*.md を archive/YYYY-MM/ へ動かしたあとも
 * CI 針（test-evening-improvements-*）が 1 本の実体パスを解決する。
 * シンボリックリンクは使わない（Windows / Git 差分を増やさない）。
 */
import fs from 'node:fs';
import path from 'node:path';

function toPosix(rel) {
  return String(rel).replaceAll('\\', '/');
}

function absFromRel(root, relPosix) {
  return path.join(root, ...relPosix.split('/'));
}

/**
 * @param {string} root repo root
 * @param {string} rel e.g. docs/reports/2026-08-11-evening-reflection.md
 * @returns {string|null} existing posix-relative path
 */
export function resolveReportRel(root, rel) {
  const n = toPosix(rel);
  if (fs.existsSync(absFromRel(root, n))) return n;
  const base = path.posix.basename(n);
  const m = base.match(/^(\d{4}-\d{2})-\d{2}-/);
  if (!m) return null;
  const archived = `docs/reports/archive/${m[1]}/${base}`;
  if (fs.existsSync(absFromRel(root, archived))) return archived;
  return null;
}

/**
 * Drop-in for exists/read: live docs/reports/*.md → archive if moved.
 * Non-report paths are returned unchanged.
 * @returns {string}
 */
export function coalesceReportRel(root, rel) {
  const n = toPosix(rel);
  if (!/^docs\/reports\/[^/]+\.md$/.test(n)) return n;
  return resolveReportRel(root, n) ?? n;
}
