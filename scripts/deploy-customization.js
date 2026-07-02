import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { extractBuildFromSource, recordLiveBuild } from './cio-live-build-registry.mjs';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

const appId = process.argv[2];
const jsPath = process.argv[3];

if (!appId || !/^\d+$/.test(appId) || !jsPath) {
  console.error('Usage: node scripts/deploy-customization.js <APP_ID> <JS_PATH>');
  console.error('Example: node scripts/deploy-customization.js 594 customize/594/desktop.js');
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

async function uploadFile(path) {
  const buf = await readFile(path);
  const form = new FormData();
  form.set('file', new Blob([buf], { type: 'text/javascript' }), path.split('/').pop() || 'desktop.js');

  const url = new URL(`${baseUrl}/k/v1/file.json`);
  const res = await fetch(url, { method: 'POST', headers: commonHeaders, body: form });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) {
    throw new Error(`Upload failed: HTTP ${res.status} ${res.statusText} ${json?.code || ''} ${json?.message || ''}`.trim());
  }
  return json.fileKey;
}

async function updatePreviewCustomization(app, fileKey) {
  const url = new URL(`${baseUrl}/k/v1/preview/app/customize.json`);
  const body = {
    app,
    scope: 'ALL',
    desktop: { js: [{ type: 'FILE', file: { fileKey } }], css: [] },
    mobile: { js: [], css: [] },
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...commonHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = JSON.parse(text);
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
const jsContent = await readFile(jsPath, 'utf8');
const buildTag = extractBuildFromSource(jsContent);
console.log(`Uploading JS: ${jsPath}${buildTag ? ` (BUILD=${buildTag})` : ''}`);
const fileKey = await uploadFile(jsPath);
console.log(`Uploaded. fileKey=${fileKey}`);

console.log(`Updating preview customization for app ${appNum}`);
const revision = await updatePreviewCustomization(appNum, fileKey);
console.log(`Updated. revision=${revision}`);

console.log('Deploying app settings to live...');
await deployAppSettings(appNum, revision);

for (let i = 0; i < 60; i++) {
  const st = await getDeployStatus(appNum);
  if (st === 'SUCCESS') {
    recordLiveBuild({
      appId: appNum,
      build: buildTag,
      fileKey,
      revision,
      relPath: jsPath,
    });
    console.log('Deploy SUCCESS');
    if (buildTag) console.log(`[live-build-registry] recorded BUILD=${buildTag} app=${appNum}`);
    console.log('');
    console.log('[R63] deploy SUCCESS — 同一セッション内に customize + kintone-apps + cio-live-builds を commit すること');
    console.log('      （夕締め一括禁止・npm run cio:session:close-git または手動 git add/commit）');
    console.log('');
    const sync = spawnSync(process.execPath, ['scripts/sync-kintone-apps-build.mjs', String(appNum), '--strict'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    if (sync.stdout) process.stdout.write(sync.stdout);
    if (sync.stderr) process.stderr.write(sync.stderr);
    if (sync.status !== 0) {
      console.error(
        `[deploy-customization] NG sync:kintone-apps-build --strict app=${appNum} — kintone-apps 詳細行/機械表を修正して再 deploy（R-KAP-02）`,
      );
      process.exit(sync.status || 1);
    }
    const verify = spawnSync(process.execPath, [
      'scripts/verify-kintone-apps-live-build-sync.mjs',
      String(appNum),
      '--strict',
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    if (verify.stdout) process.stdout.write(verify.stdout);
    if (verify.stderr) process.stderr.write(verify.stderr);
    if (verify.status !== 0) {
      console.error(
        `[deploy-customization] NG verify-kintone-apps-live-build-sync app=${appNum} — garble/不一致（R-595-03）`,
      );
      process.exit(verify.status || 1);
    }
    process.exit(0);
  }
  if (st === 'FAIL' || st === 'CANCEL') {
    throw new Error(`Deploy status: ${st}`);
  }
  await sleep(1000);
}

throw new Error('Deploy status timed out (still PROCESSING).');

