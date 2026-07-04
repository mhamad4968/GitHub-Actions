/**
 * JREクラウドアカウント台帳 — shared REST helpers (Space 34).
 * 正本: docs/plans/2026-06-26-jre-cloud-account-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveXlsx } from './closed-v1-migration-xlsx.mjs';

export const DB_APP_NAME = 'JREクラウドアカウント管理台帳用DB';
export const DASH_APP_NAME = 'JREクラウドアカウント台帳';
export const SPACE_ID = Number(process.env.JRE_CLOUD_SPACE_ID || 34);
export const THREAD_NAME = process.env.JRE_CLOUD_THREAD_NAME || 'JREクラウドアカウント';
export const DEFAULT_XLSX =
  process.env.JRE_CLOUD_XLSX || archiveXlsx('JREクラウドアカウント一覧.xlsx');
export const SHEET_MASTER = 'JREｸﾗｳﾄﾞ全社user';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'jre-cloud-account-db-fields.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'jre-cloud-account-app-ids.json');
export const ORGS_PATH = path.join(__dirname, '..', 'data', 'jre-cloud-account-orgs.json');
export const DEPTS_PATH = path.join(__dirname, '..', 'data', 'jre-cloud-account-depts.json');
export const GROUP595_PATH = path.join(__dirname, '..', 'data', 'jre-cloud-account-group595-to-org.json');

export function loadJsonArray(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function loadGroup595Map() {
  return JSON.parse(readFileSync(GROUP595_PATH, 'utf8'));
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
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (n > 40000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const dt = new Date(epoch.getTime() + n * 86400000);
      return formatDateYmd(dt);
    }
  }
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

export async function resolveThreadId(baseUrl, headers) {
  if (process.env.JRE_CLOUD_THREAD_ID) return Number(process.env.JRE_CLOUD_THREAD_ID);
  try {
    const j = await fetchJson(`${baseUrl}/k/v1/space/thread/add.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ space: SPACE_ID, name: THREAD_NAME }),
    });
    const id = Number(j.id || j.thread || j.threadId);
    if (id) {
      console.log(`[jre-cloud] created thread id=${id} name=${THREAD_NAME}`);
      return id;
    }
  } catch (e) {
    console.warn('[jre-cloud] thread/add skipped:', e.message || e);
  }
  const fallback = Number(process.env.JRE_CLOUD_THREAD_FALLBACK || 38);
  console.log(`[jre-cloud] using thread fallback=${fallback}`);
  return fallback;
}

export function loadFieldProperties() {
  const raw = JSON.parse(readFileSync(FIELDS_PATH, 'utf8'));
  if (!raw.properties) throw new Error('jre-cloud-account-db-fields.json: missing properties');
  return raw.properties;
}

export function loadAppIds() {
  if (!existsSync(STATE_PATH)) return { dbAppId: null, dashAppId: null, threadId: null };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function saveAppIds(ids) {
  writeFileSync(STATE_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}

export async function recordCount(baseUrl, headers, appId) {
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent('order by user_id asc limit 1')}&totalCount=true`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return Number(j.totalCount || 0);
}

export function trimCell(s) {
  return String(s == null ? '' : s).trim();
}
