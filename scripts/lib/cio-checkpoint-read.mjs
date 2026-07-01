/**
 * checkpoint-latest.md 先頭ブロックの機械読取（正本）
 */
import fs from 'node:fs';
import path from 'node:path';

export const CHECKPOINT_REL = 'chat-sessions/checkpoint-latest.md';

const NEXT_TASK_PATTERNS = [
  /\*\*次の1手\*\*\s*[:：]\s*([^\n]+)/i,
  /\*\*次回\s*1\s*手\*\*\s*[:：]\s*([^\n]+)/i,
  /\*\*次回 1 手\*\*\s*[:：]\s*([^\n]+)/i,
  /\*\*次回 1 手\*\*\s*\|\s*([^|\n]+)/i,
  /次の\s*1\s*手[^:\n]*[:：]\s*([^\n]+)/i,
  /次回\s*1\s*手[^:\n]*[:：]\s*([^\n]+)/i,
];

export function readCheckpointHead(root, limit = 3500) {
  const p = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8').slice(0, limit);
}

/** @returns {string|null} */
export function readCheckpointNextTask(root) {
  const head = readCheckpointHead(root);
  if (!head) return null;
  for (const re of NEXT_TASK_PATTERNS) {
    const m = head.match(re);
    if (m) return (m[1] || m[0]).trim().slice(0, 200);
  }
  return null;
}

/** @returns {string|null} YYYY-MM-DD from **最終更新** line */
export function readCheckpointLastUpdatedDate(root) {
  const head = readCheckpointHead(root, 800);
  const m = head.match(/\*\*最終更新\*\*:\s*(\d{4}-\d{2}-\d{2})/i);
  return m ? m[1] : null;
}

/** @returns {string[]} checkpoint 全文行配列 */
export function readCheckpointLines(root) {
  const p = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n');
}

/** 最初の ## YYYY-MM-DD 日付セクション行 index（無ければ -1） */
export function findCheckpointDatedSectionIndex(lines) {
  return lines.findIndex((l, i) => i > 0 && /^## \d{4}-\d{2}-\d{2}/.test(l));
}

/** 凍結ゾーン（最初の ## YYYY-MM-DD 直前まで）の行数 */
export function readCheckpointPreambleLineCount(root) {
  const lines = readCheckpointLines(root);
  const sectionIdx = findCheckpointDatedSectionIndex(lines);
  return sectionIdx < 0 ? lines.length : sectionIdx;
}

/** 凍結ゾーン本文（preamble のみ — mandatory-read-gate の正本検査対象） */
export function readCheckpointPreamble(root) {
  const lines = readCheckpointLines(root);
  const sectionIdx = findCheckpointDatedSectionIndex(lines);
  const end = sectionIdx < 0 ? lines.length : sectionIdx;
  return lines.slice(0, end).join('\n');
}

/** @returns {string|null} first ## YYYY-MM-DD section date */
export function readCheckpointLatestSectionDate(root) {
  const head = readCheckpointHead(root, 4000);
  const m = head.match(/^## (\d{4}-\d{2}-\d{2})/m);
  return m ? m[1] : null;
}

/** @returns {string|null} **Git**: 行の値部分（バッククォート含む行末まで） */
export function readCheckpointGitLine(root) {
  const head = readCheckpointHead(root);
  const m = head.match(/\*\*Git\*\*:\s*([^\n]+)/i);
  return m ? m[1].trim() : null;
}
