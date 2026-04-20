/**
 * 予算連携アプリ（650/651/652/653）のフォーム仕上げ:
 * - 650: job_code 重複禁止（マスタはコード単位）
 * - 651: job_lookup の関連キーを job_code。650 から job_code・工種名をコピー。ピッカーに工種名・コード表示。matching_key 重複禁止
 * - 652/653: 651 から job_name はフィールド job_name を参照するマッピングに揃える
 * - 652: matching_key ラベル「突合キー」
 * - 653: 実績金額に桁区切り・円
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

const baseHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  baseHeaders.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

/** プレビュー側のフォーム（MCP でフィールド追加後はこちらが最新） */
async function getPreviewFields(app) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${app}`, { headers: baseHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET preview fields ${app}: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewFields(app, revision, properties) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ app, revision, properties }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT preview fields ${app}: ${j.code} ${j.message}`);
  return j.revision;
}

/** 新規フィールド追加（PUT では GAIA_FC01 になる） */
async function postPreviewFields(app, properties) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ app, properties }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`POST preview fields ${app}: ${j.code} ${j.message}`);
  return j.revision;
}

async function getPreviewLayout(app) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json?app=${app}`, { headers: baseHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET preview layout ${app}: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewLayout(app, revision, layout) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json`, {
    method: 'PUT',
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ app, revision, layout }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT preview layout ${app}: ${j.code} ${j.message}`);
  return j.revision;
}

/**
 * 工種ピック直後に 工種名・工種コードを1行にまとめる。
 * POST で追加された単独 job_name 行と、別行の job_code を除去してから挿入し、FN11（layout に field 欠落）を防ぐ。
 */
function layout651InsertJobNameRow(layout) {
  const rows = JSON.parse(JSON.stringify(layout));
  const idxLookup = rows.findIndex((r) => r.fields?.some((f) => f.code === 'job_lookup'));
  if (idxLookup === -1) throw new Error('651 layout: job_lookup row not found');

  const nextRow = rows[idxLookup + 1];
  if (
    nextRow &&
    nextRow.type === 'ROW' &&
    nextRow.fields?.some((f) => f.code === 'job_name') &&
    nextRow.fields?.some((f) => f.code === 'job_code')
  ) {
    return rows;
  }

  let jobNameCell = { type: 'SINGLE_LINE_TEXT', code: 'job_name', size: { width: '400' } };
  let jobCodeCell = { type: 'SINGLE_LINE_TEXT', code: 'job_code', size: { width: '193' } };
  for (const r of rows) {
    for (const f of r.fields || []) {
      if (f.code === 'job_name') {
        jobNameCell = { type: f.type, code: f.code, size: f.size || { width: '400' } };
      }
      if (f.code === 'job_code') {
        jobCodeCell = { type: f.type, code: f.code, size: f.size || { width: '193' } };
      }
    }
  }

  for (let i = rows.length - 1; i >= 0; i--) {
    const fs = rows[i].fields || [];
    if (fs.length === 1 && (fs[0].code === 'job_name' || fs[0].code === 'job_code')) {
      rows.splice(i, 1);
    }
  }

  const idxAfter = rows.findIndex((r) => r.fields?.some((f) => f.code === 'job_lookup'));
  rows.splice(idxAfter + 1, 0, {
    type: 'ROW',
    fields: [jobNameCell, jobCodeCell],
  });
  return rows;
}

const JOB_NAME_FIELD_651 = {
  type: 'SINGLE_LINE_TEXT',
  code: 'job_name',
  label: '工種名',
  noLabel: false,
  required: false,
  minLength: '',
  maxLength: '',
  expression: '',
  hideExpression: false,
  unique: false,
  defaultValue: '',
};

async function deployApp(app, revision) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ apps: [{ app: String(app), revision }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`deploy POST ${app}: ${j.code} ${j.message}`);
}

async function waitDeploy(app) {
  for (let i = 0; i < 90; i++) {
    const u = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    u.searchParams.set('apps[0]', String(app));
    const res = await fetch(u, { headers: baseHeaders });
    const j = await res.json();
    const st = res.ok && j.apps && j.apps[0] ? j.apps[0].status : null;
    if (st === 'SUCCESS') return;
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy ${app}: ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`deploy ${app}: timeout`);
}

async function patchApp650() {
  const j = await getPreviewFields(650);
  const p = j.properties;
  p.job_code.unique = true;
  const rev = await putPreviewFields(650, j.revision, { job_code: p.job_code });
  await deployApp(650, rev);
  await waitDeploy(650);
  console.log('650: job_code unique OK');
}

async function patchApp651() {
  let j = await getPreviewFields(651);
  let p = j.properties;

  if (!p.job_name) {
    await postPreviewFields(651, { job_name: JOB_NAME_FIELD_651 });
    j = await getPreviewFields(651);
    p = j.properties;
    if (!p.job_name) {
      throw new Error('651: job_name field still missing after PUT');
    }
  }

  p.job_lookup.lookup.relatedKeyField = 'job_code';
  const baseMaps = [
    { field: 'job_code', relatedField: 'job_code' },
    { field: 'job_name', relatedField: 'job_name' },
  ];
  if (p.cost_type_lookup) {
    baseMaps.push({ field: 'cost_type_lookup', relatedField: 'cost_type' });
  }
  p.job_lookup.lookup.fieldMappings = baseMaps;
  p.job_lookup.lookup.lookupPickerFields = ['job_name', 'job_code'];
  p.matching_key.unique = true;

  let rev = await putPreviewFields(651, j.revision, {
    job_lookup: p.job_lookup,
    matching_key: p.matching_key,
  });

  const lay = await getPreviewLayout(651);
  const newLayout = layout651InsertJobNameRow(lay.layout);
  rev = await putPreviewLayout(651, lay.revision, newLayout);

  await deployApp(651, rev);
  await waitDeploy(651);
  console.log('651: lookup key=job_code, job_name field+layout, picker fields OK');
}

async function patchApp652() {
  const j = await getPreviewFields(652);
  const p = j.properties;
  const lu = 'ルックアップ';
  p[lu].lookup.fieldMappings = [
    { field: 'job_code', relatedField: 'job_code' },
    { field: 'job_name', relatedField: 'job_name' },
    { field: 'company_name', relatedField: 'company_name' },
    { field: 'summary', relatedField: 'summary' },
    { field: 'summary_detail', relatedField: 'summary_detail' },
    { field: 'matching_key', relatedField: 'matching_key' },
  ];
  p[lu].lookup.lookupPickerFields = ['company_name', 'summary', 'job_lookup', 'job_code', 'summary_detail'];
  p.matching_key.label = '突合キー';
  const rev = await putPreviewFields(652, j.revision, {
    [lu]: p[lu],
    matching_key: p.matching_key,
  });
  await deployApp(652, rev);
  await waitDeploy(652);
  console.log('652: lookup mappings + matching_key label OK');
}

async function patchApp653() {
  const j = await getPreviewFields(653);
  const p = j.properties;
  p.lookup_budget.lookup.fieldMappings = [
    { field: 'matching_key', relatedField: 'matching_key' },
    { field: 'job_code', relatedField: 'job_code' },
    { field: 'job_name', relatedField: 'job_name' },
    { field: 'company_name', relatedField: 'company_name' },
    { field: 'summary', relatedField: 'summary' },
    { field: 'summary_detail', relatedField: 'summary_detail' },
  ];
  p.lookup_budget.lookup.lookupPickerFields = ['company_name', 'summary', 'job_lookup', 'job_code', 'summary_detail'];
  p.actual_amount.digit = true;
  p.actual_amount.unit = '円';
  p.actual_amount.unitPosition = 'AFTER';
  const rev = await putPreviewFields(653, j.revision, {
    lookup_budget: p.lookup_budget,
    actual_amount: p.actual_amount,
  });
  await deployApp(653, rev);
  await waitDeploy(653);
  console.log('653: lookup job_code + actual_amount 円 OK');
}

async function main() {
  await patchApp650();
  await patchApp651();
  await patchApp652();
  await patchApp653();
  console.log('All done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
