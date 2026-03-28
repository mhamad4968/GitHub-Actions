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

const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};

const APP_595 = 595;

const FC_MAIL = 'mail';
const FC_NAME = 'user_name';
const FC_DEPT = 'dept_name';
const FC_GROUP = 'group_name';
const FC_EMP_STATUS = 'employment_status';

const count = Number(process.argv[2] || '100');
if (!Number.isFinite(count) || count <= 0 || count > 500) {
  console.error('Usage: node scripts/load-test-595.js [count]');
  console.error('count must be 1..500');
  process.exit(2);
}

const TEST_MARK = 'テスト';
const RUN_ID = `load_${Date.now()}`;

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* noop */ }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 800);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

async function add595(record) {
  const url = new URL(`${baseUrl}/k/v1/record.json`);
  const json = await fetchJson(url, { method: 'POST', headers, body: JSON.stringify({ app: APP_595, record }) });
  return json.id;
}

console.log(`[load] run_id=${RUN_ID} count=${count}`);
const ids = [];

for (let i = 1; i <= count; i++) {
  const local = `${RUN_ID}_${String(i).padStart(3, '0')}`;
  const mail = `${local}@j-bis.co.jp`;
  const record = {
    [FC_MAIL]: { value: mail },
    [FC_NAME]: { value: `LOAD${TEST_MARK}_${local}` }, // user_name is unique-restricted
    [FC_DEPT]: { value: TEST_MARK },
    [FC_GROUP]: { value: TEST_MARK },
    [FC_EMP_STATUS]: { value: '在籍' },
  };
  const id = await add595(record);
  ids.push(id);
  if (i % 20 === 0) console.log(`[load] created ${i}/${count}`);
}

console.log('[load] created_ids:', ids.join(','));
console.log(`[load] query_hint: dept_name = "${TEST_MARK}" and group_name = "${TEST_MARK}" and mail like "${RUN_ID}_"`);
console.log('[load] Next: run `npm run sync:595` multiple times (or bump --limit) until all are processed.');

