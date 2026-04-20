/**
 * 651 に会計年度フィールドを追加: budget_fy_start（会計年度の開始西暦年・5月始まりの年）。
 * 未入力のレコードはダッシュボードで「当会計年度」のみ表示。過去年度表示は値を入れた行のみ。
 *
 *   npm run budget:651-budget-fy-start
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

const FY_PROP = {
  budget_fy_start: {
    type: 'NUMBER',
    code: 'budget_fy_start',
    label: '会計年度（開始年・西暦）',
    required: false,
    noLabel: false,
    digit: true,
    displayScale: '0',
    minValue: '2000',
    maxValue: '2100',
    defaultValue: '',
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
  if (!j.properties.budget_fy_start) {
    await postPreviewFields(FY_PROP);
    console.log('651: posted budget_fy_start');
    j = await getPreviewFields();
  } else {
    console.log('651: budget_fy_start already exists');
  }

  const lay = await getPreviewLayout();
  if (layoutHasField(lay.layout, 'budget_fy_start')) {
    console.log('651: layout already has budget_fy_start');
    await deploy(lay.revision);
    await waitDeploy();
    console.log('651: OK');
    return;
  }

  const newRow = {
    type: 'ROW',
    fields: [{ type: 'NUMBER', code: 'budget_fy_start', size: { width: '200' } }],
  };
  const newLayout = insertRowAfterField(lay.layout, 'budget_amount', newRow);
  const rev = await putPreviewLayout(lay.revision, newLayout);
  await deploy(rev);
  await waitDeploy();
  console.log('651: budget_fy_start row inserted after budget_amount. npm run deploy:651');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
