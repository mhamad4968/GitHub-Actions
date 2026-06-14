/**
 * kintone 実機スキーマ取得（kintone-schema-mcp と同一 REST 正本）
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  LIVE_SCHEMA_EXCLUDED_IDS,
  LIVE_SCHEMA_MONTHLY_IDS,
  PORTFOLIO_CUSTOMIZE,
} from '../cio-portfolio-apps.mjs';
import { getCustomizeDirToApp, REPO_ROOT_FROM_LIB } from './kintone-customize-path-registry.mjs';

export const CUSTOMIZE_DIR_TO_APP = getCustomizeDirToApp(REPO_ROOT_FROM_LIB);

export function loadDotenv(repoRoot) {
  for (const name of ['.env', '.env.proxy']) {
    const p = path.join(repoRoot, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m || process.env[m[1]]) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

export function getKintoneConfig() {
  const baseUrl = String(process.env.KINTONE_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/k$/i, '');
  const user = String(process.env.KINTONE_USERNAME || '').trim();
  const pass = String(process.env.KINTONE_PASSWORD || '').trim();
  if (!baseUrl || !user || !pass) {
    throw new Error('KINTONE_BASE_URL / KINTONE_USERNAME / KINTONE_PASSWORD required');
  }
  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
    'Content-Type': 'application/json',
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64')}`;
  }
  return { baseUrl, headers };
}

async function kintonePost(baseUrl, headers, pathSuffix, body) {
  const res = await fetch(`${baseUrl}${pathSuffix}`, {
    method: 'POST',
    headers: { ...headers, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${json.code || res.status} ${json.message || text.slice(0, 200)}`);
  return json;
}

function walkSubtableFields(code, def, out) {
  out.fieldCodes.add(code);
  out.fields[code] = { type: def.type, label: def.label, required: !!def.required };
  if (def.type === 'SUBTABLE' && def.fields) {
    for (const [subCode, subDef] of Object.entries(def.fields)) {
      out.subtableFields[subCode] = { parent: code, type: subDef.type, label: subDef.label };
      out.fieldCodes.add(subCode);
      out.fields[subCode] = { type: subDef.type, label: subDef.label, parent: code };
    }
  }
  if (def.type === 'REFERENCE_TABLE' && def.referenceTable) {
    out.referenceTables.push({
      field: code,
      relatedApp: def.referenceTable.relatedApp?.app,
      condition: def.referenceTable.condition,
    });
  }
  if (def.lookup) {
    out.lookups.push({
      field: code,
      relatedApp: def.lookup.relatedApp?.app,
      relatedKeyField: def.lookup.relatedKeyField,
      fieldMappings: def.lookup.fieldMappings || [],
    });
  }
}

/** @returns {Promise<{ revision: string|number, fieldCodes: Set<string>, fields: Record<string, object>, subtableFields: Record<string, object>, lookups: object[], referenceTables: object[] }>} */
export async function fetchLiveFormSchema(appId) {
  const { baseUrl, headers } = getKintoneConfig();
  const json = await kintonePost(baseUrl, headers, '/k/v1/preview/app/form/fields.json', {
    app: Number(appId),
  });
  const out = {
    revision: json.revision,
    fieldCodes: new Set(),
    fields: {},
    subtableFields: {},
    lookups: [],
    referenceTables: [],
  };
  for (const [code, def] of Object.entries(json.properties || {})) {
    walkSubtableFields(code, def, out);
  }
  return out;
}

/** appId → customize ディレクトリ名（registry 優先 → CUSTOMIZE_DIR_TO_APP 逆引き → 数値フォルダ） */
export function resolveCustomizeDirsForApp(appId, registryMeta) {
  if (registryMeta?.customizeDirs?.length) return [...registryMeta.customizeDirs];
  const id = String(appId);
  for (const [dir, mapped] of Object.entries(CUSTOMIZE_DIR_TO_APP)) {
    if (mapped === id) return [dir];
  }
  return [id];
}

function portfolioCustomizeDir(root, appId) {
  const entry = PORTFOLIO_CUSTOMIZE.find((p) => p.id === appId);
  if (!entry) return null;
  const dir = path.dirname(entry.rel).replace(/^customize\//, '');
  return dir || appId;
}

/** 月次 `--portfolio` 専用 — BUILD 監査 PORTFOLIO + registry 714-717 のみ（全 customize 走査禁止） */
export function discoverManagedPortfolioApps(root) {
  const registryPath = path.join(root, 'data/kintone-field-registry.json');
  let registry = { apps: {} };
  if (fs.existsSync(registryPath)) {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  }

  const apps = [];
  for (const appId of LIVE_SCHEMA_MONTHLY_IDS) {
    if (LIVE_SCHEMA_EXCLUDED_IDS.includes(appId)) continue;

    const reg = registry.apps?.[appId];
    if (reg) {
      apps.push({
        appId,
        customizeDirs: resolveCustomizeDirsForApp(appId, reg),
        label: reg.label || appId,
        source: 'registry',
      });
      continue;
    }

    const portfolioDir = portfolioCustomizeDir(root, appId);
    if (portfolioDir) {
      apps.push({
        appId,
        customizeDirs: [portfolioDir],
        label: appId,
        source: 'portfolio',
      });
      continue;
    }

    const numericDir = path.join(root, 'customize', appId);
    if (fs.existsSync(numericDir)) {
      apps.push({ appId, customizeDirs: [appId], label: appId, source: 'portfolio-numeric' });
    }
  }

  return apps;
}

export function discoverLiveSchemaApps(root, options = {}) {
  if (options.portfolio) {
    return discoverManagedPortfolioApps(root);
  }

  const registryPath = path.join(root, 'data/kintone-field-registry.json');
  const apps = new Map();

  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    for (const [appId, meta] of Object.entries(registry.apps || {})) {
      apps.set(appId, {
        appId,
        customizeDirs: resolveCustomizeDirsForApp(appId, meta),
        label: meta.label || appId,
        source: 'registry',
      });
    }
  }

  const customizeRoot = path.join(root, 'customize');
  if (fs.existsSync(customizeRoot)) {
    for (const name of fs.readdirSync(customizeRoot)) {
      const full = path.join(customizeRoot, name);
      if (!fs.statSync(full).isDirectory()) continue;
      const hasJs = fs.readdirSync(full).some((f) => f.endsWith('.js'));
      if (!hasJs) continue;
      let appId = /^\d+$/.test(name) ? name : CUSTOMIZE_DIR_TO_APP[name];
      if (!appId) continue;
      if (!apps.has(appId) && !options.allCustomize) continue;
      if (!apps.has(appId)) {
        apps.set(appId, { appId, customizeDirs: [name], label: name, source: 'discover' });
      }
    }
  }

  if (options.appFilter) {
    const f = String(options.appFilter);
    const registry = fs.existsSync(registryPath)
      ? JSON.parse(fs.readFileSync(registryPath, 'utf8'))
      : { apps: {} };
    const reg = registry.apps?.[f];
    if (!apps.has(f)) {
      apps.set(f, {
        appId: f,
        customizeDirs: resolveCustomizeDirsForApp(f, reg),
        label: reg?.label || f,
        source: 'filter',
      });
    } else if (reg) {
      const entry = apps.get(f);
      entry.customizeDirs = resolveCustomizeDirsForApp(f, reg);
      entry.label = reg.label || entry.label;
    }
    for (const [id] of [...apps]) {
      if (id !== f) apps.delete(id);
    }
  }

  return [...apps.values()];
}
