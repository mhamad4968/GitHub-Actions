/**
 * 651 の cost_type_lookup のドロップダウン選択肢を、650 の cost_type（本番 GET）と同一にする。
 * プレビュー API で PUT し deploy まで行う（本番 form PUT はテナント設定で拒否されることがある）。
 *
 *   npm run budget:651-sync-cost-type-lookup
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

const APP_MASTER = 650;
const APP_BUDGET = 651;
const FIELD_SRC = 'cost_type';
const FIELD_DST = 'cost_type_lookup';

async function getLiveFields(app) {
  const res = await fetch(`${baseUrl}/k/v1/app/form/fields.json?app=${app}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET live fields ${app}: ${j.code} ${j.message}`);
  return j;
}

async function getPreviewFields(app) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${app}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET preview fields ${app}: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewFields(app, revision, properties) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app, revision, properties }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT preview fields ${app}: ${j.code} ${j.message}`);
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

function optionsEqual(a, b) {
  const ka = a ? Object.keys(a).sort().join('\0') : '';
  const kb = b ? Object.keys(b).sort().join('\0') : '';
  if (ka !== kb) return false;
  if (!a || !b) return ka === kb;
  var k;
  for (k in a) {
    if (!Object.prototype.hasOwnProperty.call(a, k)) continue;
    if (!b[k] || String(a[k].label) !== String(b[k].label) || String(a[k].index) !== String(b[k].index)) {
      return false;
    }
  }
  return true;
}

async function main() {
  const j650 = await getLiveFields(APP_MASTER);
  const src = j650.properties && j650.properties[FIELD_SRC];
  if (!src || src.type !== 'DROP_DOWN') {
    throw new Error(`${APP_MASTER} に ${FIELD_SRC}（DROP_DOWN）がありません。`);
  }

  const j651 = await getPreviewFields(APP_BUDGET);
  const dst = j651.properties && j651.properties[FIELD_DST];
  if (!dst || dst.type !== 'DROP_DOWN') {
    throw new Error(`${APP_BUDGET} のプレビューに ${FIELD_DST}（DROP_DOWN）がありません。`);
  }

  if (optionsEqual(dst.options, src.options)) {
    console.log(`${APP_BUDGET}: ${FIELD_DST} は既に ${APP_MASTER}.${FIELD_SRC} と同じ選択肢です。デプロイ不要。`);
    return;
  }

  const next = JSON.parse(JSON.stringify(dst));
  next.options = JSON.parse(JSON.stringify(src.options));
  const rev = await putPreviewFields(APP_BUDGET, j651.revision, { [FIELD_DST]: next });
  await deploy(APP_BUDGET, rev);
  await waitDeploy(APP_BUDGET);
  console.log(`${APP_BUDGET}: ${FIELD_DST} を更新しデプロイしました。選択肢:`, Object.keys(next.options).join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
