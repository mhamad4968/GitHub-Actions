#!/usr/bin/env node
/**
 * kintone-schema-mcp — live app form / views schema via REST (§50-3-11 第12層)
 * REST 正本: scripts/lib/kintone-live-schema.mjs（O1 thin 化）
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMcpServer } from '../lib/mcp-stdio.mjs';
import {
  kintoneRestGet,
  kintoneRestPost,
  loadDotenv,
} from '../../scripts/lib/kintone-live-schema.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
loadDotenv(repoRoot);

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
    const json = await kintoneRestPost('/k/v1/preview/app/form/fields.json', { app: Number(appId) });
    return { revision: json.revision, fields: summarizeFields(json.properties) };
  },
  async list_field_codes({ appId }) {
    const json = await kintoneRestPost('/k/v1/preview/app/form/fields.json', { app: Number(appId) });
    return Object.keys(json.properties || {}).sort();
  },
  async get_app_views({ appId }) {
    return kintoneRestGet('/k/v1/preview/app/views.json', { app: Number(appId) });
  },
  async get_app_settings({ appId }) {
    return kintoneRestGet('/k/v1/app.json', { id: Number(appId) });
  },
};

createMcpServer({
  name: 'kintone-schema-mcp',
  version: '1.0.1',
  tools,
  handlers,
});
