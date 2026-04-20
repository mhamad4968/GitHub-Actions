/**
 * 651/652/653 に「明細」summary_detail（1行）を追加し、突合キーに含める。
 * 変動費などは摘要ドロップダウンは増やさず、明細に自由入力する運用向け。
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

const SUMMARY_DETAIL_FIELD = {
  type: 'SINGLE_LINE_TEXT',
  code: 'summary_detail',
  label: '明細',
  noLabel: false,
  required: false,
  minLength: '',
  maxLength: '',
  expression: '',
  hideExpression: false,
  unique: false,
  defaultValue: '',
};

async function getPreviewFields(app) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${app}`, { headers: baseHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET preview fields ${app}: ${j.code} ${j.message}`);
  return j;
}

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

function layoutHasField(layout, code) {
  return layout.some((r) => r.fields?.some((f) => f.code === code));
}

/** 指定フィールドを含む行の直後に新しい ROW を挿入 */
function insertRowAfterField(layout, fieldCode, newRow) {
  const rows = JSON.parse(JSON.stringify(layout));
  const idx = rows.findIndex((r) => r.fields?.some((f) => f.code === fieldCode));
  if (idx === -1) throw new Error(`layout: row with field "${fieldCode}" not found`);
  rows.splice(idx + 1, 0, newRow);
  return rows;
}

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

async function patchApp651() {
  let j = await getPreviewFields(651);
  if (!j.properties.summary_detail) {
    await postPreviewFields(651, { summary_detail: SUMMARY_DETAIL_FIELD });
    j = await getPreviewFields(651);
  }
  let lay = await getPreviewLayout(651);
  let rev;
  if (!layoutHasField(lay.layout, 'summary_detail')) {
    const newLayout = insertRowAfterField(lay.layout, 'summary', {
      type: 'ROW',
      fields: [{ type: 'SINGLE_LINE_TEXT', code: 'summary_detail', size: { width: '647' } }],
    });
    rev = await putPreviewLayout(651, lay.revision, newLayout);
  } else {
    rev = lay.revision;
  }
  await deployApp(651, rev);
  await waitDeploy(651);
  console.log('651: summary_detail OK');
}

async function patchApp652() {
  let j = await getPreviewFields(652);
  if (!j.properties.summary_detail) {
    await postPreviewFields(652, { summary_detail: SUMMARY_DETAIL_FIELD });
    j = await getPreviewFields(652);
  }
  const lu = 'ルックアップ';
  const p = j.properties;
  const m = p[lu].lookup.fieldMappings || [];
  if (!m.some((x) => x.field === 'summary_detail')) {
    p[lu].lookup.fieldMappings = [
      ...m,
      { field: 'summary_detail', relatedField: 'summary_detail' },
    ];
    await putPreviewFields(652, j.revision, { [lu]: p[lu] });
    j = await getPreviewFields(652);
  }
  let lay = await getPreviewLayout(652);
  let rev;
  if (!layoutHasField(lay.layout, 'summary_detail')) {
    const newLayout = insertRowAfterField(lay.layout, 'summary', {
      type: 'ROW',
      fields: [{ type: 'SINGLE_LINE_TEXT', code: 'summary_detail', size: { width: '647' } }],
    });
    rev = await putPreviewLayout(652, lay.revision, newLayout);
  } else {
    rev = lay.revision;
  }
  await deployApp(652, rev);
  await waitDeploy(652);
  console.log('652: summary_detail + lookup mapping OK');
}

async function patchApp653() {
  let j = await getPreviewFields(653);
  if (!j.properties.summary_detail) {
    await postPreviewFields(653, { summary_detail: SUMMARY_DETAIL_FIELD });
    j = await getPreviewFields(653);
  }
  const p = j.properties;
  const m = p.lookup_budget.lookup.fieldMappings || [];
  if (!m.some((x) => x.field === 'summary_detail')) {
    p.lookup_budget.lookup.fieldMappings = [
      ...m,
      { field: 'summary_detail', relatedField: 'summary_detail' },
    ];
    await putPreviewFields(653, j.revision, { lookup_budget: p.lookup_budget });
    j = await getPreviewFields(653);
  }
  let lay = await getPreviewLayout(653);
  let rev;
  if (!layoutHasField(lay.layout, 'summary_detail')) {
    const newLayout = insertRowAfterField(lay.layout, 'summary', {
      type: 'ROW',
      fields: [{ type: 'SINGLE_LINE_TEXT', code: 'summary_detail', size: { width: '647' } }],
    });
    rev = await putPreviewLayout(653, lay.revision, newLayout);
  } else {
    rev = lay.revision;
  }
  await deployApp(653, rev);
  await waitDeploy(653);
  console.log('653: summary_detail + lookup mapping OK');
}

async function main() {
  await patchApp651();
  await patchApp652();
  await patchApp653();
  console.log('All done. matching_key = job_code|company_name|summary|summary_detail (明細は空可)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
