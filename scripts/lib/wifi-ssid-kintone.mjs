/**
 * Wi-Fi SSID kintone — shared REST helpers (Space 21).
 * 正本: docs/plans/2026-06-14-wifi-ssid-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DB_APP_NAME = '社内Wi-Fi管理DB';
export const DASH_APP_NAME = '社内Wi-Fi管理台帳 ver.1';
export const SPACE_ID = Number(process.env.WIFI_SSID_SPACE_ID || process.env.APPLE_ID_SPACE_ID || 21);
export const THREAD_ID = Number(process.env.WIFI_SSID_THREAD_ID || process.env.APPLE_ID_THREAD_ID || 23);
export const DEFAULT_XLSX =
  process.env.WIFI_SSID_XLSX ||
  'C:\\tmp\\社内Wi-FiのSSID情報管理台帳\\Wi-Fi情報一覧(20260205現在).xlsx';
export const MIGRATION_REGISTERED_DATE = '2026-02-05';
export const EQUIPMENT_NONE = '設備なし';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'wifi-ssid-db-fields.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'wifi-ssid-app-ids.json');

/** §6.3 — 22 records (excelLoc = Excel block label) */
export const MIGRATION_RECORDS = [
  { sort_no: 11, location_name: '本社', excelLoc: '本社' },
  { sort_no: 12, location_name: '東北支店', excelLoc: '東北支店・仙台営業所' },
  { sort_no: 13, location_name: '秋田営業所', excelLoc: '秋田営業所' },
  { sort_no: 14, location_name: '盛岡営業所', excelLoc: '盛岡営業所' },
  { sort_no: 15, location_name: '仙台営業所', excelLoc: '東北支店・仙台営業所' },
  { sort_no: 16, location_name: '関越支店', excelLoc: '関越支店' },
  { sort_no: 17, location_name: '新潟営業所', excelLoc: '新潟営業所' },
  { sort_no: 18, location_name: '長野営業所', excelLoc: '長野営業所' },
  { sort_no: 19, location_name: '高崎営業所', excelLoc: '高崎営業所' },
  { sort_no: 20, location_name: '東京支店', excelLoc: '東京支店' },
  { sort_no: 21, location_name: '千葉営業所', excelLoc: '千葉営業所' },
  { sort_no: 22, location_name: '水戸営業所', excelLoc: '水戸営業所', equipmentNone: true },
  { sort_no: 223, location_name: '鎌ヶ谷事務所', excelLoc: '鎌ヶ谷事務所', equipmentNone: true },
  { sort_no: 24, location_name: '東海支店', excelLoc: '東海支店' },
  { sort_no: 25, location_name: '東京営業所', excelLoc: '東京営業所' },
  { sort_no: 26, location_name: '静岡営業所', excelLoc: '静岡営業所' },
  { sort_no: 27, location_name: '名古屋営業所', excelLoc: '名古屋営業所' },
  { sort_no: 28, location_name: '関西営業所', excelLoc: '関西営業所' },
  { sort_no: 29, location_name: '札幌支店', excelLoc: '札幌支店' },
  { sort_no: 30, location_name: '首都圏支店', excelLoc: '首都圏支店' },
  { sort_no: 31, location_name: '鉄構支店', excelLoc: '鉄構支店' },
  { sort_no: 32, location_name: '湾岸工事所', excelLoc: '湾岸工事所' },
];

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
  if (!raw.properties) throw new Error('wifi-ssid-db-fields.json: missing properties');
  return raw.properties;
}

export function loadAppIds() {
  if (!existsSync(STATE_PATH)) return { dbAppId: null, dashAppId: null };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function saveAppIds(ids) {
  writeFileSync(STATE_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}

export async function recordCount(baseUrl, headers, appId) {
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent('order by sort_no asc limit 1')}&totalCount=true`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return Number(j.totalCount || 0);
}

export function trimCredential(s) {
  return String(s == null ? '' : s).trim();
}
