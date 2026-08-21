#!/usr/bin/env node
/**
 * 漏れ3名の employee_no 投入（emp_id 不触）
 * 菅原未希斗=4412 / 伊藤博己=4432 / 髙田将平=4433
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DRY = process.argv.includes('--dry-run');
const TARGETS = [
  { match: (n) => /菅原/.test(n) && /未希斗/.test(n), no: '4412' },
  { match: (n) => /伊藤/.test(n) && /博己/.test(n), no: '4432' },
  { match: (n) => /[髙高]田/.test(n) && /将平/.test(n), no: '4433' },
];

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

async function fetchAll(client, app, fields) {
  const all = [];
  let offset = 0;
  for (;;) {
    const { records } = await client.record.getRecords({
      app,
      fields,
      query: `order by $id asc limit 500 offset ${offset}`,
    });
    all.push(...records);
    if (records.length < 500) break;
    offset += 500;
  }
  return all;
}

const rec595 = await fetchAll(c595, '595', ['$id', 'user_name', 'employee_no', 'emp_id']);
const rec776 = await fetchAll(cAll, '776', [
  '$id',
  'source_595_id',
  'user_name',
  'employee_no',
  'row_role',
]);

for (const t of TARGETS) {
  const hits = rec595.filter((r) => t.match(String(r.user_name?.value || '')));
  if (hits.length !== 1) {
    console.error('[employee_no] ambiguous/missing', t.no, hits.map((h) => h.user_name?.value));
    process.exitCode = 2;
    continue;
  }
  const h = hits[0];
  const cur = String(h.employee_no?.value || '').trim();
  console.log(
    `[595] ${h.user_name.value} id=${h.$id.value} emp_id=${h.emp_id.value} ${cur || '(空)'} → ${t.no}`,
  );
  if (!DRY && cur !== t.no) {
    await c595.record.updateRecord({
      app: '595',
      id: h.$id.value,
      record: { employee_no: { value: t.no } },
    });
  }

  const rows776 = rec776.filter(
    (r) => String(r.source_595_id?.value || '') === String(h.$id.value),
  );
  for (const r of rows776) {
    const c = String(r.employee_no?.value || '').trim();
    console.log(
      `[776] ${r.user_name.value} id=${r.$id.value} role=${r.row_role?.value} ${c || '(空)'} → ${t.no}`,
    );
    if (!DRY && c !== t.no) {
      await cAll.record.updateRecord({
        app: '776',
        id: r.$id.value,
        record: { employee_no: { value: t.no } },
      });
    }
  }
}

console.log('[employee_no] DONE dryRun=' + DRY);
