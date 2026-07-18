/**
 * bridge.lastFailures[] — 柱 C §5.1（最大 3 件）
 * @typedef {{ id: string, at: string, verify: string, note: string }} LastFailure
 */
import fs from 'node:fs';
import path from 'node:path';

const MAX_FAILURES = 3;

const SESSION_SOURCES = [
  'logs/report-checksheet-violations.log',
  'logs/report-pipeline-audit.log',
  'logs/cio-composer-escalation.log',
  'chat-sessions/handoff-log.md',
  'chat-sessions/checkpoint-latest.md',
  'docs/issues/bug-latest.md',
];

function readTail(root, rel, max = 6000) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8').slice(-max);
}

/** @param {unknown} item */
export function lastFailureItemOk(item) {
  if (!item || typeof item !== 'object') return false;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.at === 'string' &&
    typeof item.verify === 'string' &&
    typeof item.note === 'string'
  );
}

/** @param {unknown} arr */
export function lastFailuresArrayOk(arr) {
  if (arr === undefined) return true;
  if (!Array.isArray(arr)) return false;
  if (arr.length > MAX_FAILURES) return false;
  return arr.every(lastFailureItemOk);
}

function normalizeVerify(cmd) {
  if (!cmd) return 'npm run verify:unknown';
  const trimmed = cmd.trim();
  if (trimmed.startsWith('npm run ')) return trimmed.slice(0, 120);
  if (trimmed.startsWith('verify:')) return `npm run ${trimmed.slice(0, 100)}`;
  return `npm run ${trimmed.slice(0, 100)}`;
}

function slugId(prefix, raw) {
  const s = String(raw || 'unknown')
    .replace(/[^\w\u3040-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `${prefix}-${s || 'item'}`.slice(0, 56);
}

/** @param {string} text @param {string} exportedAt @returns {LastFailure[]} */
function extractVerifyFailures(text, exportedAt) {
  /** @type {LastFailure[]} */
  const items = [];
  const patterns = [
    /\[verify:[^\]]+\]\s*NG[^\n]*/gi,
    /npm run verify:[a-z0-9:_-]+[^\n]*exit\s*[12][^\n]*/gi,
    /\[.*?\]\s*NG[^\n]*verify:[^\n]*/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const line = m[0].trim().slice(0, 200);
      const npm = line.match(/npm run [a-z0-9:_-]+(?:\s+--[^\n]*)?/i);
      const verifyTag = line.match(/verify:[a-z0-9:_-]+/i);
      const verify = normalizeVerify(npm?.[0] || verifyTag?.[0]);
      const tag = verifyTag?.[0] || verify.replace(/^npm run /, '');
      items.push({
        id: slugId('verify', tag),
        at: exportedAt,
        verify,
        note: line.slice(0, 120),
      });
    }
  }
  return items;
}

/** @param {string} text @param {string} exportedAt @returns {LastFailure[]} */
function extractDebugTipCandidates(text, exportedAt) {
  /** @type {LastFailure[]} */
  const items = [];
  for (const m of text.matchAll(/\[verify:[^\]]+\][^\n]*/gi)) {
    const line = m[0].trim();
    if (!/NG|exit\s*1|Error/i.test(line)) continue;
    items.push({
      id: slugId('tip', line.slice(0, 30)),
      at: exportedAt,
      verify: normalizeVerify(line.match(/npm run [^\s]+/)?.[0] || line.match(/verify:[^\s]+/)?.[0]),
      note: line.slice(0, 120),
    });
  }
  return items;
}

/** @param {LastFailure[]} items @returns {LastFailure[]} */
function dedupeAndCap(items) {
  const seen = new Set();
  /** @type {LastFailure[]} */
  const out = [];
  for (const item of items) {
    const key = item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= MAX_FAILURES) break;
  }
  return out;
}

/**
 * @param {string} root
 * @param {{ exportedAt?: string }} [opts]
 * @returns {LastFailure[]}
 */
export function collectLastFailures(root, { exportedAt = new Date().toISOString() } = {}) {
  const sessionText = SESSION_SOURCES.map((rel) => readTail(root, rel)).join('\n---\n');
  const tipsText = readTail(root, 'docs/knowledge/debug-tips.md', 4000);

  const merged = [
    ...extractVerifyFailures(sessionText, exportedAt),
    ...extractDebugTipCandidates(`${sessionText}\n${tipsText}`, exportedAt),
  ];

  return dedupeAndCap(merged);
}

export { MAX_FAILURES };
