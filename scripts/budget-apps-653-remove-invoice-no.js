/**
 * 653 予算実績から invoice_no（伝票・参照番号）を削除。請求元メモは actual_memo で運用。
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
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  authHeaders.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' };

const APP = 653;
const FIELD = 'invoice_no';

async function getPreviewFields() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET preview fields: ${j.code} ${j.message}`);
  return j;
}

async function deletePreviewFields(revision, fields) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'DELETE',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, revision, fields }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`DELETE preview fields: ${j.code} ${j.message}`);
  return j.revision;
}

async function deployApp(revision) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ apps: [{ app: String(APP), revision }] }),
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
    const st = res.ok && j.apps && j.apps[0] ? j.apps[0].status : null;
    if (st === 'SUCCESS') return;
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy: ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('deploy timeout');
}

async function main() {
  const j = await getPreviewFields();
  if (!j.properties[FIELD]) {
    console.log(`653: field ${FIELD} already absent, skip.`);
    return;
  }
  const rev = await deletePreviewFields(j.revision, [FIELD]);
  await deployApp(rev);
  await waitDeploy();
  console.log(`653: removed ${FIELD} OK`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
