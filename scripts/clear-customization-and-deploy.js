import 'dotenv/config';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

const appId = process.argv[2];
if (!appId || !/^\d+$/.test(appId)) {
  console.error('Usage: node scripts/clear-customization-and-deploy.js <APP_ID>');
  process.exit(2);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const commonHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  commonHeaders.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

async function updatePreviewCustomization(app) {
  const url = new URL(`${baseUrl}/k/v1/preview/app/customize.json`);
  const body = {
    app,
    scope: 'ALL',
    desktop: { js: [], css: [] },
    mobile: { js: [], css: [] },
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...commonHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* noop */ }
  if (!res.ok) {
    throw new Error(`Update customize failed: HTTP ${res.status} ${res.statusText} ${json?.code || ''} ${json?.message || ''}`.trim());
  }
  return json.revision;
}

async function deployAppSettings(app, revision) {
  const url = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  const body = { apps: [{ app, revision }] };
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...commonHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let json = null;
    try { json = JSON.parse(text); } catch {}
    throw new Error(`Deploy failed: HTTP ${res.status} ${res.statusText} ${json?.code || ''} ${json?.message || ''}`.trim());
  }
}

async function getDeployStatus(app) {
  const url = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  url.searchParams.set('apps[0]', String(app));
  const res = await fetch(url, { method: 'GET', headers: commonHeaders });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) {
    throw new Error(`Get deploy status failed: HTTP ${res.status} ${res.statusText} ${json?.code || ''} ${json?.message || ''}`.trim());
  }
  return Array.isArray(json.apps) && json.apps[0] ? json.apps[0].status : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const appNum = Number(appId);
console.log(`[clear] Updating preview customization for app ${appNum} (remove all JS/CSS)`);
const revision = await updatePreviewCustomization(appNum);
console.log(`[clear] Updated. revision=${revision}`);

console.log('[clear] Deploying app settings to live...');
await deployAppSettings(appNum, revision);

for (let i = 0; i < 60; i++) {
  const st = await getDeployStatus(appNum);
  if (st === 'SUCCESS') {
    console.log('[clear] Deploy SUCCESS');
    process.exit(0);
  }
  if (st === 'FAIL' || st === 'CANCEL') {
    throw new Error(`Deploy status: ${st}`);
  }
  await sleep(1000);
}

throw new Error('Deploy status timed out (still PROCESSING).');

