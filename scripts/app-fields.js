import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

const appId = process.argv[2];
let outPath = null;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out' && args[i + 1]) outPath = args[++i];
}
if (!appId || !/^\d+$/.test(appId)) {
  console.error('Usage: npm run app:fields <APP_ID> [--out path.json]');
  console.error('Example: npm run app:fields 594');
  process.exit(2);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
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

const url = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
url.searchParams.set('app', String(appId));

const res = await fetch(url, { method: 'GET', headers });
const text = await res.text();
let json = null;
try { json = JSON.parse(text); } catch { /* noop */ }

if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`);
  if (json?.code || json?.message) console.error(`kintone error: ${json.code || ''} ${json.message || ''}`.trim());
  else console.error(text.slice(0, 800));
  process.exit(1);
}

const properties = json?.properties || {};
const rows = Object.entries(properties).map(([code, p]) => ({
  code,
  type: p?.type || '',
  label: p?.label || '',
}));

rows.sort((a, b) => a.code.localeCompare(b.code, 'ja'));

console.log(`App ${appId} fields (${rows.length})`);
for (const r of rows) {
  console.log(`${r.code}\t${r.type}\t${r.label}`);
}

if (outPath) {
  const full = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(properties, null, 2)}\n`, 'utf8');
  console.log(`[app-fields] snapshot -> ${full}`);
}

