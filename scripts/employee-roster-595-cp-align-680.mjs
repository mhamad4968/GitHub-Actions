#!/usr/bin/env node
/**
 * 595 兼務 ST 改善（2026-08-22 浜田依頼）
 * - cp_group_name ラベル →「所属グループ」
 * - cp_dept_name 選択肢を App680 sort_no 順へ（余剰所属は末尾）
 * - cp_title に副支店長を含め、役職の意味順へ並べ替え
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-595-cp-align-680.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-595-cp-align-680.mjs --dry-run
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const APP = '595';
const APP680 = '680';
const DRY = process.argv.includes('--dry-run');

const TITLE_ORDER = [
  '社長',
  '常務',
  '監査役',
  '顧問',
  '本部長',
  '支店長',
  '副支店長',
  '事業統括部長',
  '部長',
  '部員',
  '所長',
  '所員',
  '工事本部長',
];

const GROUP_FALLBACK = [
  'honsya',
  'tohoku',
  'kan-etsu',
  'tokyo',
  'tokai',
  'reform',
  'tekko',
  'wangan',
  'bnp',
];

function optsFromList(list) {
  const o = {};
  list.forEach((label, i) => {
    o[label] = { label, index: String(i) };
  });
  return o;
}

function optionValues(field) {
  const o = field?.options || {};
  return Object.keys(o);
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

const { records: m680 } = await c.record.getRecords({
  app: APP680,
  fields: ['dept_name', 'group_name', 'sort_no'],
  query: 'order by sort_no asc, $id asc limit 500',
});

const dept680 = [];
const seen = new Set();
for (const r of m680) {
  const d = String(r.dept_name?.value || '').trim();
  if (!d || seen.has(d)) continue;
  seen.add(d);
  dept680.push(d);
}

const live = await c.app.getFormFields({ app: APP });
const lf = live.properties.concurrent_posts?.fields || {};
const curDepts = optionValues(lf.cp_dept_name);
const curTitles = optionValues(lf.cp_title);
const curGroups = optionValues(lf.cp_group_name);

const extras = curDepts
  .filter((d) => !seen.has(d))
  .filter(
    (d) =>
      ![
        '鎌ヶ谷事務所',
        '札幌支店工事支援部',
        '札幌支店工事部',
        '首都圏支店工事支援部',
        '鉄構支店管理部',
        '東北支店管理部',
      ].includes(d),
  )
  .sort((a, b) => a.localeCompare(b, 'ja'));
const deptList = [...dept680, ...extras];

const titleSet = new Set([...TITLE_ORDER, ...curTitles]);
const titleList = [
  ...TITLE_ORDER.filter((t) => titleSet.has(t)),
  ...[...titleSet]
    .filter((t) => !TITLE_ORDER.includes(t))
    .sort((a, b) => a.localeCompare(b, 'ja')),
];

const groupSet = new Set([...GROUP_FALLBACK, ...curGroups]);
const groupList = [
  ...GROUP_FALLBACK.filter((g) => groupSet.has(g)),
  ...[...groupSet].filter((g) => !GROUP_FALLBACK.includes(g)),
];

const plan = {
  dryRun: DRY,
  labelGroup: { from: lf.cp_group_name?.label, to: '所属グループ' },
  deptCount: deptList.length,
  dept680: dept680.length,
  deptExtras: extras,
  titleList,
  titleHasFuku: titleList.includes('副支店長'),
  groupList,
  deptFirst10: deptList.slice(0, 10),
};
console.log(JSON.stringify(plan, null, 2));

if (DRY) {
  console.log('[595-cp-align] dry-run only');
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
          options: optsFromList(deptList),
        },
        cp_group_name: {
          type: 'DROP_DOWN',
          code: 'cp_group_name',
          label: '所属グループ',
          options: optsFromList(groupList),
        },
        cp_title: {
          type: 'DROP_DOWN',
          code: 'cp_title',
          label: lf.cp_title?.label || '兼務役職',
          options: optsFromList(titleList),
        },
      },
    },
  },
});
console.log('[595-cp-align] preview fields updated');

await c.app.deployApp({ apps: [{ app: Number(APP) }] });
const st = await waitDeploy(c);
if (st !== 'SUCCESS') {
  console.error('[595-cp-align] deploy FAIL');
  process.exit(1);
}

const after = await c.app.getFormFields({ app: APP });
const af = after.properties.concurrent_posts?.fields || {};
console.log(
  JSON.stringify(
    {
      labels: {
        dept: af.cp_dept_name?.label,
        group: af.cp_group_name?.label,
        title: af.cp_title?.label,
      },
      deptFirst10: optionValues(af.cp_dept_name).slice(0, 10),
      titleHasFuku: optionValues(af.cp_title).includes('副支店長'),
    },
    null,
    2,
  ),
);
console.log('[595-cp-align] DONE');
