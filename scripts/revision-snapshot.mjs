#!/usr/bin/env node
// scripts/revision-snapshot.mjs
//
// kintone アプリの現在状態 (app.json + form/fields.json) を JSON snapshot として保存。
// PC 台帳 Day 4 の各 deploy 前後で実行し、障害時の rollback 参照にする。
//
// 使い方:
//   node scripts/revision-snapshot.mjs --app=674 --label=step1-add-app
//   node scripts/revision-snapshot.mjs --app=674 --label=step3-after-deploy
//
// 出力:
//   data/snapshots/<app>-<label>-<JST yyyymmdd-HHMMSS>.json
//
// 注意:
//   - read-only API のみ呼出 (Tier A 自律)
//   - .env / .env.proxy から認証情報を取得
//   - 既存 snapshot は上書きしない (timestamp で一意化)

import 'dotenv/config';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SNAPSHOT_DIR = resolve(REPO_ROOT, 'data/snapshots');

function parseArgs(argv) {
  const args = { app: null, label: null };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--app=')) args.app = a.slice('--app='.length);
    else if (a.startsWith('--label=')) args.label = a.slice('--label='.length);
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/revision-snapshot.mjs --app=<id> --label=<label>');
      process.exit(0);
    }
  }
  return args;
}

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

// JST timestamp = yyyymmdd-HHMMSS
function jstTimestamp() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jst.getUTCDate()).padStart(2, '0');
  const HH = String(jst.getUTCHours()).padStart(2, '0');
  const MM = String(jst.getUTCMinutes()).padStart(2, '0');
  const SS = String(jst.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${HH}${MM}${SS}`;
}

function buildHeaders() {
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
  return headers;
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message
      ? `${json.code || ''} ${json.message || ''}`.trim()
      : text.slice(0, 400);
    throw new Error(`HTTP ${res.status} ${msg}`);
  }
  return json;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.app || !args.label) {
    console.error('Error: --app=<id> and --label=<label> are required');
    process.exit(2);
  }

  let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
  baseUrl = baseUrl.replace(/\/k$/i, '');

  const headers = buildHeaders();
  const ts = jstTimestamp();

  // 1. app 基本情報（未デプロイのアプリは live の app.json が 404 → preview settings にフォールバック）
  const appUrl = new URL(`${baseUrl}/k/v1/app.json`);
  appUrl.searchParams.set('id', args.app);
  let appInfo;
  let previewOnly = false;
  try {
    appInfo = await fetchJson(appUrl.toString(), headers);
  } catch (e) {
    const em = String(e.message || e);
    if (!em.includes('HTTP 404')) throw e;
    previewOnly = true;
    const previewSettingsUrl = new URL(`${baseUrl}/k/v1/preview/app/settings.json`);
    previewSettingsUrl.searchParams.set('app', args.app);
    appInfo = await fetchJson(previewSettingsUrl.toString(), headers);
  }

  // 2. settings（live または preview）
  let settings = null;
  try {
    const path = previewOnly ? '/k/v1/preview/app/settings.json' : '/k/v1/app/settings.json';
    const settingsUrl = new URL(`${baseUrl}${path}`);
    settingsUrl.searchParams.set('app', args.app);
    settings = await fetchJson(settingsUrl.toString(), headers);
  } catch (e) {
    settings = { error: String(e.message || e) };
  }

  // 3. preview のフィールド（deploy 前の編集状態）
  let previewFields = null;
  try {
    const previewUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
    previewUrl.searchParams.set('app', args.app);
    previewFields = await fetchJson(previewUrl.toString(), headers);
  } catch (e) {
    previewFields = { error: String(e.message || e) };
  }

  // 4. live のフィールド（本番反映済みのみ存在）
  let fields;
  if (previewOnly) {
    fields = previewFields;
  } else {
    const fieldsUrl = new URL(`${baseUrl}/k/v1/app/form/fields.json`);
    fieldsUrl.searchParams.set('app', args.app);
    fields = await fetchJson(fieldsUrl.toString(), headers);
  }

  const snapshot = {
    snapshot_timestamp_jst: ts,
    snapshot_label: args.label,
    app_id: Number(args.app),
    preview_environment_only: previewOnly,
    app: appInfo,
    settings,
    form_fields_live: fields,
    form_fields_preview: previewFields,
  };

  if (!existsSync(SNAPSHOT_DIR)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  const outPath = resolve(SNAPSHOT_DIR, `${args.app}-${args.label}-${ts}.json`);
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

  console.log(`✅ snapshot saved: ${outPath}`);
  if (previewOnly) console.log('   (preview のみ = 本番未デプロイ。add-app 直後など)');
  console.log(`   app: ${args.app} (${appInfo.name || '?'})`);
  console.log(`   revision:         ${settings?.revision ?? appInfo.revision ?? '?'}`);
  console.log(`   live fields:      ${Object.keys(fields.properties || {}).length}`);
  console.log(`   preview fields:   ${previewFields?.properties ? Object.keys(previewFields.properties).length : 'N/A'}`);
}

main().catch((e) => {
  console.error(`❌ snapshot failed: ${e.message || e}`);
  process.exit(1);
});
