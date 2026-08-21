#!/usr/bin/env node
/**
 * 名簿漏れ3名: 菅原未希斗=正社員 / 伊藤博己・髙田将平=準社員
 * emp_id 不触。595 区分更新 → 776 本務行 upsert
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-fix-missed-three.mjs
 *   ... --dry-run
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DRY = process.argv.includes('--dry-run');
const TARGETS = [
  { key: 'sugawara', match: (n) => /菅原/.test(n) && /未希斗/.test(n), cat: '正社員' },
  { key: 'ito', match: (n) => /伊藤/.test(n) && /博己/.test(n), cat: '準社員' },
  { key: 'takada', match: (n) => /[髙高]田/.test(n) && /将平/.test(n), cat: '準社員' },
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

function pick(r) {
  return {
    id: r.$id.value,
    emp_id: r.emp_id?.value,
    name: r.user_name?.value,
    mail: r.mail?.value ?? '',
    dept: r.dept_name?.value ?? '',
    group: r.group_name?.value ?? '',
    no: r.employee_no?.value ?? '',
    cat: r.employment_category?.value ?? '',
    title: r.job_title?.value ?? '',
    status: r.employment_status?.value ?? '',
  };
}

const rec595 = await fetchAll(c595, '595', [
  '$id',
  'emp_id',
  'user_name',
  'mail',
  'dept_name',
  'group_name',
  'employee_no',
  'employment_category',
  'job_title',
  'employment_status',
]);

const found = [];
for (const t of TARGETS) {
  const hits = rec595.filter((r) => t.match(String(r.user_name?.value || '')));
  found.push({ key: t.key, wantCat: t.cat, hits: hits.map(pick) });
}

console.log(JSON.stringify({ dryRun: DRY, found }, null, 2));

const ambiguous = found.filter((f) => f.hits.length !== 1);
if (ambiguous.length) {
  console.error('[fix-missed] ambiguous or missing — abort');
  process.exit(2);
}

const rec776 = await fetchAll(cAll, '776', [
  '$id',
  'source_595_id',
  'user_name',
  'employment_category',
  'employee_no',
  'row_role',
  'is_primary',
]);

const by595 = new Map();
for (const r of rec776) {
  const sid = String(r.source_595_id?.value ?? '');
  if (!sid) continue;
  if (!by595.has(sid)) by595.set(sid, []);
  by595.get(sid).push(r);
}

for (const f of found) {
  const hit = f.hits[0];
  const want = f.wantCat;
  if (hit.cat !== want) {
    console.log(`[595] ${hit.name} id=${hit.id} ${hit.cat || '(空)'} → ${want}`);
    if (!DRY) {
      await c595.record.updateRecord({
        app: '595',
        id: hit.id,
        record: { employment_category: { value: want } },
      });
    }
  } else {
    console.log(`[595] ${hit.name} already ${want}`);
  }

  // refresh after update
  const catNow = want;
  const rows = by595.get(String(hit.id)) || [];
  const primary = rows.find((r) => (r.row_role?.value || r.is_primary?.value) === '本務') || rows[0];

  if (primary) {
    const cur = primary.employment_category?.value ?? '';
    if (cur !== catNow) {
      console.log(`[776] update id=${primary.$id.value} ${hit.name} ${cur || '(空)'} → ${catNow}`);
      if (!DRY) {
        await cAll.record.updateRecord({
          app: '776',
          id: primary.$id.value,
          record: { employment_category: { value: catNow } },
        });
      }
    } else {
      console.log(`[776] ${hit.name} already present id=${primary.$id.value} cat=${cur}`);
    }
  } else {
    console.log(`[776] add primary for ${hit.name} sid=${hit.id}`);
    if (!DRY) {
      await cAll.record.addRecord({
        app: '776',
        record: {
          source_595_id: { value: String(hit.id) },
          emp_id_ref: { value: hit.emp_id || '' },
          employee_no: { value: hit.no || '' },
          user_name: { value: hit.name },
          mail: { value: hit.mail },
          dept_name: { value: hit.dept },
          group_name: { value: hit.group },
          job_title: { value: hit.title },
          employment_category: { value: catNow },
          row_role: { value: '本務' },
          is_primary: { value: '本務' },
          match_status: { value: '人手確定' },
        },
      });
    }
  }
}

console.log('[fix-missed] DONE');
