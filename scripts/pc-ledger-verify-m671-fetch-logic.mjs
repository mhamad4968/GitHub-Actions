/**
 * 671 共有プール取得まわりの検証（オフライン＋任意で実 API）。
 * `npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-verify-m671-fetch-logic.mjs`
 *
 * - 単体: `sort671RowsBySerialNoAsc674` と desktop.js と同一の並べ替えロジック
 * - 単体: CB_VA01 時に guest=false URL で再試行する経路（kintone.api の形を模倣）
 * - 実 API: 環境変数があれば app 671 に records.json（新クエリ・旧 order by serial_no 比較）
 */
import 'dotenv/config';

const APP_671 = '671';

/** desktop.js `sort671RowsBySerialNoAsc674` と同一（変更時は両方更新） */
function sort671RowsBySerialNoAsc674(rows) {
  const arr = (rows || []).slice();
  arr.sort(function (a, b) {
    const ra = String((a.serial_no && a.serial_no.value) || '').trim();
    const rb = String((b.serial_no && b.serial_no.value) || '').trim();
    const na = parseInt(ra, 10);
    const nb = parseInt(rb, 10);
    const ia = Number.isFinite(na) ? na : Number.POSITIVE_INFINITY;
    const ib = Number.isFinite(nb) ? nb : Number.POSITIVE_INFINITY;
    if (ia !== ib) return ia - ib;
    const ida = parseInt(String((a.$id && a.$id.value) || '0'), 10) || 0;
    const idb = parseInt(String((b.$id && b.$id.value) || '0'), 10) || 0;
    return ida - idb;
  });
  return arr;
}

/** desktop.js `kintoneApiGetGuestSpaceFallback674` と同一方針 */
function kintoneApiGetGuestSpaceFallback674(kintone, urlPath, params) {
  return kintone.api(kintone.api.url(urlPath, true), 'GET', params).catch(function (e) {
    if (!e || e.code !== 'CB_VA01') return Promise.reject(e);
    return kintone.api(kintone.api.url(urlPath, false), 'GET', params);
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error('[assert fail] ' + msg);
}

function runSortTests() {
  const rows = [
    { $id: { value: '10' }, serial_no: { value: '3' } },
    { $id: { value: '5' }, serial_no: { value: '10' } },
    { $id: { value: '7' }, serial_no: { value: '3' } },
    { $id: { value: '99' }, serial_no: { value: 'x' } },
  ];
  const s = sort671RowsBySerialNoAsc674(rows);
  assert(s[0].$id.value === '7' && s[0].serial_no.value === '3', 'serial 3 tiebreak smaller $id first');
  assert(s[1].$id.value === '10' && s[1].serial_no.value === '3', 'second serial 3');
  assert(s[2].serial_no.value === '10', 'serial 10');
  assert(s[3].serial_no.value === 'x', 'non-numeric serial last');
  console.log('[ok] sort671RowsBySerialNoAsc674 (4 cases)');
}

function makeKintoneMock() {
  const calls = [];
  function urlFn(path, guest) {
    return path + '?guest=' + (guest ? '1' : '0');
  }
  const k = {};
  k.api = function (url, method, params) {
    calls.push({ url, method, params });
    if (calls.length === 1) {
      const err = new Error('invalid');
      err.code = 'CB_VA01';
      return Promise.reject(err);
    }
    return Promise.resolve({ ok: true, secondUrl: url });
  };
  k.api.url = urlFn;
  k.calls = calls;
  return k;
}

async function runGuestFallbackMock() {
  const k = makeKintoneMock();
  const out = await kintoneApiGetGuestSpaceFallback674(k, '/k/v1/records.json', { app: APP_671 });
  assert(out && out.ok === true, 'second call success');
  assert(k.calls.length === 2, 'two attempts');
  assert(k.calls[0].url.includes('guest=1'), 'first uses guest=1');
  assert(k.calls[1].url.includes('guest=0'), 'retry uses guest=0');
  const errOther = new Error('x');
  errOther.code = 'GAIA_OTHER';
  k.calls.length = 0;
  k.api = function (url, method, params) {
    k.calls.push({ url, method, params });
    return Promise.reject(errOther);
  };
  k.api.url = function (path, guest) {
    return path + '?guest=' + (guest ? '1' : '0');
  };
  let threw = false;
  try {
    await kintoneApiGetGuestSpaceFallback674(k, '/k/v1/record.json', { id: '1' });
  } catch (e) {
    threw = e && e.code === 'GAIA_OTHER';
  }
  assert(threw, 'non-CB_VA01 should not retry');
  assert(k.calls.length === 1, 'single attempt on non-CB_VA01');
  console.log('[ok] kintoneApiGetGuestSpaceFallback674 mock (CB_VA01 retry + no retry)');
}

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') return null;
  return String(v).trim();
}

async function fetch671Records(query) {
  let baseUrl = requireEnv('KINTONE_BASE_URL');
  if (!baseUrl) return { skipped: true };
  baseUrl = baseUrl.replace(/\/+$/, '').replace(/\/k$/i, '');
  const user = requireEnv('KINTONE_USERNAME');
  const pass = requireEnv('KINTONE_PASSWORD');
  if (!user || !pass) return { skipped: true };

  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
    const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
    headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  }

  const u = new URL(`${baseUrl}/k/v1/records.json`);
  u.searchParams.set('app', APP_671);
  u.searchParams.set('query', query);
  const res = await fetch(u.toString(), { method: 'GET', headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  return {
    http: res.status,
    code: json?.code,
    message: json?.message,
    recordCount: Array.isArray(json?.records) ? json.records.length : null,
  };
}

async function runLive671IfPossible() {
  const base = requireEnv('KINTONE_BASE_URL');
  if (!base) {
    console.log('[skip] live 671: KINTONE_BASE_URL なし（オフライン検証のみ）');
    return;
  }

  const queriesNew = [
    'usage_count < 5 and account_type in ("共有") order by $id asc limit 100',
    'usage_count < 5 order by $id asc limit 100',
    '$id > 0 order by $id asc limit 200',
  ];
  const queryOldSerial = 'usage_count < 5 and account_type in ("共有") order by serial_no asc limit 5';

  console.log('[live] app 671 records.json …');
  for (let i = 0; i < queriesNew.length; i++) {
    const r = await fetch671Records(queriesNew[i]);
    console.log(
      `  tier ${i}: http=${r.http} code=${r.code || '(none)'} records=${r.recordCount ?? 'n/a'}`,
    );
    if (r.http !== 200) {
      throw new Error(`live tier ${i} expected HTTP 200, got ${r.http} ${r.code || ''} ${r.message || ''}`);
    }
  }

  const old = await fetch671Records(queryOldSerial);
  console.log(
    `  compare order by serial_no (limit 5): http=${old.http} code=${old.code || '(none)'} records=${old.recordCount ?? 'n/a'}`,
  );
  if (old.http !== 200) {
    console.log('  (note) 旧クエリが 400 の環境では、$id + JS ソートへの変更が妥当です。');
  }
  console.log('[ok] live 671: 新3段クエリはすべて HTTP 200');
}

async function main() {
  runSortTests();
  await runGuestFallbackMock();
  await runLive671IfPossible();
  console.log('[pc-ledger-verify-m671-fetch-logic] すべて完了');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
