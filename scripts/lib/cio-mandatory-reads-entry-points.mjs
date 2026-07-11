/**
 * data/cio-rule-entry-points.json — E1 mandatory_reads 正本ローダ
 * @see docs/constitution/27-constitution-navigation-charter.md
 */
import fs from 'node:fs';
import path from 'node:path';

const ENTRY_POINTS_REL = 'data/cio-rule-entry-points.json';

/**
 * @param {string} root
 */
export function loadEntryPoints(root) {
  const p = path.join(root, ENTRY_POINTS_REL);
  if (!fs.existsSync(p)) {
    throw new Error(`missing ${ENTRY_POINTS_REL}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * @param {string} root
 * @returns {{ wake_once_per_session: string[], every_session: string[], note: string }}
 */
export function loadMandatoryReads(root) {
  const data = loadEntryPoints(root);
  const e1 = data.entrances?.find((e) => e.id === 'E1-every-turn');
  const mr = e1?.mandatory_reads || {};
  return {
    wake_once_per_session: Array.isArray(mr.wake_once_per_session) ? mr.wake_once_per_session : [],
    every_session: Array.isArray(mr.every_session) ? mr.every_session : [],
    note: String(mr.note || ''),
  };
}

/**
 * @param {{ wake_once_per_session: string[], every_session: string[] }} mr
 * @returns {string[]}
 */
export function flattenMandatoryReads(mr) {
  return [...mr.wake_once_per_session, ...mr.every_session];
}

/**
 * @param {string} root
 * @returns {{ rel: string, exists: boolean }[]}
 */
export function auditMandatoryReadFiles(root) {
  const mr = loadMandatoryReads(root);
  return flattenMandatoryReads(mr).map((rel) => ({
    rel,
    exists: fs.existsSync(path.join(root, rel)),
  }));
}
