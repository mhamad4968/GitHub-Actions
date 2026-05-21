/**
 * App 670: 棚卸期間の設定キーを追加（既存キーがあればスキップ）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-670-seed-inventory-period-keys.mjs --dry-run
 *   npm run pc-ledger:670:seed-inventory-period-keys
 *
 * 環境変数（任意）:
 *   PC_INVENTORY_PERIOD_START  例 2026-05-01
 *   PC_INVENTORY_PERIOD_END    例 2026-05-31
 */
import 'dotenv/config';

const APP = 670;
const KEYS = [
  {
    setting_key: 'PC_INVENTORY_PERIOD_START',
    setting_value: process.env.PC_INVENTORY_PERIOD_START || '2026-05-01',
    category: 'その他',
    description: 'PC棚卸の実施開始日（YYYY-MM-DD）。この日〜終了日の間のみ棚卸ボタンを表示。',
  },
  {
    setting_key: 'PC_INVENTORY_PERIOD_END',
    setting_value: process.env.PC_INVENTORY_PERIOD_END || '2026-05-31',
    category: 'その他',
    description: 'PC棚卸の実施終了日（YYYY-MM-DD）。',
  },
];

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

async function fetchExistingKeys() {
  const u = new URL(`${baseUrl}/k/v1/records.json`);
  u.searchParams.set('app', String(APP));
  u.searchParams.set('query', 'order by レコード番号 asc limit 500');
  u.searchParams.append('fields[0]', 'setting_key');
  const res = await fetch(u, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET records: ${j.code} ${j.message}`);
  const set = new Set();
  for (const r of j.records || []) {
    const k = r.setting_key?.value;
    if (k) set.add(k);
  }
  return set;
}

async function postRecords(records) {
  const res = await fetch(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, records }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`POST records: ${j.code} ${j.message}`);
  return j;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const existing = await fetchExistingKeys();
  const toAdd = KEYS.filter((k) => !existing.has(k.setting_key));
  if (!toAdd.length) {
    console.log('670: 棚卸期間キーは既に存在。追加スキップ。');
    return;
  }
  const records = toAdd.map((k) => ({
    setting_key: { value: k.setting_key },
    setting_value: { value: k.setting_value },
    category: { value: k.category },
    description: { value: k.description },
  }));
  if (dryRun) {
    console.log(JSON.stringify({ app: APP, records }, null, 2));
    console.error('[670] dry-run: POST していません');
    return;
  }
  await postRecords(records);
  console.log('[670] 追加:', toAdd.map((k) => `${k.setting_key}=${k.setting_value}`).join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
