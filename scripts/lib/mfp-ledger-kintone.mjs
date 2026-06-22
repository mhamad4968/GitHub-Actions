/**
 * 複合機管理台帳 — shared REST helpers (Space 48).
 * 正本: docs/plans/2026-06-22-mfp-ledger-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

export const DB_APP_NAME = '複合機管理台帳DB';
export const DASH_APP_NAME = '複合機管理台帳';
export const SPACE_ID = Number(process.env.MFP_LEDGER_SPACE_ID || 48);
export const THREAD_ID = Number(process.env.MFP_LEDGER_THREAD_ID || 52);
export const DEFAULT_XLSX =
  process.env.MFP_LEDGER_XLSX || 'C:\\tmp\\複合機管理台帳\\複合機管理台帳.xlsx';
export const DATA_START_ROW = 3;
export const EXCEL_SHEET = '複合機一覧';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'mfp-ledger-db-fields.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'mfp-ledger-app-ids.json');
export const LOCATION_SORT_PATH = path.join(__dirname, '..', 'data', 'jbis-location-sort-master.json');

/** Excel 拠点表記 → kintone 拠点名（§6.2） */
export function mapExcelLocation(excelLoc) {
  const s = String(excelLoc || '').trim();
  if (!s || s === '〃') return '';
  if (s === '本店') return '本社';
  if (s === '株式会社ブリッジニアプラス') return '子会社（株）ブリッジニアプラス';
  if (/^関越支店（/.test(s)) return '関越支店';
  if (/^東京支店（/.test(s)) return '東京支店';
  if (/^首都圏支店（/.test(s)) return '首都圏支店';
  if (/^札幌支店（/.test(s)) return '札幌支店';
  return s;
}

export function trimField(s) {
  return String(s == null ? '' : s).trim();
}

export function normalizeMachineNo(raw) {
  const s = trimField(raw);
  if (!s || s === '不明') return '';
  return s;
}

export function formatIntroducedDate(raw) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return '';
}

export function loadLocationNames() {
  const raw = JSON.parse(readFileSync(LOCATION_SORT_PATH, 'utf8'));
  return (raw.locations || []).map((x) => x.location_name).filter(Boolean);
}

/** Parse Excel rows — passwords never logged by callers */
export function readExcelRows(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const ws = wb.Sheets[EXCEL_SHEET];
  if (!ws) throw new Error(`Sheet not found: ${EXCEL_SHEET}`);
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = [];
  let prevLoc = '';

  for (let i = DATA_START_ROW; i < data.length; i++) {
    const r = data[i] || [];
    if (!r[0] && !r[1] && !r[2] && !r[8]) continue;

    let excelLoc = trimField(r[0]);
    if (excelLoc === '〃') excelLoc = prevLoc;
    else if (excelLoc) prevLoc = excelLoc;

    const locationName = mapExcelLocation(excelLoc);
    if (!locationName) continue;

    rows.push({
      sort_no: rows.length + 1,
      location_name: locationName,
      manufacturer: trimField(r[1]),
      model_name: trimField(r[2]),
      connection_type: trimField(r[3]),
      ip_address: trimField(r[4]),
      ip_prefix: trimField(r[5]),
      admin_id: trimField(r[6]),
      admin_password: trimField(r[7]),
      machine_no: normalizeMachineNo(r[8]),
      introduced_date: formatIntroducedDate(r[9]),
      install_location: trimField(r[10]).replace(/\r\n/g, '\n'),
      contract_holder: trimField(r[11]),
      lease_contract_no: trimField(r[12]),
      note: trimField(r[13]),
    });
  }
  return rows;
}

export function rowToKintoneRecord(row, registeredDate) {
  const date = registeredDate || new Date().toISOString().slice(0, 10);
  const rec = {
    sort_no: { value: String(row.sort_no) },
    location_name: { value: row.location_name },
    manufacturer: { value: row.manufacturer },
    model_name: { value: row.model_name },
    connection_type: { value: row.connection_type },
    ip_address: { value: row.ip_address },
    ip_prefix: { value: row.ip_prefix },
    admin_id: { value: row.admin_id },
    admin_password: { value: row.admin_password },
    introduced_date: { value: row.introduced_date || undefined },
    install_location: { value: row.install_location },
    contract_holder: { value: row.contract_holder },
    lease_contract_no: { value: row.lease_contract_no },
    note: { value: row.note },
    registered_date: { value: date },
    updated_date: { value: date },
  };
  if (row.machine_no) rec.machine_no = { value: row.machine_no };
  return rec;
}

export function redactRecord(rec) {
  const o = { ...rec };
  if (o.admin_password) o.admin_password = { value: '***' };
  return o;
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
  if (!raw.properties) throw new Error('mfp-ledger-db-fields.json: missing properties');
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
