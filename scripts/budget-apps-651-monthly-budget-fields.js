/**
 * 651 予算アプリに会計年度の月別予算（5月〜翌年4月）12 フィールドを追加し、budget_amount の直後にレイアウト配置する。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/budget-apps-651-monthly-budget-fields.js
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
const ANCHOR_FIELD = 'budget_amount';

/** 会計年度インデックス 0=5月 … 11=翌年4月 に対応するフィールド（暦月をコードに含む） */
const MONTH_SPECS = [
  { code: 'budget_m05', label: '予算（5月）' },
  { code: 'budget_m06', label: '予算（6月）' },
  { code: 'budget_m07', label: '予算（7月）' },
  { code: 'budget_m08', label: '予算（8月）' },
  { code: 'budget_m09', label: '予算（9月）' },
  { code: 'budget_m10', label: '予算（10月）' },
  { code: 'budget_m11', label: '予算（11月）' },
  { code: 'budget_m12', label: '予算（12月）' },
  { code: 'budget_m01', label: '予算（1月・翌年度）' },
  { code: 'budget_m02', label: '予算（2月・翌年度）' },
  { code: 'budget_m03', label: '予算（3月・翌年度）' },
  { code: 'budget_m04', label: '予算（4月・翌年度）' },
];

function numberField(code, label) {
  return {
    type: 'NUMBER',
    code,
    label,
    required: false,
    noLabel: false,
    digit: true,
    displayScale: '0',
    unit: '円',
    unitPosition: 'AFTER',
  };
}

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

function insertRowsAfterField(layout, fieldCode, newRows) {
  const rows = JSON.parse(JSON.stringify(layout));
  const idx = rows.findIndex((r) => r.fields?.some((f) => f.code === fieldCode));
  if (idx === -1) throw new Error(`layout: row with "${fieldCode}" not found`);
  rows.splice(idx + 1, 0, ...newRows);
  return rows;
}

function fieldRef(code) {
  return { type: 'NUMBER', code, size: { width: '115' } };
}

async function main() {
  let j = await getPreviewFields();
  const toAdd = {};
  for (const s of MONTH_SPECS) {
    if (!j.properties[s.code]) {
      toAdd[s.code] = numberField(s.code, s.label);
    }
  }
  if (Object.keys(toAdd).length > 0) {
    await postPreviewFields(toAdd);
    console.log('651: posted monthly budget fields', Object.keys(toAdd).join(', '));
    j = await getPreviewFields();
  } else {
    console.log('651: monthly budget fields already exist');
  }

  const lay = await getPreviewLayout();
  if (layoutHasField(lay.layout, 'budget_m05')) {
    console.log('651: layout already has monthly row(s)');
    await deploy(lay.revision);
    await waitDeploy();
    console.log('651: OK (deploy only)');
    return;
  }

  const newRows = [
    {
      type: 'ROW',
      fields: MONTH_SPECS.slice(0, 4).map((s) => fieldRef(s.code)),
    },
    {
      type: 'ROW',
      fields: MONTH_SPECS.slice(4, 8).map((s) => fieldRef(s.code)),
    },
    {
      type: 'ROW',
      fields: MONTH_SPECS.slice(8, 12).map((s) => fieldRef(s.code)),
    },
  ];

  const newLayout = insertRowsAfterField(lay.layout, ANCHOR_FIELD, newRows);
  rev = await putPreviewLayout(lay.revision, newLayout);
  await deploy(rev);
  await waitDeploy();
  console.log('651: monthly budget layout OK. npm run deploy:651 で JS を反映してください。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
