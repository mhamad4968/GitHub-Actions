/**
 * kintone 実機スキーマ取得（kintone-schema-mcp と同一 REST 正本）
 */
import fs from 'node:fs';
import path from 'node:path';

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

/** customize ディレクトリ名 → appId（非数値フォルダ） */
export const CUSTOMIZE_DIR_TO_APP = {
  'software-ledger-db': '714',
  'software-ledger-dash': '715',
  'storage-media-ledger-db': '716',
  'storage-media-ledger-dash': '717',
  'shared-mail-db': '695',
  'shared-mail-dash': '696',
  'apple-id-db': '693',
  'apple-id-dash': '694',
  'nonconformance-db': '706',
  'nonconformance-dash': '707',
  'external-it-checksheet-db': '708',
  'external-it-checksheet-dash': '709',
  'new-system-intro-db': '710',
  'new-system-intro-dash': '711',
  'space48-portal': '712',
  'security-next-news-board': '701',
  'security-next-weekly-board': '702',
  'business-improvement-guide': '699',
  'business-improvement-proposal': '700',
  'business-improvement-annual': '713',
  'new-pc-ledger-v1': '674',
  'ops-guide': '668',
  'shucccho-seisan': '629',
};

export function discoverLiveSchemaApps(root, options = {}) {
  const registryPath = path.join(root, 'data/kintone-field-registry.json');
  const apps = new Map();

  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    for (const [appId, meta] of Object.entries(registry.apps || {})) {
      apps.set(appId, {
        appId,
        customizeDirs: meta.customizeDirs || [appId],
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
      if (!options.portfolio && !apps.has(appId) && !options.allCustomize) continue;
      if (!apps.has(appId)) {
        apps.set(appId, { appId, customizeDirs: [name], label: name, source: 'discover' });
      }
    }
  }

  if (options.appFilter) {
    const f = String(options.appFilter);
    if (!apps.has(f)) {
      apps.set(f, { appId: f, customizeDirs: [f in CUSTOMIZE_DIR_TO_APP ? Object.entries(CUSTOMIZE_DIR_TO_APP).find(([, v]) => v === f)?.[0] || f : f], label: f, source: 'filter' });
    }
    for (const [id] of [...apps]) {
      if (id !== f) apps.delete(id);
    }
  }

  return [...apps.values()];
}
