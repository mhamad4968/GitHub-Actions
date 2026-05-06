#!/usr/bin/env node
/**
 * 681「PC台帳簡単ガイドライン」から、自部署内では不要なメタ章を削除する。
 * 対象: 見出しに「このガイドの読み方」または「いつから使う」を含むレコード
 * （`desktop.js` の `isMetaChapter` と同じ判定）。
 *
 * **既定は dry-run のみ**（DELETE しない）。本番削除は **`--apply`** が必要。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-quick-guide-prune-meta-chapters.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-quick-guide-prune-meta-chapters.mjs --apply
 *
 *   PC_LEDGER_QUICK_GUIDE_APP_ID=681  … 既定 681
 */
import 'dotenv/config';

const APP_ID = Number(process.env.PC_LEDGER_QUICK_GUIDE_APP_ID || 681);
/** チャットに dry-run 結果を貼り、ユーザーから「この一覧で削除 GO」が出たあとだけ付ける */
const apply = process.argv.includes('--apply');
const CHUNK = 100;

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

function isMetaChapter(rec) {
  const m = rec.midashi && rec.midashi.value != null ? String(rec.midashi.value).trim() : '';
  if (!m) return false;
  const n = m.replace(/[？?]/g, '');
  if (n.includes('このガイドの読み方')) return true;
  if (n.includes('いつから使う')) return true;
  return false;
}

async function fetchAllMidashiAndIds() {
  const out = [];
  const limit = 500;
  let offset = 0;
  for (;;) {
    const p = new URLSearchParams();
    p.set('app', String(APP_ID));
    p.set('query', `order by sort_no asc limit ${limit} offset ${offset}`);
    p.append('fields[0]', '$id');
    p.append('fields[1]', 'midashi');
    const u = `${baseUrl}/k/v1/records.json?${p.toString()}`;
    const data = await fetchJson(u, { method: 'GET', headers: { ...authHeaders } });
    const rows = data.records || [];
    out.push(...rows);
    if (rows.length < limit) break;
    offset += limit;
  }
  return out;
}

async function deleteByIds(ids) {
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'DELETE',
      headers: jsonHeaders,
      body: JSON.stringify({ app: APP_ID, ids: slice }),
    });
  }
}

async function main() {
  const rows = await fetchAllMidashiAndIds();
  const victims = rows.filter(isMetaChapter);
  if (!victims.length) {
    console.log(`[prune-meta] app=${APP_ID}: 該当レコードなし（${rows.length} 件確認）`);
    return;
  }
  const ids = victims.map((r) => Number(r.$id.value)).filter((n) => Number.isFinite(n));
  console.log(
    `[prune-meta] app=${APP_ID}: 削除対象 ${ids.length} 件`,
    victims.map((r) => ({ id: r.$id.value, midashi: r.midashi && r.midashi.value })),
  );

  if (!apply) {
    console.log('');
    console.log('[prune-meta] 既定は dry-run のみ（DELETE していません）。');
    console.log('[prune-meta] 手順: (1) 上の JSON をチャットに貼る (2) ユーザーから「この一覧で削除 GO」');
    console.log('[prune-meta] (3) そのあとで --apply を付けて再実行 → 本番 DELETE');
    return;
  }

  await deleteByIds(ids);
  console.log('[prune-meta] --apply により DELETE 完了');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
