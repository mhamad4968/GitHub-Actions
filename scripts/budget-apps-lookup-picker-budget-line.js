/**
 * 652「予算行」・653「lookup_budget」のルックアップピッカーに
 * 請求会社名・摘要ほかを表示する（651 から選びやすくする）。
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

/** 651 側のフィールドコード。ピッカー列の並び */
const PICKER_FROM_651 = [
  'company_name',
  'summary',
  'job_lookup',
  'job_code',
  'summary_detail',
];

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

async function patch652() {
  const j = await getPreviewFields(652);
  const lu = 'ルックアップ';
  const p = j.properties[lu];
  p.lookup.lookupPickerFields = [...PICKER_FROM_651];
  const rev = await putPreviewFields(652, j.revision, { [lu]: p });
  await deployApp(652, rev);
  await waitDeploy(652);
  console.log('652: 予算行ピッカーに company_name, summary, ... OK');
}

async function patch653() {
  const j = await getPreviewFields(653);
  const p = j.properties.lookup_budget;
  p.lookup.lookupPickerFields = [...PICKER_FROM_651];
  const rev = await putPreviewFields(653, j.revision, { lookup_budget: p });
  await deployApp(653, rev);
  await waitDeploy(653);
  console.log('653: lookup_budget ピッカーに company_name, summary, ... OK');
}

async function main() {
  await patch652();
  await patch653();
  console.log('All done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
