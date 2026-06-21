/**
 * トータルネットワーク ネットワーク管理 — shared REST helpers (Space 48).
 * 正本: docs/plans/2026-06-21-total-network-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DB_APP_NAME = 'トータルネットワークネットワーク管理DB';
export const DASH_APP_NAME = 'トータルネットワークネットワーク管理台帳';
export const SPACE_ID = Number(process.env.TOTAL_NETWORK_SPACE_ID || process.env.SPACE48_SPACE_ID || 48);
export const THREAD_ID = Number(process.env.TOTAL_NETWORK_THREAD_ID || process.env.SPACE48_THREAD_ID || 52);
export const DEFAULT_XLSX =
  process.env.TOTAL_NETWORK_XLSX ||
  'C:\\tmp\\トータルネットワークのネットワーク情報管理台帳\\トータルネットワークのネットワーク情報管理台帳.xlsx';

export const RECORD_TYPE_SITE = 'site';
export const RECORD_TYPE_IP = 'ip';
export const RECORD_TYPE_DEVICE_TYPE = 'device_type';
export const IP_STATUS_IN_USE = '使用中';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'total-network-db-fields.json');
export const LOCATIONS_PATH = path.join(__dirname, '..', 'data', 'jbis-location-sort-master.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'total-network-app-ids.json');

export function loadLocations() {
  const raw = JSON.parse(readFileSync(LOCATIONS_PATH, 'utf8'));
  return raw.locations || [];
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
  if (!raw.properties) throw new Error('total-network-db-fields.json: missing properties');
  return raw.properties;
}

export function loadAppIds() {
  if (!existsSync(STATE_PATH)) return { dbAppId: null, dashAppId: null };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function saveAppIds(ids) {
  writeFileSync(STATE_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}

export function trimCell(s) {
  return String(s == null ? '' : s).trim();
}

export function stripLocationPrefix(name) {
  return trimCell(name).replace(/^\(株\)J-BISメンテナンス[　\s]+/, '').replace(/^（株\)J-BISメンテナンス[　\s]+/, '');
}

export function parseIpRange(text) {
  const s = trimCell(text).replace(/[〜~～]/g, '～');
  const m = s.match(/^(\d+\.\d+\.\d+\.\d+)\s*～\s*(\d+\.\d+\.\d+\.\d+)$/);
  if (!m) return { start: '', end: '' };
  return { start: m[1], end: m[2] };
}

export function ipToLong(ip) {
  const p = String(ip).split('.').map((x) => Number(x));
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

export function longToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function enumerateIpRange(start, end) {
  const a = ipToLong(start);
  const b = ipToLong(end);
  if (a == null || b == null || a > b) return [];
  const out = [];
  for (let i = a; i <= b; i++) out.push(longToIp(i));
  return out;
}

/** Excel「IP数」列と同型: 範囲内 IP 数（終端−始端+1）− 1 */
export function computeIpCountFromRange(start, end) {
  const ips = enumerateIpRange(start, end);
  if (!ips.length) return '';
  return String(Math.max(0, ips.length - 1));
}

export const DEVICE_TYPE_SEED = [
  { sort_no: 1, device_type_code: 'notebook_pc', device_type_label: 'ノートPC' },
  { sort_no: 2, device_type_code: 'nas', device_type_label: 'NAS' },
  { sort_no: 3, device_type_code: 'ap', device_type_label: 'AP' },
  { sort_no: 4, device_type_code: 'mfp', device_type_label: '複合機' },
  { sort_no: 5, device_type_code: 'other', device_type_label: 'その他' },
];

export function labelToDeviceTypeCode(label) {
  const hit = DEVICE_TYPE_SEED.find((d) => d.device_type_label === label);
  return hit ? hit.device_type_label : label;
}
