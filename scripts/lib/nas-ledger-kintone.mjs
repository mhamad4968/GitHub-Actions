/**
 * NAS管理台帳 — shared REST helpers (Space 48).
 * 正本: docs/plans/2026-06-28-nas-ledger-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

export const DB_APP_NAME = 'NAS管理台帳DB';
export const DASH_APP_NAME = 'NAS管理台帳';
export const SPACE_ID = Number(process.env.NAS_LEDGER_SPACE_ID || 48);
/** Space 48 既定スレッド（専用スレッドは作らない — spec Q9′） */
export const THREAD_ID = Number(process.env.NAS_LEDGER_THREAD_ID || process.env.SPACE48_THREAD_ID || 52);
export const DEFAULT_XLSX = process.env.NAS_LEDGER_XLSX || 'C:\\tmp\\NAS管理台帳\\NAS一覧.xlsx';
export const EXCEL_SHEET = 'NAS一覧';

/** Excel 列 index（sheet_to_json header:1 — 組織名=col B=index 1） */
const COL = {
  org: 1,
  status: 2,
  branch: 3,
  hostname: 4,
  device_type: 5,
  install: 6,
  ip: 7,
  manufacturer: 8,
  model: 9,
  capacity: 10,
  raid: 11,
  backup: 12,
  admin_id: 13,
  password: 14,
  connectivity: 15,
  note: 16,
};

function findHeaderRowIndex(data) {
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const r = data[i] || [];
    if (trimField(r[COL.org]) === '組織名' && trimField(r[COL.status]) === 'ステータス') return i;
  }
  throw new Error('Header row not found (組織名/ステータス)');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'nas-ledger-db-fields.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'nas-ledger-app-ids.json');
export const ORG_SORT_PATH = path.join(__dirname, '..', 'data', 'nas-org-sort-master.json');
export const LOCATION_SORT_PATH = path.join(__dirname, '..', 'data', 'jbis-location-sort-master.json');

export const PLACEHOLDER_ROWS = [
  {
    org_name: '鉄構支店',
    branch_name: '鉄構支店',
    install_place: '鉄構支店',
    status: '-',
    note: '設備なし',
  },
  {
    org_name: '湾岸工事所',
    branch_name: '湾岸工事所',
    install_place: '湾岸工事所',
    status: '-',
    note: '設備なし',
  },
  {
    org_name: '子会社（株）ブリッジニアプラス',
    branch_name: '子会社（株）ブリッジニアプラス',
    install_place: '子会社（株）ブリッジニアプラス',
    status: '-',
    note: '設備なし',
  },
];

export function trimField(s) {
  return String(s == null ? '' : s).trim();
}

export function normalizeOrgName(raw) {
  const s = trimField(raw).replace(/\r\n/g, '\n').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s === '本店') return '本社';
  if (s.includes('リフォーム') && s.includes('事業統括部')) return 'リフォーム事業統括部';
  return s;
}

export function normalizeBranchName(raw, prev) {
  const s = trimField(raw);
  if (!s || s === '〃') return prev || '';
  return s === '本店' ? '本社' : s;
}

export function normalizeInstallPlace(raw) {
  const s = trimField(raw);
  return s === '本店' ? '本社' : s;
}

export function normalizeModelName(raw) {
  return trimField(raw).replace(/\r\n/g, ' / ').replace(/\n/g, ' / ');
}

export function pickProductionIp(raw) {
  const s = trimField(raw);
  if (!s) return '';
  const first = s.split(/\r\n|\n/)[0];
  return trimField(first);
}

function loadSortMaps() {
  const orgRaw = JSON.parse(readFileSync(ORG_SORT_PATH, 'utf8'));
  const locRaw = JSON.parse(readFileSync(LOCATION_SORT_PATH, 'utf8'));
  const orgMap = {};
  const branchMap = {};
  (orgRaw.organizations || []).forEach((o) => {
    orgMap[o.org_name] = Number(o.sort_no);
  });
  (locRaw.locations || []).forEach((l) => {
    branchMap[l.location_name] = Number(l.sort_no);
  });
  return { orgMap, branchMap };
}

export function assignSortNumbers(rows) {
  const { orgMap, branchMap } = loadSortMaps();
  const seqByKey = {};
  return rows.map((row) => {
    const orgSort = orgMap[row.org_name] || 99;
    const branchSort = branchMap[row.branch_name] || 999;
    const key = `${row.org_name}\0${row.branch_name}`;
    seqByKey[key] = (seqByKey[key] || 0) + 1;
    const seq = seqByKey[key];
    return {
      ...row,
      sort_no: orgSort * 100000 + branchSort * 100 + seq,
    };
  });
}

