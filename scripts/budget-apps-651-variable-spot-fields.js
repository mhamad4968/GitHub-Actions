/**
 * 651 に変動費の「都度入力」用フィールドを追加（金額・支払予定日）。
 * desktop.js が日付から会計月を求め、該当の variable_budget_m** に1か月分だけ書き込む。
 *
 *   npm run budget:651-variable-spot-fields
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
const ANCHOR_ROW_FIELD = 'variable_budget_m05';

const PROPS = {
  variable_budget_spot_amount: {
    type: 'NUMBER',
    code: 'variable_budget_spot_amount',
    label: '変動費予算（金額）',
    required: false,
    noLabel: false,
    digit: true,
    displayScale: '0',
    unit: '円',
    unitPosition: 'AFTER',
  },
  variable_budget_pay_date: {
    type: 'DATE',
    code: 'variable_budget_pay_date',
    label: '変動費の支払予定日',
    required: false,
    noLabel: false,
    unique: false,
    defaultValue: '',
    defaultNowValue: false,
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

function fieldRefNumber(code) {
  return { type: 'NUMBER', code, size: { width: '140' } };
}
function fieldRefDate(code) {
  return { type: 'DATE', code, size: { width: '160' } };
}

async function main() {
  let j = await getPreviewFields();
  const toAdd = {};
  if (!j.properties.variable_budget_spot_amount) {
    toAdd.variable_budget_spot_amount = PROPS.variable_budget_spot_amount;
  }
  if (!j.properties.variable_budget_pay_date) {
    toAdd.variable_budget_pay_date = PROPS.variable_budget_pay_date;
  }
  if (Object.keys(toAdd).length > 0) {
    await postPreviewFields(toAdd);
    console.log('651: posted', Object.keys(toAdd).join(', '));
    j = await getPreviewFields();
  } else {
    console.log('651: spot fields already exist');
  }

  const lay = await getPreviewLayout();
  let rev = lay.revision;
  let layout = lay.layout;

  if (layoutHasField(layout, 'variable_budget_spot_amount')) {
    console.log('651: layout already has variable_budget_spot_amount');
    await deploy(rev);
    await waitDeploy();
    console.log('651: OK');
    return;
  }

  const idx = layout.findIndex((r) => r.fields?.some((f) => f.code === ANCHOR_ROW_FIELD));
  if (idx === -1) {
    throw new Error(`651: layout に ${ANCHOR_ROW_FIELD} を含む行がありません（variable 月別の先頭行）。`);
  }
  const rows = JSON.parse(JSON.stringify(layout));
  const newRow = {
    type: 'ROW',
    fields: [fieldRefNumber('variable_budget_spot_amount'), fieldRefDate('variable_budget_pay_date')],
  };
  rows.splice(idx, 0, newRow);
  rev = await putPreviewLayout(rev, rows);
  await deploy(rev);
  await waitDeploy();
  console.log('651: 変動費スポット行を variable 月別の直前に挿入しました。npm run deploy:651');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
