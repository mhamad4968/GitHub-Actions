#!/usr/bin/env node
/**
 * 595 兼務所属名 DROP_DOWN から余剰5部署を削除
 * （鎌ヶ谷事務所の下: 札幌支店工事支援部 / 札幌支店工事部 / 首都圏支店工事支援部 / 鉄構支店管理部 / 東北支店管理部）
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-595-cp-prune-extra-depts.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-595-cp-prune-extra-depts.mjs --dry-run
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const APP = '595';
const DRY = process.argv.includes('--dry-run');
const REMOVE = [
  '札幌支店工事支援部',
  '札幌支店工事部',
  '首都圏支店工事支援部',
  '鉄構支店管理部',
  '東北支店管理部',
];

function optsFromList(list) {
  const o = {};
  list.forEach((label, i) => {
    o[label] = { label, index: String(i) };
  });
  return o;
}

function optionListSorted(field) {
  const o = field?.options || {};
  return Object.entries(o)
    .sort((a, b) => Number(a[1].index) - Number(b[1].index))
    .map(([k]) => k);
}

async function waitDeploy(client) {
  for (;;) {
    const st = await client.app.getDeployStatus({ apps: [Number(APP)] });
    const s = st.apps?.[0]?.status;
    console.log('[deploy]', s);
    if (s === 'SUCCESS' || s === 'FAIL') return s;
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const c = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

const live = await c.app.getFormFields({ app: APP });
const lf = live.properties.concurrent_posts?.fields || {};
const before = optionListSorted(lf.cp_dept_name);
const removeSet = new Set(REMOVE);
const after = before.filter((d) => !removeSet.has(d));

// 使用中レコード確認
const inUse = [];
let offset = 0;
for (;;) {
  const { records } = await c.record.getRecords({
    app: APP,
    fields: ['$id', 'user_name', 'concurrent_posts'],
    query: `order by $id asc limit 500 offset ${offset}`,
  });
  for (const r of records) {
    const rows = r.concurrent_posts?.value || [];
    for (const row of rows) {
      const dept = String(row.value?.cp_dept_name?.value || '').trim();
      if (removeSet.has(dept)) {
        inUse.push({
          id: r.$id.value,
          name: r.user_name?.value,
          dept,
        });
      }
    }
  }
  if (records.length < 500) break;
  offset += 500;
}

const kamagayaIdx = after.indexOf('鎌ヶ谷事務所');
const belowKamagaya = kamagayaIdx >= 0 ? after.slice(kamagayaIdx + 1) : [];

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      remove: REMOVE,
      beforeCount: before.length,
      afterCount: after.length,
      removed: before.filter((d) => removeSet.has(d)),
      kamagayaIndex: kamagayaIdx,
      afterKamagaya: belowKamagaya,
      inUseCount: inUse.length,
      inUseSample: inUse.slice(0, 20),
    },
    null,
    2,
  ),
);

if (inUse.length) {
  console.error('[595-cp-prune] NG: 削除対象がレコードで使用中。先に値を付け替えてください。');
  process.exit(2);
}

if (DRY) {
  console.log('[595-cp-prune] dry-run only');
  process.exit(0);
}

await c.app.updateFormFields({
  app: APP,
  properties: {
    concurrent_posts: {
      type: 'SUBTABLE',
      code: 'concurrent_posts',
      fields: {
        cp_dept_name: {
          type: 'DROP_DOWN',
          code: 'cp_dept_name',
          label: lf.cp_dept_name?.label || '兼務所属名',
          options: optsFromList(after),
        },
      },
    },
  },
});
console.log('[595-cp-prune] preview updated');

await c.app.deployApp({ apps: [{ app: Number(APP) }] });
const st = await waitDeploy(c);
if (st !== 'SUCCESS') {
  console.error('[595-cp-prune] deploy FAIL');
  process.exit(1);
}

const live2 = await c.app.getFormFields({ app: APP });
const list2 = optionListSorted(live2.properties.concurrent_posts?.fields?.cp_dept_name);
console.log(
  JSON.stringify(
    {
      liveCount: list2.length,
      hasRemoved: REMOVE.filter((d) => list2.includes(d)),
      tail: list2.slice(-8),
    },
    null,
    2,
  ),
);
console.log('[595-cp-prune] DONE');
