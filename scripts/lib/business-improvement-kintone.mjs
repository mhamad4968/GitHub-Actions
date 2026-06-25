/**
 * 業務改善提案 ver.02 — kintone REST helpers (Space 5).
 * 正本: docs/plans/2026-05-28-business-improvement-implementation-handbook.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SETTINGS_APP_NAME = '【業務改善提案システム】設定マスタ';
export const EMPLOYEE_APP_NAME = '【業務改善提案システム】社員マスタ';
export const GUIDE_APP_NAME = '【業務改善提案システム】ご利用ガイド';
export const GUIDE_CUSTOMIZE_DIR = 'customize/business-improvement-guide';
export const EMPLOYEE_CUSTOMIZE_DIR = 'customize/business-improvement-employee';
export const PROPOSAL_CUSTOMIZE_DIR = 'customize/business-improvement-proposal';
export const PROPOSAL_APP_NAME = '【業務改善提案システム】提案申請ver.02';
export const ANNUAL_APP_NAME = '【業務改善提案システム】年次処理';
export const ANNUAL_CUSTOMIZE_DIR = 'customize/business-improvement-annual';

export const SPACE_ID = Number(process.env.BI_SPACE_ID || 5);
export const THREAD_ID = Number(process.env.BI_SPACE_THREAD_ID || 7);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, '..', 'data');
export const APP_IDS_PATH = path.join(DATA_DIR, 'business-improvement-app-ids.json');
export const ANNUAL_FIELDS_PATH = path.join(DATA_DIR, 'business-improvement-annual-fields.json');
export const SETTINGS_FIELDS_PATH = path.join(DATA_DIR, 'business-improvement-settings-master-fields.json');
export const SETTINGS_XLSX_PATH = path.join(DATA_DIR, 'business-improvement-settings-master-template.xlsx');
export const EVAL_SPEC_PATH = path.join(DATA_DIR, 'business-improvement-eval-spec-431.json');

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
  return { baseUrl, headers, username: user };
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

export function loadAppIds() {
  if (!existsSync(APP_IDS_PATH)) {
    return {
      spaceId: SPACE_ID,
      threadId: THREAD_ID,
      settingsAppId: null,
      employeeAppId: null,
      guideAppId: null,
      proposalAppId: null,
      annualAppId: null,
    };
  }
  return JSON.parse(readFileSync(APP_IDS_PATH, 'utf8'));
}

export function loadAnnualFieldProperties() {
  const raw = JSON.parse(readFileSync(ANNUAL_FIELDS_PATH, 'utf8'));
  if (!raw.properties) throw new Error('business-improvement-annual-fields.json: missing properties');
  return raw.properties;
}

export function saveAppIds(ids) {
  writeFileSync(APP_IDS_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}

export function loadSettingsFieldProperties() {
  const raw = JSON.parse(readFileSync(SETTINGS_FIELDS_PATH, 'utf8'));
  if (!raw.properties) throw new Error('business-improvement-settings-master-fields.json: missing properties');
  return raw.properties;
}

/** 開発用アカウントのみフルアクセス（Everyone 等は閲覧不可） */
export async function restrictAppToDevUser(baseUrl, headers, appId, devUserCode) {
  const rights = [
    {
      entity: { type: 'USER', code: devUserCode },
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
  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/acl.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: appId, rights }),
  });
  await deployApp(baseUrl, headers, appId, res.revision);
}

export function buildEvalRowsFromSpec(spec, labelMap = new Map()) {
  const rows = [];
  for (const [proposalType, cfg] of Object.entries(spec.proposalTypes || {})) {
    for (const item of cfg.items || []) {
      for (const level of item.levels || []) {
        const key = `${proposalType}|${item.axis}|${level.stage}`;
        rows.push({
          eval_proposal_type: proposalType,
          eval_axis: item.axis,
          eval_stage: level.stage,
          eval_points: String(level.points),
          eval_label: labelMap.get(key) || '',
        });
      }
    }
  }
  return rows;
}
