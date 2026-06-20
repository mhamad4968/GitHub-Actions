/**
 * VPN アカウント管理台帳 — shared REST helpers (Space 48).
 * 正本: docs/plans/2026-06-16-vpn-account-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DB_APP_NAME = 'VPNアカウント管理台帳用DB';
export const DASH_APP_NAME = 'VPNアカウント台帳';
export const SPACE_ID = Number(process.env.VPN_ACCOUNT_SPACE_ID || process.env.SPACE48_SPACE_ID || 48);
export const THREAD_ID = Number(process.env.VPN_ACCOUNT_THREAD_ID || process.env.SPACE48_THREAD_ID || 52);
export const DEFAULT_XLSX =
  process.env.VPN_ACCOUNT_XLSX || 'C:\\tmp\\VPNアカウント管理\\VPNアカウント管理.xlsx';
export const VPN_DOMAIN = '@kensetsutoso.fre';
export const VPN_DOMAINS = {
  FRE: '@kensetsutoso.fre',
  DS: '@kensetsutoso.ds.fre',
  BNP: '@bnp001',
};
export const VPN_DOMAIN_LIST = [VPN_DOMAINS.FRE, VPN_DOMAINS.DS, VPN_DOMAINS.BNP];
export const DEPT_CAPITAL = '首都圏支店';
export const DEPT_BNP = 'BNP';
export const NEXT_USER_NUM_BY_DOMAIN = {
  [VPN_DOMAINS.FRE]: 80,
  [VPN_DOMAINS.DS]: 36,
  [VPN_DOMAINS.BNP]: 1,
};
export const NEXT_USER_NUM_START = 80;
export const RECORD_KIND_SETTING = '設定';
export const RECORD_KIND_LICENSE_SNAPSHOT = '月次集計';
export const LICENSE_UNIT_YEN = 550;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'vpn-account-db-fields.json');
export const DEPTS_PATH = path.join(__dirname, '..', 'data', 'vpn-account-depts.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'vpn-account-app-ids.json');

export function loadDeptList() {
  return JSON.parse(readFileSync(DEPTS_PATH, 'utf8'));
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
  if (!raw.properties) throw new Error('vpn-account-db-fields.json: missing properties');
  return raw.properties;
}

export function loadAppIds() {
  if (!existsSync(STATE_PATH)) return { dbAppId: null, dashAppId: null };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function saveAppIds(ids) {
  writeFileSync(STATE_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}

export async function recordCount(baseUrl, headers, appId, query) {
  const q = query || 'order by $id asc limit 1';
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}&totalCount=true`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return Number(j.totalCount || 0);
}

export function trimCell(s) {
  return String(s == null ? '' : s).trim();
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

export function formatUserVpnId(num, domain = VPN_DOMAINS.FRE) {
  const n = Number(num);
  if (domain === VPN_DOMAINS.FRE) {
    return `user${String(n).padStart(3, '0')}${domain}`;
  }
  const local = n >= 1 && n <= 9 ? String(n).padStart(2, '0') : String(n);
  return `user${local}${domain}`;
}

export function domainForDept(dept) {
  const d = String(dept || '').trim();
  if (d === DEPT_CAPITAL) return VPN_DOMAINS.DS;
  if (d === DEPT_BNP) return VPN_DOMAINS.BNP;
  return VPN_DOMAINS.FRE;
}

export function inferDomainFromVpnId(vpnId) {
  const s = String(vpnId || '').trim().toLowerCase();
  if (s.endsWith('@kensetsutoso.ds.fre')) return VPN_DOMAINS.DS;
  if (s.endsWith('@bnp001')) return VPN_DOMAINS.BNP;
  return VPN_DOMAINS.FRE;
}

export function settingsVpnId(domain) {
  return `__vpn_settings__${domain}`;
}

export function snapshotVpnIdForMonth(ym) {
  return `__license_snapshot_${String(ym).replace(/-/g, '')}__all`;
}
