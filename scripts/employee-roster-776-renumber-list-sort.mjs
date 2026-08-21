#!/usr/bin/env node
/**
 * 776 list_sort を現在の並びのまま整数 1..N に振り直す。
 * フィールド displayScale=0。ビュー sort=list_sort asc。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DRY = process.argv.includes('--dry-run');
const APP = '776';

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

const all = [];
let offset = 0;
for (;;) {
  const { records } = await client.record.getRecords({
    app: APP,
    fields: ['$id', 'list_sort', 'user_name', 'row_role'],
    query: `order by list_sort asc, $id asc limit 500 offset ${offset}`,
  });
  all.push(...records);
  if (records.length < 500) break;
  offset += 500;
}

const updates = [];
const samples = [];
for (let i = 0; i < all.length; i++) {
  const want = String(i + 1);
  const cur = String(all[i].list_sort?.value ?? '');
  if (cur === want) continue;
  updates.push({
    id: all[i].$id.value,
    record: { list_sort: { value: want } },
  });
  if (samples.length < 8) {
    samples.push({
      name: all[i].user_name?.value,
      role: all[i].row_role?.value,
      from: cur,
      to: want,
    });
  }
}

console.log(
  JSON.stringify(
    { dryRun: DRY, total: all.length, willUpdate: updates.length, samples },
    null,
    2,
  ),
);

if (!DRY && updates.length) {
  let n = 0;
  for (const batch of chunk(updates, 100)) {
    await client.record.updateRecords({ app: APP, records: batch });
    n += batch.length;
    console.log(`[776] renumber ${n}/${updates.length}`);
  }
}

// displayScale 0 + view leftmost already; ensure scale
const { KintoneRestAPIClient: K } = require('@kintone/rest-api-client');
void K;
await client.app.updateFormFields({
  app: APP,
  properties: {
    list_sort: { type: 'NUMBER', displayScale: '0', digit: false },
  },
});

const viewsResp = await client.app.getViews({ app: APP });
const views = viewsResp.views || {};
const name = Object.keys(views).find((n) => n === '社員名簿') || Object.keys(views)[0];
if (name) {
  const v = views[name];
  const fields = Array.isArray(v.fields) ? [...v.fields] : [];
  if (fields[0] !== 'list_sort') {
    const rest = fields.filter((f) => f !== 'list_sort');
    fields.splice(0, fields.length, 'list_sort', ...rest);
  }
  const next = { ...views };
  next[name] = { ...v, fields, sort: 'list_sort asc' };
  await client.app.updateViews({ app: APP, views: next });
}

await client.app.deployApp({ apps: [{ app: Number(APP) }] });
for (;;) {
  const st = await client.app.getDeployStatus({ apps: [Number(APP)] });
  const s = st.apps?.[0]?.status;
  console.log('deploy', s);
  if (s === 'SUCCESS' || s === 'FAIL') break;
  await new Promise((r) => setTimeout(r, 1500));
}

console.log('[776] integer list_sort 1..N DONE');
