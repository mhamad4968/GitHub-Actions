/**
 * App 674: pc_status に「取消」（登録ミス）を追加して deploy。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-add-pc-status-cancel-preview.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-add-pc-status-cancel-preview.mjs
 */
import 'dotenv/config';

const APP = 674;
const CANCEL_VALUE = '取消';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '');
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

async function getPreviewFields() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET fields: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewFields(revision, properties) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, revision, properties }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT fields: ${j.code} ${j.message}`);
  return j.revision;
}

async function deployPreview(revision) {
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

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const cur = await getPreviewFields();
  const pcStatus = cur.properties?.pc_status;
  if (!pcStatus) throw new Error('674: pc_status field missing');

  if (pcStatus.options?.[CANCEL_VALUE]) {
    console.log(`674: pc_status「${CANCEL_VALUE}」は既に存在。スキップ。`);
    return;
  }

  const next = JSON.parse(JSON.stringify(pcStatus));
  next.options = next.options || {};
  next.options[CANCEL_VALUE] = { label: CANCEL_VALUE, index: '3' };
  next.label = 'ステータス (利用中 / 保管 / 廃棄 / 取消)';

  if (dryRun) {
    console.log(JSON.stringify({ app: APP, pc_status: next }, null, 2));
    console.error('[674] dry-run: PUT していません');
    return;
  }

  const rev = await putPreviewFields(cur.revision, { pc_status: next });
  await deployPreview(rev);
  await waitDeploy();
  console.log(`[674] deploy SUCCESS (pc_status に「${CANCEL_VALUE}」追加)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
