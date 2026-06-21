#!/usr/bin/env node
/**
 * App 736 — 版管理 v2a 既存データ移行（version_seq / status / row_key）
 *   npm run jikkou-yosan:v2-backfill -- --dry-run
 *   npm run jikkou-yosan:v2-backfill -- --apply
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

const appId = Number(process.argv.find((a) => /^\d+$/.test(a)) || process.env.JIKKOU_YOSAN_BUDGET_APP_ID || 736);
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

function requireEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error('Missing ' + k);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '').replace(/\/k$/i, '');
const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${requireEnv('KINTONE_USERNAME')}:${requireEnv('KINTONE_PASSWORD')}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};

const SUBTABLES = [
  { code: 'spec_lines', rowKey: 'spec_row_key' },
  { code: 'cost_lines', rowKey: 'cost_row_key' },
  { code: 'mat_lines', rowKey: 'mat_row_key' },
  { code: 'subcontract_lines', rowKey: 'sub_row_key' },
];

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 600)}`);
  return json;
}

async function fetchAllRecords() {
  const all = [];
  let offset = 0;
  const fields = ['$id', '$revision', 'version_seq', 'status', 'is_locked', 'source_record_id', ...SUBTABLES.map((t) => t.code)];
  while (true) {
    const q = `order by $id asc limit 100 offset ${offset}`;
    const j = await fetchJson(`${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields.join(','))}`, {
      headers: { ...headers, 'Content-Type': undefined },
    });
    all.push(...(j.records || []));
    if ((j.records || []).length < 100) break;
    offset += 100;
  }
  return all;
}

function gv(rec, code) {
  return rec[code] && rec[code].value != null ? rec[code].value : '';
}

function normalizeStatus(raw) {
  const s = String(raw || '下書き');
  return s === '初版確定' ? '版確定' : s;
}

function backfillSubtableRows(tbl, rowKeyCode) {
  const rows = (tbl && tbl.value) || [];
  let changed = false;
  const value = rows.map((row) => {
    const v = { ...(row.value || {}) };
    if (!String(gv(v, rowKeyCode) || '').trim()) {
      v[rowKeyCode] = { value: randomUUID() };
      changed = true;
    }
    return { value: v };
  });
  return changed ? { value } : null;
}

function buildUpdate(rec) {
  const id = gv(rec, '$id');
  const revision = gv(rec, '$revision');
  const patch = {};
  let needs = false;

  if (!String(gv(rec, 'version_seq') || '').trim()) {
    patch.version_seq = { value: '1' };
    needs = true;
  }
  const st = normalizeStatus(gv(rec, 'status'));
  if (st !== String(gv(rec, 'status'))) {
    patch.status = { value: st };
    needs = true;
  }
  const locked = gv(rec, 'is_locked');
  if (locked == null || (Array.isArray(locked) && locked.length === 0 && false)) {
    /* keep as-is */
  }

  SUBTABLES.forEach(({ code, rowKey }) => {
    const next = backfillSubtableRows(rec[code], rowKey);
    if (next) {
      patch[code] = next;
      needs = true;
    }
  });

  if (!needs) return null;
  return { id, revision, record: patch };
}

async function putBatch(updates) {
  const BATCH = 100;
  for (let i = 0; i < updates.length; i += BATCH) {
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: appId, records: updates.slice(i, i + BATCH) }),
    });
    console.log(`PUT ${Math.min(i + BATCH, updates.length)}/${updates.length}`);
  }
}

async function main() {
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply');
    process.exit(1);
  }
  const records = await fetchAllRecords();
  const updates = records.map(buildUpdate).filter(Boolean);
  console.log(`records=${records.length} updates=${updates.length} mode=${dryRun ? 'dry-run' : 'apply'}`);
  if (dryRun) {
    updates.slice(0, 5).forEach((u) => console.log('sample', u.id, Object.keys(u.record).join(',')));
    return;
  }
  if (!updates.length) {
    console.log('nothing to backfill');
    return;
  }
  await putBatch(updates);
  console.log('backfill complete');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
