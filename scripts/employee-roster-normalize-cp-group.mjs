#!/usr/bin/env node
/** 595 concurrent_posts.cp_group_name をマスタコードへ正規化 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DRY = process.argv.includes('--dry-run');
const SITE = {
  本社: 'honsya',
  東北支店: 'tohoku',
  関越支店: 'kan-etsu',
  東京支店: 'tokyo',
  東海支店: 'tokai',
  札幌支店: 'reform',
  首都圏支店: 'reform',
  鉄構支店: 'tekko',
  湾岸工事所: 'wangan',
  リフォーム事業統括部: 'reform',
  リフォーム統括事業部: 'reform',
};

function resolve(g, d) {
  const x = String(g || '').trim();
  if (SITE[x]) return SITE[x];
  if (/^[a-z][a-z0-9-]*$/i.test(x)) return x;
  const dept = String(d || '');
  if (/東北|秋田|盛岡|仙台/.test(dept)) return 'tohoku';
  if (/関越|新潟|長野|高崎/.test(dept)) return 'kan-etsu';
  if (/東京支店|千葉営業|水戸営業|鎌ヶ谷/.test(dept)) return 'tokyo';
  if (/東海|静岡|名古屋|関西|東京営業/.test(dept)) return 'tokai';
  if (/札幌|首都圏|リフォーム/.test(dept)) return 'reform';
  if (/鉄構/.test(dept)) return 'tekko';
  if (/湾岸/.test(dept)) return 'wangan';
  if (/本社|役員|顧問|総務|経理|経営|人事|安全|施工|メンテ|塗装|品質|出向/.test(dept)) {
    return 'honsya';
  }
  return x;
}

const c = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: { apiToken: process.env.KINTONE_API_TOKEN_595 },
});

const all = [];
let offset = 0;
for (;;) {
  const { records } = await c.record.getRecords({
    app: '595',
    fields: ['$id', 'concurrent_posts'],
    query: `order by $id asc limit 500 offset ${offset}`,
  });
  all.push(...records);
  if (records.length < 500) break;
  offset += 500;
}

const updates = [];
const samples = [];
for (const r of all) {
  const rows = r.concurrent_posts?.value || [];
  if (!rows.length) continue;
  let changed = false;
  const next = rows.map((row) => {
    const v = { ...(row.value || {}) };
    const dept = v.cp_dept_name?.value || '';
    const cur = v.cp_group_name?.value || '';
    const want = resolve(cur, dept);
    if (want && want !== cur) {
      changed = true;
      v.cp_group_name = { value: want };
      if (samples.length < 12) {
        samples.push({ id: r.$id.value, from: cur, to: want, dept });
      }
    }
    return { id: row.id, value: v };
  });
  if (changed) {
    updates.push({
      id: r.$id.value,
      record: { concurrent_posts: { value: next } },
    });
  }
}

console.log(JSON.stringify({ dryRun: DRY, willUpdate: updates.length, samples }, null, 2));
if (!DRY && updates.length) {
  for (let i = 0; i < updates.length; i += 100) {
    await c.record.updateRecords({ app: '595', records: updates.slice(i, i + 100) });
    console.log(`[595] cp_group ${Math.min(i + 100, updates.length)}/${updates.length}`);
  }
}
console.log('[595 cp_group normalize] DONE');
