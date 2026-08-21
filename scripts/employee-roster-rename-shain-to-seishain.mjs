#!/usr/bin/env node
/**
 * employment_category: 「社員」→「正社員」（emp_id 不触）
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-rename-shain-to-seishain.mjs
 *        ... --dry-run
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DRY = process.argv.includes('--dry-run');
const FROM = '社員';
const TO = '正社員';

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const c595 = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: { apiToken: process.env.KINTONE_API_TOKEN_595 },
});
const cAll = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

async function fetchMatching(client, app) {
  const all = [];
  let offset = 0;
  const qBase = `employment_category in ("${FROM}")`;
  for (;;) {
    const { records } = await client.record.getRecords({
      app,
      fields: ['$id', 'employment_category'],
      query: `${qBase} order by $id asc limit 500 offset ${offset}`,
    });
    all.push(...records);
    if (records.length < 500) break;
    offset += 500;
  }
  return all;
}

async function apply(client, app, records) {
  const updates = records.map((r) => ({
    id: r.$id.value,
    record: { employment_category: { value: TO } },
  }));
  let n = 0;
  for (const batch of chunk(updates, 100)) {
    if (!DRY) {
      await client.record.updateRecords({ app, records: batch });
    }
    n += batch.length;
    console.log(`[${app}] ${FROM}→${TO} ${n}/${updates.length}${DRY ? ' (dry)' : ''}`);
  }
}

async function countRemaining(client, app) {
  const { records, totalCount } = await client.record.getRecords({
    app,
    fields: ['$id'],
    query: `employment_category in ("${FROM}") limit 1`,
    totalCount: true,
  });
  void records;
  return Number(totalCount || 0);
}

const r595 = await fetchMatching(c595, '595');
const r776 = await fetchMatching(cAll, '776');
console.log(JSON.stringify({ dryRun: DRY, count595: r595.length, count776: r776.length }, null, 2));

await apply(c595, '595', r595);
await apply(cAll, '776', r776);

if (!DRY) {
  const left595 = await countRemaining(c595, '595');
  const left776 = await countRemaining(cAll, '776');
  console.log(JSON.stringify({ remaining社員_595: left595, remaining社員_776: left776 }, null, 2));
  if (left595 !== 0 || left776 !== 0) {
    process.exitCode = 2;
    console.error('[rename] FAIL: 社員 still present — do not remove option yet');
  } else {
    console.log('[rename] OK: 社員 count is 0 on both apps');
  }
}
