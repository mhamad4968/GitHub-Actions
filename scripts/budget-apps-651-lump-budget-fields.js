/**
 * 651 に年払い用フィールドを追加: 年払い金額（円）・支払い月（会計年度 5月〜翌4月）。
 * JS が該当月の budget_m** に反映し、他月を空にする（月別入力と併用時は年払い優先で上書き）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/budget-apps-651-lump-budget-fields.js
 */
import 'dotenv/config';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' };
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  const ba = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  authHeaders.Authorization = ba;
  jsonHeaders.Authorization = ba;
}

const APP = 651;

const LUMP_PROPS = {
  budget_lump_amount: {
    type: 'NUMBER',
    code: 'budget_lump_amount',
    label: '年払い金額',
    required: false,
    noLabel: false,
    digit: true,
    displayScale: '0',
    unit: '円',
    unitPosition: 'AFTER',
  },
  budget_lump_month: {
    type: 'DROP_DOWN',
    code: 'budget_lump_month',
    label: '年払いの支払い月',
    required: false,
    noLabel: false,
    /** プレビュー API では options の key と label を同一にしないと CB_VA01 になる */
    defaultValue: '',
    options: {
      '5月': { label: '5月', index: '0' },
      '6月': { label: '6月', index: '1' },
      '7月': { label: '7月', index: '2' },
      '8月': { label: '8月', index: '3' },
      '9月': { label: '9月', index: '4' },
      '10月': { label: '10月', index: '5' },
      '11月': { label: '11月', index: '6' },
      '12月': { label: '12月', index: '7' },
      '1月（翌年度）': { label: '1月（翌年度）', index: '8' },
      '2月（翌年度）': { label: '2月（翌年度）', index: '9' },
      '3月（翌年度）': { label: '3月（翌年度）', index: '10' },
      '4月（翌年度）': { label: '4月（翌年度）', index: '11' },
    },
  },
};

async function getPreviewFields() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET fields: ${j.code} ${j.message}`);
  return j;
}

async function postPreviewFields(properties) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, properties }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`POST fields: ${j.code} ${j.message}`);
  return j.revision;
}

async function getPreviewLayout() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json?app=${APP}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET layout: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewLayout(revision, layout) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, revision, layout }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT layout: ${j.code} ${j.message}`);
  return j.revision;
}

async function deploy(revision) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ apps: [{ app: APP, revision }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`deploy: ${j.code} ${j.message}`);
}

async function waitDeploy() {
  for (let i = 0; i < 90; i++) {
    const u = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    u.searchParams.set('apps[0]', String(APP));
    const res = await fetch(u, { headers: authHeaders });
    const j = await res.json();
    const st = res.ok && j.apps?.[0] ? j.apps[0].status : null;
    if (st === 'SUCCESS') return;
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy status ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('deploy timeout');
}

function layoutHasField(layout, code) {
  return layout.some((r) => r.fields?.some((f) => f.code === code));
}

function insertRowAfterField(layout, fieldCode, newRow) {
  const rows = JSON.parse(JSON.stringify(layout));
  const idx = rows.findIndex((r) => r.fields?.some((f) => f.code === fieldCode));
  if (idx === -1) throw new Error(`layout: row with "${fieldCode}" not found`);
  rows.splice(idx + 1, 0, newRow);
  return rows;
}

async function main() {
  let j = await getPreviewFields();
  const toAdd = {};
  if (!j.properties.budget_lump_amount) toAdd.budget_lump_amount = LUMP_PROPS.budget_lump_amount;
  if (!j.properties.budget_lump_month) toAdd.budget_lump_month = LUMP_PROPS.budget_lump_month;
  if (Object.keys(toAdd).length > 0) {
    await postPreviewFields(toAdd);
    console.log('651: posted', Object.keys(toAdd).join(', '));
    j = await getPreviewFields();
  } else {
    console.log('651: lump fields already exist');
  }

  const lay = await getPreviewLayout();
  if (layoutHasField(lay.layout, 'budget_lump_amount')) {
    console.log('651: layout already has lump row');
    await deploy(lay.revision);
    await waitDeploy();
    console.log('651: OK');
    return;
  }

  const newRow = {
    type: 'ROW',
    fields: [
      { type: 'NUMBER', code: 'budget_lump_amount', size: { width: '180' } },
      { type: 'DROP_DOWN', code: 'budget_lump_month', size: { width: '200' } },
    ],
  };
  const newLayout = insertRowAfterField(lay.layout, 'budget_amount', newRow);
  const rev = await putPreviewLayout(lay.revision, newLayout);
  await deploy(rev);
  await waitDeploy();
  console.log('651: lump row inserted after budget_amount. npm run deploy:651');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
