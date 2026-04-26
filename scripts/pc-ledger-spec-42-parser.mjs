/**
 * Parse §4.2 field tables from 正本 docs/plans/2026-04-21-new-pc-ledger-spec.md
 * (4.2.1 説明列 / 4.2.2 マトリクス / 4.2.3・4.2.4 内容列)
 */
import crypto from 'node:crypto';
import fs from 'node:fs';

function sliceBetween(md, startNeedle, endNeedle) {
  const i = md.indexOf(startNeedle);
  if (i === -1) throw new Error(`Missing section start: ${startNeedle}`);
  const j = md.indexOf(endNeedle, i + startNeedle.length);
  if (j === -1) throw new Error(`Missing section end after "${startNeedle}": ${endNeedle}`);
  return md.slice(i, j);
}

function isTableSep(line) {
  return /^\|[\s\-:|]+\|\s*$/.test(line.trim()) || /^\|[-:\s|]+\|\s*$/.test(line.trim());
}

/** | `code` | TYPE | rest... | */
function parseBacktickCodeRow(line) {
  const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*(.+?)\s*\|\s*$/);
  if (!m) return null;
  const code = m[1].trim();
  const col2 = m[2].trim();
  const col3 = m[3].trim();
  return { code, col2, col3 };
}

/** | `code` | TYPE | 個人 | 共有 | JR端末 | */
function parseMatrixRow(line) {
  const m = line.match(
    /^\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*$/
  );
  if (!m) return null;
  return {
    code: m[1].trim(),
    type: m[2].trim(),
    personal: m[3].trim(),
    shared: m[4].trim(),
    jr: m[5].trim(),
  };
}

function matrixFingerprint(row) {
  const s = [row.personal, row.shared, row.jr].join('\t');
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
}

/**
 * @param {string} specPath absolute or cwd-relative
 */
export function parsePcLedgerSpec42(specPath) {
  const md = fs.readFileSync(specPath, 'utf8');

  const s421 = sliceBetween(md, '#### 4.2.1 PC 基本情報', '#### 4.2.2 アカウント情報');
  const s422 = sliceBetween(md, '#### 4.2.2 アカウント情報', '#### 4.2.3 SKYSEA');
  const s423 = sliceBetween(md, '#### 4.2.3 SKYSEA', '#### 4.2.4 M365');
  const s424 = sliceBetween(md, '#### 4.2.4 M365', '### 4.3');

  const labels421 = {};
  for (const line of s421.split('\n')) {
    if (!line.includes('`')) continue;
    const row = parseBacktickCodeRow(line);
    if (!row || isTableSep(line)) continue;
    labels421[row.code] = row.col3;
  }

  const matrix422 = {};
  for (const line of s422.split('\n')) {
    if (!line.includes('`')) continue;
    const row = parseMatrixRow(line);
    if (!row || isTableSep(line)) continue;
    matrix422[row.code] = {
      type: row.type,
      personal: row.personal,
      shared: row.shared,
      jr: row.jr,
      fingerprint: matrixFingerprint(row),
    };
  }

  const labels423 = {};
  for (const line of s423.split('\n')) {
    if (!line.includes('`')) continue;
    const row = parseBacktickCodeRow(line);
    if (!row || isTableSep(line)) continue;
    labels423[row.code] = row.col3;
  }

  const labels424 = {};
  for (const line of s424.split('\n')) {
    if (!line.includes('`')) continue;
    const row = parseBacktickCodeRow(line);
    if (!row || isTableSep(line)) continue;
    labels424[row.code] = row.col3;
  }

  return { labels421, matrix422, labels423, labels424 };
}
