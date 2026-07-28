/**
 * 東海支店 iPad 台帳 — shared REST helpers (Space 32 / thread 34)
 * 正本: docs/plans/2026-07-28-tokai-ipad-ledger-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DB_APP_NAME = '東海支店iPad台帳DB';
export const DASH_APP_NAME = '東海支店iPad管理台帳';
export const SPACE_ID = Number(process.env.TOKAI_IPAD_SPACE_ID || 32);
export const THREAD_ID = Number(process.env.TOKAI_IPAD_THREAD_ID || 34);

export const STATUS_VALUES = ['有効', '廃棄'];
export const LOCATIONS = ['東海支店', '東京営業所', '静岡営業所', '名古屋営業所', '関西営業所'];

export const DEFAULT_XLSX =
  process.env.TOKAI_IPAD_XLSX ||
  'C:\\tmp\\東海支店iPad管理台帳\\iPad管理台帳（26.7～）.xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'tokai-ipad-db-fields.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'tokai-ipad-app-ids.json');

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
  if (!raw.properties) throw new Error('tokai-ipad-db-fields.json: missing properties');
  return raw.properties;
}

export function loadAppIds() {
  if (!existsSync(STATE_PATH)) return { dbAppId: null, dashAppId: null, spaceId: SPACE_ID, threadId: THREAD_ID };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function saveAppIds(ids) {
  const next = {
    spaceId: SPACE_ID,
    threadId: THREAD_ID,
    dbAppName: DB_APP_NAME,
    dashAppName: DASH_APP_NAME,
    ...ids,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(STATE_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

/** Dash REST 用: tokai も DB に書込可。UI は customize で禁止 */
export function buildTokaiIpadDbAclRights() {
  return [
    {
      entity: { type: 'USER', code: 'admin' },
      includeSubs: false,
      appEditable: true,
      recordViewable: true,
      recordAddable: true,
      recordEditable: true,
      recordDeletable: true,
      recordImportable: true,
      recordExportable: true,
    },
    {
      entity: { type: 'USER', code: 'tokai' },
      includeSubs: false,
      appEditable: false,
      recordViewable: true,
      recordAddable: true,
      recordEditable: true,
      recordDeletable: true,
      recordImportable: false,
      recordExportable: true,
    },
    {
      entity: { type: 'GROUP', code: 'everyone' },
      includeSubs: false,
      appEditable: false,
      recordViewable: false,
      recordAddable: false,
      recordEditable: false,
      recordDeletable: false,
      recordImportable: false,
      recordExportable: false,
    },
  ];
}

export function buildTokaiIpadDashAclRights() {
  return [
    {
      entity: { type: 'USER', code: 'admin' },
      includeSubs: false,
      appEditable: true,
      recordViewable: true,
      recordAddable: true,
      recordEditable: true,
      recordDeletable: true,
      recordImportable: true,
      recordExportable: true,
    },
    {
      entity: { type: 'USER', code: 'tokai' },
      includeSubs: false,
      appEditable: false,
      recordViewable: true,
      recordAddable: true,
      recordEditable: true,
      recordDeletable: true,
      recordImportable: false,
      recordExportable: true,
    },
    {
      entity: { type: 'GROUP', code: 'everyone' },
      includeSubs: false,
      appEditable: false,
      recordViewable: false,
      recordAddable: false,
      recordEditable: false,
      recordDeletable: false,
      recordImportable: false,
      recordExportable: false,
    },
  ];
}

export async function setAppAcl(baseUrl, headers, appId, rights) {
  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/acl.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: String(appId), rights }),
  });
  await deployApp(baseUrl, headers, appId, res.revision);
  return res.revision;
}

export function trimCell(s) {
  return String(s == null ? '' : s).trim();
}

export function normalizeUserName(s) {
  return trimCell(s).normalize('NFKC').replace(/\s+/g, '　');
}

export function formatDateYmd(v) {
  if (!v && v !== 0) return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    // Excel serial (1900 date system)
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + Math.round(v) * 86400000;
    const dt = new Date(ms);
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

export async function recordCount(baseUrl, headers, appId) {
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent('limit 1')}&totalCount=true`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return Number(j.totalCount || 0);
}

export function parseTokaiSeq(deviceName) {
  const m = /^tokai(\d+)$/i.exec(trimCell(deviceName));
  return m ? Number(m[1]) : null;
}

export function formatTokaiDeviceName(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 1) throw new Error(`invalid tokai seq: ${n}`);
  return `tokai${String(num).padStart(2, '0')}`;
}

/** 674 PC台帳 — 稼働対象外（new-pc-ledger と同義） */
export const PC_STATUS_INACTIVE_674 = ['廃棄', '取消'];
export const PC_STATUS_IN_USE_674 = '利用中';

export function isPcStatusInactive674(status) {
  const s = trimCell(status);
  return PC_STATUS_INACTIVE_674.includes(s);
}

/**
 * 同氏名で 674 が複数ヒットしたときの AI チーム判定ルール:
 * 1) pc_status が 廃棄/取消 の行は除外
 * 2) 残りの中に 利用中 があれば 利用中のみに絞る
 * 3) 1件 → 採用 / 0件 → NO_HIT / 2件以上 → MULTI_HIT（浜田相談）
 *
 * @param {Array} rows kintone records（pc_status / $id / m365_* / vpn_* を含む想定）
 * @returns {{ code: 'OK'|'NO_HIT'|'MULTI_HIT', record?: object, candidates?: object[], discardedInactive?: number }}
 */
export function resolvePcLedgerCredentialHits(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return { code: 'NO_HIT', discardedInactive: 0 };

  const active = [];
  let discardedInactive = 0;
  for (const r of list) {
    const st = r?.pc_status?.value != null ? String(r.pc_status.value) : r?.pc_status != null ? String(r.pc_status) : '';
    if (isPcStatusInactive674(st)) {
      discardedInactive += 1;
      continue;
    }
    active.push(r);
  }

  if (!active.length) return { code: 'NO_HIT', discardedInactive };

  const inUse = active.filter((r) => {
    const st = r?.pc_status?.value != null ? String(r.pc_status.value).trim() : String(r?.pc_status || '').trim();
    return st === PC_STATUS_IN_USE_674;
  });
  const preferred = inUse.length ? inUse : active;

  if (preferred.length === 1) {
    return { code: 'OK', record: preferred[0], discardedInactive, narrowedToInUse: inUse.length > 0 };
  }
  return { code: 'MULTI_HIT', candidates: preferred, discardedInactive, narrowedToInUse: inUse.length > 0 };
}

