/**
 * メーリングリスト kintone — shared REST helpers (Space 48).
 * 正本: docs/plans/2026-06-29-mailing-list-kintone-spec.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

export const DB_APP_NAME = 'メーリングリストDB';
export const DASH_APP_NAME = 'メーリングリスト台帳';
export const SPACE_ID = Number(process.env.MAILING_LIST_SPACE_ID || 48);
export const THREAD_ID = Number(process.env.MAILING_LIST_THREAD_ID || 52);
export const DEFAULT_XLSX =
  process.env.MAILING_LIST_XLSX || 'C:\\tmp\\メーリングリスト一覧\\メーリングリスト一覧.xlsx';
export const STATUS_ACTIVE = '有効';
export const STATUS_DELETED = '削除';
export const LIST_DOMAIN = '@j-bis.co.jp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FIELDS_PATH = path.join(__dirname, '..', 'data', 'mailing-list-db-fields.json');
export const DEPT_PATH = path.join(__dirname, '..', 'data', 'mailing-list-dept-master.json');
export const STATE_PATH = path.join(__dirname, '..', 'data', 'mailing-list-app-ids.json');

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
  if (!raw.properties) throw new Error('mailing-list-db-fields.json: missing properties');
  return raw.properties;
}

export function loadDeptMaster() {
  const raw = JSON.parse(readFileSync(DEPT_PATH, 'utf8'));
  return raw.departments || [];
}

export function loadAppIds() {
  if (!existsSync(STATE_PATH)) return { dbAppId: null, dashAppId: null, spaceId: SPACE_ID, threadId: THREAD_ID };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

export function saveAppIds(ids) {
  writeFileSync(STATE_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}

export function todayJstYmd() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

export function formatChangeDateJst() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value || '';
  const m = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  return `${y}.${m}.${day}`;
}

export function normalizeMembersRaw(raw) {
  const s = String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, ',')
    .replace(/，/g, ',');
  const parts = s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out.join(',');
}

export function splitMembers(raw) {
  const norm = normalizeMembersRaw(raw);
  if (!norm) return [];
  return norm.split(',').map((x) => x.trim()).filter(Boolean);
}

export function buildChangeMemo(beforeRaw, afterRaw) {
  const before = new Set(splitMembers(beforeRaw).map((x) => x.toLowerCase()));
  const afterList = splitMembers(afterRaw);
  const after = new Set(afterList.map((x) => x.toLowerCase()));
  const added = afterList.filter((x) => !before.has(x.toLowerCase()));
  const removed = splitMembers(beforeRaw).filter((x) => !after.has(x.toLowerCase()));
  if (!added.length && !removed.length) return '';
  const parts = [];
  added.forEach((x) => parts.push(`${x}追加`));
  removed.forEach((x) => parts.push(`${x}削除`));
  return `${formatChangeDateJst()}：${parts.join('\u3000')}`;
}

export function assertListAddress(addr) {
  const s = String(addr || '').trim().toLowerCase();
  if (!s.endsWith(LIST_DOMAIN)) throw new Error(`list_address must end with ${LIST_DOMAIN}`);
}

export function assignSortNumbers(rows, deptMaster) {
  const deptOrder = new Map(deptMaster.map((d) => [d.department, Number(d.sort_no)]));
  const byDept = new Map();
  for (const row of rows) {
    const dept = row.department;
    if (!byDept.has(dept)) byDept.set(dept, []);
    byDept.get(dept).push(row);
  }
  for (const [, list] of byDept) {
    list.sort((a, b) => {
      const la = Number(a.legacy_no) || 0;
      const lb = Number(b.legacy_no) || 0;
      if (la !== lb) return la - lb;
      return String(a.list_address).localeCompare(String(b.list_address), 'ja');
    });
    list.forEach((row, idx) => {
      const block = deptOrder.get(row.department) || 999;
      row.sort_no = block * 1000 + idx + 1;
    });
  }
  rows.sort((a, b) => Number(a.sort_no) - Number(b.sort_no));
  return rows;
}

export function readExcelRows(xlsxPath = DEFAULT_XLSX) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = wb.SheetNames.includes('Sheet2') ? 'Sheet2' : wb.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' });
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i] || [];
    const listAddress = String(r[2] || '').trim();
    if (!listAddress) continue;
    rows.push({
      legacy_no: Number(r[0]) || rows.length + 1,
      department: String(r[1] || '').trim(),
      list_address: listAddress,
      purpose: String(r[3] || '').trim(),
      members_raw: normalizeMembersRaw(r[4] || ''),
      status: STATUS_ACTIVE,
      last_change_memo: '',
      note: '',
    });
  }
  return assignSortNumbers(rows, loadDeptMaster());
}

export function rowToKintoneRecord(row, regDate, updDate) {
  const today = todayJstYmd();
  return {
    sort_no: { value: String(row.sort_no) },
    legacy_no: { value: row.legacy_no != null ? String(row.legacy_no) : '' },
    department: { value: row.department },
    list_address: { value: row.list_address },
    purpose: { value: row.purpose || '' },
    members_raw: { value: row.members_raw || '' },
    status: { value: row.status || STATUS_ACTIVE },
    last_change_memo: { value: row.last_change_memo || '' },
    note: { value: row.note || '' },
    registered_date: { value: regDate || today },
    updated_date: { value: updDate || regDate || today },
  };
}

export async function recordCount(baseUrl, headers, appId) {
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent('order by sort_no asc limit 1')}&totalCount=true`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return Number(j.totalCount || 0);
}
