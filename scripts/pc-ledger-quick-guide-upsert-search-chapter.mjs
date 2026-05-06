#!/usr/bin/env node
/**
 * 681 に「検索の使い方」章を追加する（既にあれば本文だけ更新）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-quick-guide-upsert-search-chapter.mjs
 */
import 'dotenv/config';

const APP_ID = Number(process.env.PC_LEDGER_QUICK_GUIDE_APP_ID || 681);
const MIDASHI = '検索の使い方';
const SORT_NO = '1';

const HONBUN = [
  '「一覧を表示（編集・追加）」を押すと、いつもの一覧画面が出ます。画面上の「検索」欄（虫眼鏡の横のボックス）に、探したい言葉を入れて Enter を押すか、虫眼鏡をクリックしてください。',
  '',
  '・一覧に残るのは、その言葉が「見出し」か「本文」に入っているレコードだけです。',
  '・長い文章をそのまま入れると見つからないことがあるので、短い言葉に分けて試してください（例：「台帳」「入力支援」）。',
  '・写真や図のファイル名だけでは検索されないことが多いので、本文に書いた言葉で探すとよいです。',
  '',
  '一覧を出さずに読むだけのときは、上の目次のボタンから章へ飛べます。',
].join('\n');

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

async function main() {
  const q = `midashi = "${MIDASHI}"`;
  const p = new URLSearchParams();
  p.set('app', String(APP_ID));
  p.set('query', q);
  p.append('fields[0]', '$id');
  p.append('fields[1]', 'midashi');
  p.append('fields[2]', 'honbun');
  const found = await fetchJson(`${baseUrl}/k/v1/records.json?${p}`, { method: 'GET', headers: { ...authHeaders } });
  const rows = found.records || [];

  if (rows.length) {
    const id = rows[0].$id.value;
    await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({
        app: APP_ID,
        id,
        record: {
          sort_no: { value: SORT_NO },
          honbun: { value: HONBUN },
        },
      }),
    });
    console.log(`[upsert-search] PUT id=${id} midashi=${MIDASHI}`);
    return;
  }

  await fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      app: APP_ID,
      records: [
        {
          sort_no: { value: SORT_NO },
          midashi: { value: MIDASHI },
          honbun: { value: HONBUN },
        },
      ],
    }),
  });
  console.log(`[upsert-search] POST 追加 midashi=${MIDASHI} sort_no=${SORT_NO}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
