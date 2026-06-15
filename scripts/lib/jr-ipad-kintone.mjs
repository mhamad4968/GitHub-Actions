/**
 * JR iPad 台帳 — shared REST helpers (Space 34).
 * 正本: docs/plans/2026-06-15-jr-ipad-ledger-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DB_APP_NAME = 'JRシステム用iPad台帳DB';
export const DASH_APP_NAME = 'JRシステム用iPad管理台帳 ver.1';
export const SPACE_ID = Number(process.env.JR_IPAD_SPACE_ID || 34);
export const THREAD_ID = Number(process.env.JR_IPAD_THREAD_ID || 38);
export const DEFAULT_XLSX =
  process.env.JR_IPAD_XLSX || 'C:\\tmp\\JRシステム用iPad管理台帳\\JRシステム用iPad.xlsx';

export const STATUS_VALUES = ['待機', '貸出中', '確認中', '故障', '廃棄'];
export const PURCHASE_VENDORS = ['au', 'ドコモ', 'ソフトバンク'];

/** §8 — Wi-Fi 718/719 同名・同順（sort 1〜22） */
export const MGMT_DEPTS = [
  { sort_no: 1, name: '本社' },
  { sort_no: 2, name: '東北支店' },
  { sort_no: 3, name: '秋田営業所' },
  { sort_no: 4, name: '盛岡営業所' },
  { sort_no: 5, name: '仙台営業所' },
  { sort_no: 6, name: '関越支店' },
  { sort_no: 7, name: '新潟営業所' },
  { sort_no: 8, name: '長野営業所' },
  { sort_no: 9, name: '高崎営業所' },
  { sort_no: 10, name: '東京支店' },
  { sort_no: 11, name: '千葉営業所' },
  { sort_no: 12, name: '水戸営業所' },
  { sort_no: 13, name: '鎌ヶ谷事務所' },
  { sort_no: 14, name: '東海支店' },
  { sort_no: 15, name: '東京営業所' },
  { sort_no: 16, name: '静岡営業所' },
  { sort_no: 17, name: '名古屋営業所' },
  { sort_no: 18, name: '関西営業所' },
  { sort_no: 19, name: '札幌支店' },
  { sort_no: 20, name: '首都圏支店' },
  { sort_no: 21, name: '鉄構支店' },
  { sort_no: 22, name: '湾岸工事所' },
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'jr-ipad-db-fields.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'jr-ipad-app-ids.json');

export function deptSortNo(name) {
  const hit = MGMT_DEPTS.find((d) => d.name === String(name || '').trim());
  return hit ? hit.sort_no : null;
}

export function normalizePhoneDigits(s) {
  return String(s == null ? '' : s)
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/\D/g, '');
}

export function normalizeModel(s) {
  return String(s == null ? '' : s).normalize('NFKC').trim();
}

export function formatDateYmd(v) {
  if (!v) return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

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
  if (!raw.properties) throw new Error('jr-ipad-db-fields.json: missing properties');
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

export function trimCell(s) {
  return String(s == null ? '' : s).trim();
}

export function isDeviceRow(deviceName) {
  const d = trimCell(deviceName);
  return /^JBIS\d{3}$/i.test(d) || /^kent\d+$/i.test(d);
}
