/**
 * Apple ID kintone — shared REST helpers (Space 21).
 * 正本: docs/plans/2026-06-02-apple-id-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DB_APP_NAME = 'Apple ID管理台帳用DB';
export const DASH_APP_NAME = 'Apple ID管理台帳';
export const SPACE_ID = Number(process.env.APPLE_ID_SPACE_ID || 21);
export const THREAD_ID = Number(process.env.APPLE_ID_THREAD_ID || 23);
export const DEFAULT_XLSX =
  process.env.APPLE_ID_XLSX ||
  'C:\\tmp\\appleID管理一覧\\apple_ID一覧20210106.xlsx';
export const FIXED_PASSWORD = 'Honten00';
export const FIXED_LOCK = '2511';
export const STATUS_ACTIVE = '利用中';
export const JBIS_START = 39;
export const JBIS_SKIP_UNTIL = 38;
export const JBIS_POOL_MAX = 933;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'apple-id-db-fields.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'apple-id-app-ids.json');

export function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

export function getKintoneConfig() {
  let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '');
  baseUrl = baseUrl.replace(/\/k$/i, '');
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
  return { baseUrl, headers };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson(url, init) {
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
    throw new Error(`HTTP ${res.status} ${msg}`.trim());
  }
  return json;
}

export async function waitDeploy(baseUrl, headers, appNum) {
  const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set('apps[0]', String(appNum));
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === 'SUCCESS') return;
    if (status === 'FAIL' || status === 'CANCEL') throw new Error(`Deploy status: ${status}`);
    await sleep(1000);
  }
  throw new Error('Deploy timed out.');
}

export async function deployApp(baseUrl, headers, appId, revision) {
  const body = revision != null ? { apps: [{ app: appId, revision }] } : { apps: [{ app: appId }] };
  await fetchJson(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  await waitDeploy(baseUrl, headers, appId);
}

export async function findAppByName(baseUrl, headers, name) {
  const found = await fetchJson(`${baseUrl}/k/v1/apps.json`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({ name }),
  });
  return (found.apps || []).find((a) => a.name === name) || null;
}

export function loadFieldProperties() {
  const raw = JSON.parse(readFileSync(FIELDS_PATH, 'utf8'));
  if (!raw.properties) throw new Error('apple-id-db-fields.json: missing properties');
  return raw.properties;
}

export function loadAppIds() {
  if (!existsSync(STATE_PATH)) return { dbAppId: null, dashAppId: null };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function saveAppIds(ids) {
  writeFileSync(STATE_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}

export function normalizeUserName(family, given) {
  const f = family != null ? String(family).trim() : '';
  const g = given != null ? String(given).trim() : '';
  if (f && g) return `${f}\u3000${g}`.replace(/\u3000+/g, '\u3000');
  if (f) return f;
  if (g) return g;
  return '';
}

export function normalizeDeviceType(raw) {
  const s = raw != null ? String(raw).trim() : '';
  if (!s) return '';
  const lower = s.toLowerCase();
  if (lower === 'iphone') return 'iPhone';
  if (lower === 'ipad') return 'iPad';
  if (s === 'その他') return 'その他';
  return 'その他';
}

export async function recordCount(baseUrl, headers, appId) {
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent('order by legacy_no asc limit 1')}&totalCount=true`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return Number(j.totalCount || 0);
}

export function parseJbisNumber(appleId) {
  const m = String(appleId || '').match(/^jbis\.(\d+)@icloud\.com$/i);
  return m ? Number(m[1]) : null;
}

export function formatJbis(n) {
  return `jbis.${String(n).padStart(3, '0')}@icloud.com`;
}

function readField(rec, code) {
  if (!rec) return '';
  const v = rec[code];
  if (v != null && typeof v === 'object' && 'value' in v) return v.value;
  return v;
}

/** SPEC §6: 起点 039。未割当プール（氏名空・利用中）を昇順で返す。 */
export function nextJbisSlot(records) {
  let best = null;
  for (const rec of records || []) {
    const appleId = String(readField(rec, 'apple_id') || '').trim();
    const n = parseJbisNumber(appleId);
    if (n == null || n < JBIS_START) continue;
    if (String(readField(rec, 'user_name') || '').trim()) continue;
    const status = String(readField(rec, 'status') || STATUS_ACTIVE);
    if (status !== STATUS_ACTIVE) continue;
    if (!best || n < best.n) {
      best = {
        n,
        apple_id: appleId,
        id: readField(rec, '$id') || readField(rec, 'id') || null,
        revision: readField(rec, '$revision') || readField(rec, 'revision') || null,
        isNew: false,
      };
    }
  }
  if (best) return best;

  const used = new Set();
  for (const rec of records || []) {
    const n = parseJbisNumber(readField(rec, 'apple_id'));
    if (n != null) used.add(n);
  }
  for (let n = JBIS_START; n <= 999; n += 1) {
    if (!used.has(n)) {
      return { n, apple_id: formatJbis(n), id: null, revision: null, isNew: true };
    }
  }
  throw new Error('jbis slot exhausted (039-999)');
}
