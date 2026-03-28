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
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* noop */ }
  if (!res.ok) {
    const detail = json?.errors ? ` errors=${JSON.stringify(json.errors)}` : '';
    const msg = json?.code || json?.message
      ? `${json.code || ''} ${json.message || ''}${detail}`.trim()
      : text.slice(0, 800);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

const APP_595 = 595;
const FC_595_LEDGER_CREATED = 'ledger_created';
const FC_595_LEDGER_RECORD_ID = 'ledger_record_id';

async function getFieldTypes() {
  // Use "current (deployed)" form definition to determine clear values correctly.
  const url = new URL(`${baseUrl}/k/v1/app/form/fields.json`);
  url.searchParams.set('app', String(APP_595));
  const { 'Content-Type': _ct, ...headersNoCt } = headers;
  const json = await fetchJson(url, { method: 'GET', headers: headersNoCt });
  const props = json.properties || {};
  return {
    [FC_595_LEDGER_CREATED]: props[FC_595_LEDGER_CREATED]?.type || null,
    [FC_595_LEDGER_RECORD_ID]: props[FC_595_LEDGER_RECORD_ID]?.type || null,
  };
}

function clearValueForType(type) {
  // Return the correct "empty" value for kintone record update.
  // Unknown type falls back to empty string.
  if (!type) return '';
  if (type === 'CHECK_BOX' || type === 'MULTI_SELECT') return [];
  if (type === 'NUMBER') return null;
  // For single-value selectors, empty string clears selection.
  if (type === 'DROP_DOWN' || type === 'RADIO_BUTTON' || type === 'SINGLE_SELECT') return '';
  // For text/date/time, empty string clears.
  return '';
}

const fieldTypes = await getFieldTypes();

async function getIdsBatch(offset) {
  const params = new URLSearchParams();
  params.set('app', String(APP_595));
  params.set('query', `order by $id asc limit 200 offset ${offset}`);
  params.set('fields[0]', '$id');
  const url = new URL(`${baseUrl}/k/v1/records.json?${params.toString()}`);
  const { 'Content-Type': _ct, ...headersNoCt } = headers;
  const json = await fetchJson(url, { method: 'GET', headers: headersNoCt });
  return (json.records || []).map((r) => Number(r.$id.value)).filter(Number.isFinite);
}

async function bulkReset(ids) {
  if (!ids.length) return;
  const url = new URL(`${baseUrl}/k/v1/records.json`);
  const vLedgerCreated = clearValueForType(fieldTypes[FC_595_LEDGER_CREATED]);
  const vLedgerRecordId = clearValueForType(fieldTypes[FC_595_LEDGER_RECORD_ID]);
  const records = ids.map((id) => ({
    id,
    record: {
      [FC_595_LEDGER_CREATED]: { value: vLedgerCreated },
      [FC_595_LEDGER_RECORD_ID]: { value: vLedgerRecordId },
    },
  }));
  try {
    await fetchJson(url, { method: 'PUT', headers, body: JSON.stringify({ app: APP_595, records }) });
  } catch (e) {
    console.error('[reset595] bulk reset failed. trying per-record to pinpoint...');
    // pinpoint which record fails (and surface kintone errors)
    for (const r of records) {
      try {
        await fetchJson(url, { method: 'PUT', headers, body: JSON.stringify({ app: APP_595, records: [r] }) });
      } catch (one) {
        console.error('[reset595] failed record', { id: r.id, error: String(one) });
        throw one;
      }
    }
    throw e;
  }
}

let offset = 0;
let total = 0;
for (;;) {
  const ids = await getIdsBatch(offset);
  if (!ids.length) break;
  // Smaller batch to reduce validation ambiguity
  for (let i = 0; i < ids.length; i += 50) {
    const part = ids.slice(i, i + 50);
    await bulkReset(part);
    total += part.length;
    console.log(`[reset595] reset ${part.length}, total=${total}`);
  }
  offset += ids.length;
}

console.log(`[reset595] done total=${total}`);

