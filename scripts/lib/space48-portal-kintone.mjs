/**
 * システム推進室ポータル — kintone REST helpers (Space 48).
 * 正本: docs/plans/2026-06-11-space48-portal-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PORTAL_APP_NAME = 'システム推進室ポータル';
export const SPACE_ID = Number(process.env.SPACE48_SPACE_ID || 48);
export const THREAD_ID = Number(process.env.SPACE48_THREAD_ID || 52);

/** R14 — seed JSON 短 code → kintone REST 用日本語キー（R13 正本: kintone-subtable-dropdown-keys.md） */
export const PORTAL_TAB_KINTONE = {
  bi: '業務改善提案',
  ledger: '台帳',
  ops: '運用',
  info: '情報',
  other: 'その他',
};

export const PORTAL_LINK_TYPE_KINTONE = {
  app: 'アプリ',
  space: 'スペース',
  external: 'URL',
  url: 'URL',
};

export function portalTabKintone(shortOrLabel) {
  return PORTAL_TAB_KINTONE[shortOrLabel] || shortOrLabel;
}

export function portalLinkTypeKintone(shortOrLabel) {
  return PORTAL_LINK_TYPE_KINTONE[shortOrLabel] || shortOrLabel;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'space48-portal-fields.json');
export const SEED_PATH = path.join(__dirname, '..', 'data', 'space48-portal-seed.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'space48-portal-app-ids.json');

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
  if (!raw.properties) throw new Error('space48-portal-fields.json: missing properties');
  return raw.properties;
}

export function loadSeedRows() {
  const raw = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  if (!Array.isArray(raw.links)) throw new Error('space48-portal-seed.json: missing links array');
  return raw.links;
}

export function loadAppIds() {
  if (!existsSync(STATE_PATH)) return { spaceId: SPACE_ID, threadId: THREAD_ID, portalAppId: null };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function saveAppIds(ids) {
  writeFileSync(STATE_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}
