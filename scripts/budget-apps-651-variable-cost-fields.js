/**
 * 651 予算アプリに追加:
 * - 変動費用の月別 variable_budget_m05〜m04（12 フィールド・654 と同一コード）
 * - cost_type_lookup（650 の cost_type を job_lookup でコピー・選択肢は 650 と同一）
 * - job_lookup に fieldMappings を1件追加（cost_type → cost_type_lookup）
 *
 *   npm run budget:651-variable-cost-fields
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
const ANCHOR_VARIABLE_BLOCK = 'budget_m04';

/** 650 cost_type と同一キー（ルックアップコピー用） */
const COST_TYPE_LOOKUP_PROP = {
  cost_type_lookup: {
    type: 'DROP_DOWN',
    code: 'cost_type_lookup',
    label: '費用区分（工種マスタ）',
    required: false,
    noLabel: false,
    defaultValue: '',
    options: {
      固定費: { label: '固定費', index: '0' },
      変動費: { label: '変動費', index: '1' },
      '固定費・変動費': { label: '固定費・変動費', index: '2' },
      未設定: { label: '未設定', index: '3' },
    },
  },
};

const VARIABLE_MONTH_SPECS = [
  { code: 'variable_budget_m05', label: '変動費予算（5月）' },
  { code: 'variable_budget_m06', label: '変動費予算（6月）' },
  { code: 'variable_budget_m07', label: '変動費予算（7月）' },
  { code: 'variable_budget_m08', label: '変動費予算（8月）' },
  { code: 'variable_budget_m09', label: '変動費予算（9月）' },
  { code: 'variable_budget_m10', label: '変動費予算（10月）' },
  { code: 'variable_budget_m11', label: '変動費予算（11月）' },
  { code: 'variable_budget_m12', label: '変動費予算（12月）' },
  { code: 'variable_budget_m01', label: '変動費予算（1月・翌年度）' },
  { code: 'variable_budget_m02', label: '変動費予算（2月・翌年度）' },
  { code: 'variable_budget_m03', label: '変動費予算（3月・翌年度）' },
  { code: 'variable_budget_m04', label: '変動費予算（4月・翌年度）' },
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

async function getPreviewFields(app) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${app}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET fields: ${j.code} ${j.message}`);
  return j;
}

async function postPreviewFields(app, properties) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ app, properties }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`POST fields: ${j.code} ${j.message}`);
  return j.revision;
}

async function putPreviewFields(app, revision, properties) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app, revision, properties }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT fields: ${j.code} ${j.message}`);
  return j.revision;
}

async function getPreviewLayout(app) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json?app=${app}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET layout: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewLayout(app, revision, layout) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app, revision, layout }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT layout: ${j.code} ${j.message}`);
  return j.revision;
}

async function deploy(app, revision) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ apps: [{ app, revision }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`deploy: ${j.code} ${j.message}`);
}

async function waitDeploy(app) {
  for (let i = 0; i < 90; i++) {
    const u = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    u.searchParams.set('apps[0]', String(app));
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

function dropDownRef(code) {
  return { type: 'DROP_DOWN', code, size: { width: '200' } };
}

async function main() {
  const j650 = await getPreviewFields(650);
  const hasCostTypeOn650 = !!(j650.properties && j650.properties.cost_type);
  if (!hasCostTypeOn650) {
    console.warn(
      '651: 650 のプレビューに cost_type がありません。npm run budget:650-cost-type 後に本スクリプトを再実行すると job_lookup へマッピングを追加します（フィールド・レイアウトはこのまま追加します）。'
    );
  }

  let j = await getPreviewFields(APP);
  const toAdd = {};
  if (!j.properties.cost_type_lookup) {
    Object.assign(toAdd, COST_TYPE_LOOKUP_PROP);
  }
  for (const s of VARIABLE_MONTH_SPECS) {
    if (!j.properties[s.code]) {
      toAdd[s.code] = numberField(s.code, s.label);
    }
  }
  if (Object.keys(toAdd).length > 0) {
    await postPreviewFields(APP, toAdd);
    console.log('651: posted', Object.keys(toAdd).join(', '));
    j = await getPreviewFields(APP);
  } else {
    console.log('651: variable + cost_type_lookup fields already exist');
  }

  const lay = await getPreviewLayout(APP);
  let layout = lay.layout;
  let rev = lay.revision;
  let changed = false;

  if (!layoutHasField(layout, 'cost_type_lookup')) {
    const idxJobName = layout.findIndex(
      (r) => r.type === 'ROW' && r.fields?.some((f) => f.code === 'job_name')
    );
    if (idxJobName === -1) {
      throw new Error('651: job_name を含む行がレイアウトにありません（finalize 未実行の可能性）。');
    }
    const row = { type: 'ROW', fields: [dropDownRef('cost_type_lookup')] };
    const rows = JSON.parse(JSON.stringify(layout));
    rows.splice(idxJobName + 1, 0, row);
    layout = rows;
    changed = true;
    console.log('651: inserted cost_type_lookup row after job_name');
  } else {
    console.log('651: layout already has cost_type_lookup');
  }

  if (!layoutHasField(layout, 'variable_budget_m05')) {
    const newRows = [
      { type: 'ROW', fields: VARIABLE_MONTH_SPECS.slice(0, 4).map((s) => fieldRef(s.code)) },
      { type: 'ROW', fields: VARIABLE_MONTH_SPECS.slice(4, 8).map((s) => fieldRef(s.code)) },
      { type: 'ROW', fields: VARIABLE_MONTH_SPECS.slice(8, 12).map((s) => fieldRef(s.code)) },
    ];
    layout = insertRowsAfterField(layout, ANCHOR_VARIABLE_BLOCK, newRows);
    changed = true;
    console.log('651: inserted variable_budget_m** rows after', ANCHOR_VARIABLE_BLOCK);
  } else {
    console.log('651: layout already has variable_budget_m05');
  }

  if (changed) {
    rev = await putPreviewLayout(APP, rev, layout);
  }

  j = await getPreviewFields(APP);
  let revPut = j.revision;
  const p = j.properties;
  if (!p.job_lookup?.lookup) {
    throw new Error('651: job_lookup に lookup 設定がありません。');
  }
  const maps = p.job_lookup.lookup.fieldMappings || [];
  const hasCostMap = maps.some((m) => m.field === 'cost_type_lookup' && m.relatedField === 'cost_type');
  if (!hasCostMap && hasCostTypeOn650) {
    p.job_lookup.lookup.fieldMappings = [
      ...maps,
      { field: 'cost_type_lookup', relatedField: 'cost_type' },
    ];
    revPut = await putPreviewFields(APP, revPut, { job_lookup: p.job_lookup });
    console.log('651: job_lookup に cost_type → cost_type_lookup を追加');
  } else if (hasCostMap) {
    console.log('651: job_lookup に cost_type マッピング済み');
  } else {
    console.log('651: job_lookup マッピングはスキップ（650 に cost_type が無い）');
  }

  const finalLay = await getPreviewLayout(APP);
  await deploy(APP, finalLay.revision);
  await waitDeploy(APP);
  console.log('651: OK. npm run deploy:651 で JS を反映してください。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
