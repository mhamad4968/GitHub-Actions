/**
 * Kintone 疎通確認（認証・594/595/626/627 のアプリ設定が読めるか）。
 * `npm run kintone:test` から実行。
 */
import 'dotenv/config';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

const PC_STACK_APPS = [594, 595, 626, 627];

async function fetchJson(url) {
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 400);
    throw new Error(`HTTP ${res.status} ${msg}`);
  }
  return json;
}

for (const app of PC_STACK_APPS) {
  const u = new URL(`${baseUrl}/k/v1/app.json`);
  u.searchParams.set('id', String(app));
  const json = await fetchJson(u.toString());
  const name = json?.name != null ? String(json.name) : '(no name)';
  console.log(`[ok] app ${app}: ${name}`);
}

console.log('[kintone:test] PC台帳スタック疎通 OK');