/** Parse Excel rows — passwords never logged by callers */
export function readExcelRows(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const ws = wb.Sheets[EXCEL_SHEET];
  if (!ws) throw new Error(`Sheet not found: ${EXCEL_SHEET}`);
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const headerIdx = findHeaderRowIndex(data);
  const rows = [];
  let prevOrg = '';
  let prevBranch = '';

  for (let i = headerIdx + 1; i < data.length; i++) {
    const r = data[i] || [];
    const status = trimField(r[COL.status]);
    const branchRaw = r[COL.branch];
    const ip = pickProductionIp(r[COL.ip]);
    const hasData = status || ip || trimField(branchRaw) || trimField(r[COL.org]);
    if (!hasData) continue;

    let org = normalizeOrgName(r[COL.org]);
    if (org) prevOrg = org;
    else org = prevOrg;

    const branch = normalizeBranchName(branchRaw, prevBranch);
    if (branch) prevBranch = branch;

    rows.push({
      org_name: org,
      status: status || '有効',
      branch_name: branch,
      hostname: trimField(r[COL.hostname]),
      device_type: trimField(r[COL.device_type]),
      install_place: normalizeInstallPlace(r[COL.install]) || branch,
      ip_address: ip,
      manufacturer: trimField(r[COL.manufacturer]),
      model_name: normalizeModelName(r[COL.model]),
      effective_capacity: trimField(r[COL.capacity]),
      raid_level: trimField(r[COL.raid]),
      backup_type: trimField(r[COL.backup]),
      admin_id: trimField(r[COL.admin_id]),
      admin_password: trimField(r[COL.password]),
      connectivity_check: trimField(r[COL.connectivity]),
      note: trimField(r[COL.note]).replace(/\r\n/g, '\n'),
      serial_no: '',
    });
  }

  const placeholders = PLACEHOLDER_ROWS.map((p) => ({
    ...p,
    hostname: '',
    device_type: '',
    ip_address: '',
    manufacturer: '',
    model_name: '',
    effective_capacity: '',
    raid_level: '',
    backup_type: '',
    admin_id: '',
    admin_password: '',
    connectivity_check: '',
    serial_no: '',
  }));

  return assignSortNumbers(rows.concat(placeholders));
}

export function rowToKintoneRecord(row, registeredDate) {
  const date = registeredDate || new Date().toISOString().slice(0, 10);
  const rec = {
    sort_no: { value: String(row.sort_no) },
    org_name: { value: row.org_name },
    status: { value: row.status },
    branch_name: { value: row.branch_name },
    install_place: { value: row.install_place },
    note: { value: row.note || '' },
    registered_date: { value: date },
    updated_date: { value: date },
  };

  function set(code, v) {
    if (v != null && v !== '') rec[code] = { value: v };
  }

  set('hostname', row.hostname);
  set('device_type', row.device_type);
  set('ip_address', row.ip_address);
  set('manufacturer', row.manufacturer);
  set('model_name', row.model_name);
  set('serial_no', row.serial_no);
  set('effective_capacity', row.effective_capacity);
  set('raid_level', row.raid_level);
  set('backup_type', row.backup_type);
  set('admin_id', row.admin_id);
  set('admin_password', row.admin_password);
  set('connectivity_check', row.connectivity_check);
  return rec;
}

export function redactRecord(rec) {
  const o = { ...rec };
  if (o.admin_password) o.admin_password = { value: '***' };
  return o;
}

export function loadOrgNames() {
  const raw = JSON.parse(readFileSync(ORG_SORT_PATH, 'utf8'));
  return (raw.organizations || []).map((x) => x.org_name).filter(Boolean);
}

export function loadLocationNames() {
  const raw = JSON.parse(readFileSync(LOCATION_SORT_PATH, 'utf8'));
  return (raw.locations || []).map((x) => x.location_name).filter(Boolean);
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
  if (!raw.properties) throw new Error('nas-ledger-db-fields.json: missing properties');
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

export async function setEveryoneAcl(baseUrl, headers, appId) {
  const body = {
    app: String(appId),
    rights: [
      {
        entity: { type: 'GROUP', code: 'everyone' },
        appEditable: false,
        recordViewable: true,
        recordAddable: true,
        recordEditable: true,
        recordDeletable: true,
        recordImportable: true,
        recordExportable: true,
      },
    ],
  };
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/acl.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return j.revision;
}
