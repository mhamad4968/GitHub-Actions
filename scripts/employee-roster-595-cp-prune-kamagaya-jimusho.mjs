#!/usr/bin/env node
/**
 * 595 兼務: 鎌ヶ谷事務所（旧名）を削除。使用中は鎌ヶ谷作業所へ付け替え。
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-595-cp-prune-kamagaya-jimusho.mjs [--dry-run]
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const APP = '595';
const DRY = process.argv.includes('--dry-run');
const OLD = '鎌ヶ谷事務所';
const NEW = '鎌ヶ谷作業所';

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
const after = before.filter((d) => d !== OLD);

const updates = [];
let offset = 0;
for (;;) {
  const { records } = await c.record.getRecords({
    app: APP,
    fields: ['$id', 'user_name', 'concurrent_posts'],
    query: `order by $id asc limit 500 offset ${offset}`,
  });
  for (const r of records) {
    const rows = r.concurrent_posts?.value || [];
    let changed = false;
    const next = rows.map((row) => {
      const v = { ...(row.value || {}) };
      const dept = String(v.cp_dept_name?.value || '').trim();
      if (dept === OLD) {
        changed = true;
        v.cp_dept_name = { value: NEW };
      }
      return { id: row.id, value: v };
    });
    if (changed) {
      updates.push({
        id: r.$id.value,
        name: r.user_name?.value,
        record: { concurrent_posts: { value: next } },
      });
    }
  }
  if (records.length < 500) break;
  offset += 500;
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      beforeCount: before.length,
      afterCount: after.length,
      hadOldOption: before.includes(OLD),
      hasNewOption: after.includes(NEW),
      recordsToRetarget: updates.length,
      sample: updates.slice(0, 10).map((u) => ({ id: u.id, name: u.name })),
    },
    null,
    2,
  ),
);

if (DRY) {
  console.log('[595-cp-kamagaya] dry-run only');
  process.exit(0);
}

if (!after.includes(NEW)) {
  console.error(`[595-cp-kamagaya] NG: ${NEW} が選択肢に無い`);
  process.exit(1);
}

// 付け替えは options から OLD を消す前に実施（DROP_DOWN 制約）
for (let i = 0; i < updates.length; i += 100) {
  const chunk = updates.slice(i, i + 100).map((u) => ({
    id: u.id,
    record: u.record,
  }));
  await c.record.updateRecords({ app: APP, records: chunk });
  console.log(`[595] retarget ${Math.min(i + 100, updates.length)}/${updates.length}`);
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
console.log('[595-cp-kamagaya] preview options updated');

await c.app.deployApp({ apps: [{ app: Number(APP) }] });
const st = await waitDeploy(c);
if (st !== 'SUCCESS') {
  console.error('[595-cp-kamagaya] deploy FAIL');
  process.exit(1);
}

const live2 = await c.app.getFormFields({ app: APP });
const list2 = optionListSorted(live2.properties.concurrent_posts?.fields?.cp_dept_name);
console.log(
  JSON.stringify(
    {
      liveCount: list2.length,
      stillHasOld: list2.includes(OLD),
      hasNew: list2.includes(NEW),
      tail: list2.slice(-6),
    },
    null,
    2,
  ),
);
console.log('[595-cp-kamagaya] DONE');
