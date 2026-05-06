#!/usr/bin/env node
/**
 * 681 の「困ったときは」章の本文を「部署内のメンバーへ相談してください。」に揃える。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-quick-guide-set-trouble-chapter.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-quick-guide-set-trouble-chapter.mjs --dry-run
 */
import 'dotenv/config';

const APP_ID = Number(process.env.PC_LEDGER_QUICK_GUIDE_APP_ID || 681);
const NEW_BODY = '部署内のメンバーへ相談してください。';
const dryRun = process.argv.includes('--dry-run');

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
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

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 1200);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

function isTroubleChapter(rec) {
  const m = rec.midashi && rec.midashi.value != null ? String(rec.midashi.value).trim() : '';
  if (!m) return false;
  const n = m.replace(/[？?]/g, '');
  return n.includes('困ったときは');
}

async function main() {
  const p = new URLSearchParams();
  p.set('app', String(APP_ID));
  p.set('query', 'order by sort_no asc limit 500 offset 0');
  p.append('fields[0]', '$id');
  p.append('fields[1]', 'midashi');
  p.append('fields[2]', 'honbun');
  const data = await fetchJson(`${baseUrl}/k/v1/records.json?${p}`, { method: 'GET', headers: { ...authHeaders } });
  const rows = data.records || [];
  const hit = rows.find(isTroubleChapter);
  if (!hit) {
    console.log(`[set-trouble] app=${APP_ID}: 「困ったときは」に該当する見出しのレコードがありません（${rows.length} 件確認）`);
    return;
  }
  const id = hit.$id && hit.$id.value;
  const midashi = hit.midashi && hit.midashi.value;
  const honbun = hit.honbun && hit.honbun.value;
  console.log(`[set-trouble] id=${id} midashi=${JSON.stringify(midashi)} honbun(before)=${JSON.stringify(honbun)}`);
  if (dryRun) {
    console.log('[set-trouble] --dry-run のため PUT しません');
    return;
  }
  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({
      app: APP_ID,
      id,
      record: {
        honbun: { value: NEW_BODY },
      },
    }),
  });
  console.log('[set-trouble] PUT 完了 → 本文:', NEW_BODY);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
