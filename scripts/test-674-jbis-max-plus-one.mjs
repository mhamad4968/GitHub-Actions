#!/usr/bin/env node
/**
 * 674 個人/共有 次番（max+1・空き無視・9999除外）の静的検証
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kintoneGetJson } from './lib/kintone-read-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'customize/new-pc-ledger-v1/desktop.js'), 'utf8');

assert.match(src, /2026-08-07-674-skysea-personal-exact-pcname/);
assert.match(src, /fetchNextPersonalJbisSerial674/);
assert.match(src, /fetchNextSharedSjbisSerial674/);
assert.match(src, /resolveNextPcSerialFromMax674/);
assert.doesNotMatch(src, /fetchNextFreePersonalJbisSerial674/);
assert.doesNotMatch(src, /fetchNextFreeSharedSjbisSerial674/);
assert.match(src, /dig !== 9999/);
assert.match(src, /init674DefaultStatusSet674\(\)\s*\{\s*return new Set\(\[PC_STATUS_IN_USE_674\]\)/);

function resolveNext(maxFromLedger, floor) {
  const maxBase = Math.max(0, Math.floor(Number(maxFromLedger) || 0));
  const next = maxBase + 1;
  return Math.max(next > 0 ? next : 1, floor);
}

assert.equal(resolveNext(66, 67), 67);
assert.equal(resolveNext(349, 67), 350);
assert.equal(resolveNext(0, 67), 67);

async function scanMax(kind) {
  const re = kind === 'personal' ? /^JBIS(\d+)(?=-|$)/i : /^S-JBIS(\d+)(?=-|$)/i;
  // personal: all account types (collision-aware). shared: 共有 only.
  const typeClause =
    kind === 'personal' ? '' : 'account_type in ("共有") and ';
  let offset = 0;
  let max = 0;
  while (true) {
    const qs = new URLSearchParams({
      app: '674',
      query: `${typeClause}pc_status not in ("廃棄", "取消") and pc_name != "" order by $id asc limit 500 offset ${offset}`,
      'fields[0]': 'pc_name',
    });
    const resp = await kintoneGetJson(`/k/v1/records.json?${qs.toString()}`);
    const rows = resp.records || [];
    for (const row of rows) {
      const pn = String(row.pc_name?.value || '').trim();
      const m = re.exec(pn);
      if (!m) continue;
      const n = Number(m[1]);
      if (n > 0 && n !== 9999) max = Math.max(max, n);
    }
    if (rows.length < 500) break;
    offset += rows.length;
    if (offset > 100000) break;
  }
  return max;
}

const personalMax = await scanMax('personal');
const personalNext = resolveNext(personalMax, 67);
const sharedMax = await scanMax('shared');
const sharedNext = resolveNext(sharedMax, 1);

console.log(
  JSON.stringify(
    {
      personalMax,
      personalNext,
      personalPreview: `JBIS${String(personalNext).padStart(4, '0')}`,
      sharedMax,
      sharedNext,
      sharedPreview: `S-JBIS${String(sharedNext).padStart(4, '0')}`,
    },
    null,
    2,
  ),
);

assert.equal(
  personalNext,
  351,
  'expected JBIS0351 after collision-aware max 350 (共有 JBIS0350 + 個人 349, 9999 excluded)',
);
console.log('[test:674-jbis-max-plus-one] OK');
