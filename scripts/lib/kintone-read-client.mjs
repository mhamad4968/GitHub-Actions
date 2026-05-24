/**
 * kintone REST — read-only helper (GET only).
 * Used by app:records and business-improvement compare scripts.
 */

export function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

export function getKintoneReadConfig() {
  let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
  baseUrl = baseUrl.replace(/\/k$/, '');
  const user = requireEnv('KINTONE_USERNAME');
  const pass = requireEnv('KINTONE_PASSWORD');

  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
    const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
    headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  }

  return { baseUrl, headers };
}

/**
 * @param {string} path - e.g. `/k/v1/records.json?app=83&...`
 */
export async function kintoneGetJson(path) {
  const { baseUrl, headers } = getKintoneReadConfig();
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const err = new Error(
      `kintone GET failed HTTP ${res.status}: ${json?.code || ''} ${json?.message || text.slice(0, 200)}`.trim(),
    );
    err.status = res.status;
    err.kintone = json;
    throw err;
  }
  return json;
}

/** Flatten kintone field value to plain JS for snapshots. */
export function flattenFieldValue(v) {
  if (v == null) return null;
  if (typeof v !== 'object') return v;
  if ('value' in v) return flattenFieldValue(v.value);
  if (Array.isArray(v)) return v.map(flattenFieldValue);
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    out[k] = flattenFieldValue(val);
  }
  return out;
}

export function flattenRecord(record) {
  const flat = {};
  for (const [code, field] of Object.entries(record)) {
    if (code === '$id') {
      flat.id = flattenFieldValue(field);
      continue;
    }
    if (code === '$revision') {
      flat.revision = flattenFieldValue(field);
      continue;
    }
    if (code.startsWith('$')) continue;
    flat[code] = flattenFieldValue(field);
  }
  if (flat.id == null && record.id != null) flat.id = flattenFieldValue(record.id);
  if (flat.revision == null && record.revision != null) flat.revision = flattenFieldValue(record.revision);
  return flat;
}
