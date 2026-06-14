#!/usr/bin/env node
/**
 * kintone-schema-mcp — live app form / views schema via REST (§50-3-11 第12層)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMcpServer } from '../lib/mcp-stdio.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadDotenv() {
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

loadDotenv();

function getConfig() {
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

async function kintoneGet(pathSuffix, params = {}) {
  const { baseUrl, headers } = getConfig();
  const url = new URL(`${baseUrl}${pathSuffix}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${json.code || res.status} ${json.message || text.slice(0, 200)}`);
  return json;
}

async function kintonePost(pathSuffix, body) {
  const { baseUrl, headers } = getConfig();
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
    throw new Error(`Non-JSON response HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${json.code || res.status} ${json.message || text.slice(0, 200)}`);
  return json;
}

function summarizeFields(properties) {
  return Object.entries(properties || {}).map(([code, def]) => ({
    code,
    label: def.label,
    type: def.type,
    required: !!def.required,
    unique: !!def.unique,
  }));
}

const tools = [
  {
    name: 'get_app_form_schema',
    description: 'Get kintone app form fields (codes, types, labels) for customize alignment',
    inputSchema: {
      type: 'object',
      properties: { appId: { type: 'number', description: 'kintone app ID' } },
      required: ['appId'],
    },
  },
  {
    name: 'list_field_codes',
    description: 'List field codes only for an app (quick lint cross-check)',
    inputSchema: {
      type: 'object',
      properties: { appId: { type: 'number' } },
      required: ['appId'],
    },
  },
  {
    name: 'get_app_views',
    description: 'Get list/detail view field layouts for an app',
    inputSchema: {
      type: 'object',
      properties: { appId: { type: 'number' } },
      required: ['appId'],
    },
  },
  {
    name: 'get_app_settings',
    description: 'Get app name, description, revision',
    inputSchema: {
      type: 'object',
      properties: { appId: { type: 'number' } },
      required: ['appId'],
    },
  },
];

const handlers = {
  async get_app_form_schema({ appId }) {
    const json = await kintonePost('/k/v1/preview/app/form/fields.json', { app: Number(appId) });
    return { revision: json.revision, fields: summarizeFields(json.properties) };
  },
  async list_field_codes({ appId }) {
    const json = await kintonePost('/k/v1/preview/app/form/fields.json', { app: Number(appId) });
    return Object.keys(json.properties || {}).sort();
  },
  async get_app_views({ appId }) {
    const json = await kintoneGet('/k/v1/preview/app/views.json', { app: Number(appId) });
    return json;
  },
  async get_app_settings({ appId }) {
    return kintoneGet('/k/v1/app.json', { id: Number(appId) });
  },
};

createMcpServer({
  name: 'kintone-schema-mcp',
  version: '1.0.0',
  tools,
  handlers,
});
