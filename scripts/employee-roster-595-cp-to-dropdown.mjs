#!/usr/bin/env node
/**
 * 595 兼務 ST DROP_DOWN 化（preview に既に text 削除済みの場合あり）
 * 1) live から値退避 2) preview に DROP_DOWN 追加 3) deploy 4) 復元
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = '595';

const GROUP_OPTS = [
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
const TITLE_BASE = [
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
const EXTRA_DEPTS = [
  // 2026-08-22 浜田: 鎌ヶ谷事務所下の余剰5部署は選択肢に載せない
];

function optsFromList(list) {
  const o = {};
  list.forEach((label, i) => {
    o[label] = { label, index: String(i) };
  });
  return o;
}

async function waitDeploy(client) {
  for (;;) {
    const st = await client.app.getDeployStatus({ apps: [Number(APP)] });
    const s = st.apps?.[0]?.status;
    console.log('deploy', s);
    if (s === 'SUCCESS' || s === 'FAIL') return s;
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const c = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: { apiToken: process.env.KINTONE_API_TOKEN_595 },
});
const cAdmin = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

let depts = [];
try {
  const seed = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'scripts/data/pc-ledger-dept-master-seed-records.json'),
      'utf8',
    ),
  );
  depts = seed.map((r) => r.dept_name).filter(Boolean);
} catch {
  depts = [];
}

const deptSet = new Set([...depts, ...EXTRA_DEPTS]);
const titleSet = new Set(TITLE_BASE);
const backup = [];
let offset = 0;
for (;;) {
  const { records } = await c.record.getRecords({
    app: APP,
    fields: ['$id', 'dept_name', 'job_title', 'concurrent_posts'],
    query: `order by $id asc limit 500 offset ${offset}`,
  });
  for (const r of records) {
    const d0 = (r.dept_name?.value || '').trim();
    if (d0) deptSet.add(d0);
    const t0 = (r.job_title?.value || '').trim();
    if (t0) titleSet.add(t0);
    const rows = r.concurrent_posts?.value || [];
    if (!rows.length) continue;
    backup.push({
      id: r.$id.value,
      rows: rows.map((row) => {
        const v = row.value || {};
        const dept = (v.cp_dept_name?.value || '').trim();
        const group = (v.cp_group_name?.value || '').trim();
        const title = (v.cp_title?.value || '').trim();
        const note = (v.cp_note?.value || '').trim();
        if (dept) deptSet.add(dept);
        if (title) titleSet.add(title);
        return { dept, group, title, note };
      }),
    });
  }
  if (records.length < 500) break;
  offset += 500;
}

const deptList = [...deptSet].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ja'));
const titleList = [...titleSet].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ja'));

const outDir = path.join(ROOT, 'logs', 'employee-roster');
fs.mkdirSync(outDir, { recursive: true });
const backupPath = path.join(
  outDir,
  `595-cp-backup-before-dropdown-${Date.now()}.json`,
);
fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(
  JSON.stringify(
    {
      backupPath,
      recordsWithCp: backup.length,
      deptOptions: deptList.length,
      titleOptions: titleList.length,
    },
    null,
    2,
  ),
);

const prev = await cAdmin.app.getFormFields({ app: APP, preview: true });
const pf = prev.properties.concurrent_posts?.fields || {};
const needAdd = !pf.cp_dept_name || pf.cp_dept_name.type !== 'DROP_DOWN';

if (needAdd) {
  // if text still in preview, delete first
  const toDel = ['cp_dept_name', 'cp_group_name', 'cp_title'].filter(
    (code) => pf[code] && pf[code].type === 'SINGLE_LINE_TEXT',
  );
  if (toDel.length) {
    await cAdmin.app.deleteFormFields({ app: APP, fields: toDel });
    console.log('deleted preview text fields', toDel);
  }
  await cAdmin.app.addFormFields({
    app: APP,
    properties: {
      concurrent_posts: {
        type: 'SUBTABLE',
        code: 'concurrent_posts',
        label: '兼務',
        fields: {
          cp_dept_name: {
            type: 'DROP_DOWN',
            code: 'cp_dept_name',
            label: '兼務所属名',
            required: false,
            options: optsFromList(deptList),
            defaultValue: '',
          },
          cp_group_name: {
            type: 'DROP_DOWN',
            code: 'cp_group_name',
            label: '兼務拠点（所属グループ）',
            required: false,
            options: optsFromList(GROUP_OPTS),
            defaultValue: '',
          },
          cp_title: {
            type: 'DROP_DOWN',
            code: 'cp_title',
            label: '兼務役職',
            required: false,
            options: optsFromList(titleList),
            defaultValue: '',
          },
        },
      },
    },
  });
  console.log('added DROP_DOWN fields to preview');
} else {
  console.log('preview already has DROP_DOWN fields');
}

await cAdmin.app.deployApp({ apps: [{ app: Number(APP) }] });
const st = await waitDeploy(cAdmin);
if (st !== 'SUCCESS') {
  console.error('deploy failed');
  process.exit(1);
}

const deptAllowed = new Set(deptList);
const groupAllowed = new Set(GROUP_OPTS);
const titleAllowed = new Set(titleList);
function pick(val, allowed) {
  if (!val) return '';
  return allowed.has(val) ? val : '';
}

const updates = backup.map((b) => ({
  id: b.id,
  record: {
    concurrent_posts: {
      value: b.rows.map((row) => ({
        value: {
          cp_dept_name: { value: pick(row.dept, deptAllowed) },
          cp_group_name: { value: pick(row.group, groupAllowed) },
          cp_title: { value: pick(row.title, titleAllowed) },
          cp_note: { value: row.note || '' },
        },
      })),
    },
  },
}));

for (let i = 0; i < updates.length; i += 100) {
  await c.record.updateRecords({
    app: APP,
    records: updates.slice(i, i + 100),
  });
  console.log(`[595] restore ${Math.min(i + 100, updates.length)}/${updates.length}`);
}

const live = await cAdmin.app.getFormFields({ app: APP });
const lf = live.properties.concurrent_posts?.fields || {};
console.log(
  JSON.stringify(
    {
      liveTypes: Object.fromEntries(
        Object.entries(lf).map(([k, v]) => [k, v.type]),
      ),
    },
    null,
    2,
  ),
);
console.log('[595] concurrent DROP_DOWN DONE');
