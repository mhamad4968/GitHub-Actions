#!/usr/bin/env node
/**
 * 683 要約キャッシュ: 本番フォームに週次 user683_week_1〜_6 が存在するか検査（P1）。
 *
 *   npm run user683:verify-summary-fields
 */
import 'dotenv/config';

const APP = Number(process.env.USER683_SUMMARY_APP || 683);
const REQUIRED_WEEK_CODES = [
  process.env.USER683_FC_W1 || 'user683_week_1',
  process.env.USER683_FC_W2 || 'user683_week_2',
  process.env.USER683_FC_W3 || 'user683_week_3',
  process.env.USER683_FC_W4 || 'user683_week_4',
  process.env.USER683_FC_W5 || 'user683_week_5',
  process.env.USER683_FC_W6 || 'user683_week_6',
];

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

function buildAuthHeaders() {
  const user = requireEnv('KINTONE_USERNAME');
  const pass = requireEnv('KINTONE_PASSWORD');
  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64')}`;
  }
  return headers;
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');

async function main() {
  const url = `${baseUrl}/k/v1/app/form/fields.json?app=${APP}`;
  const res = await fetch(url, { headers: buildAuthHeaders() });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`GET fields: ${json.code || res.status} ${json.message || JSON.stringify(json)}`);
  }
  const props = json.properties || {};
  const missing = REQUIRED_WEEK_CODES.filter((code) => !props[code]);
  if (missing.length) {
    console.error(`[user683-verify-summary-fields] NG app=${APP} 欠落: ${missing.join(', ')}`);
    console.error('  → npm run user683:add-summary-fields');
    process.exit(1);
  }
  console.log(`[user683-verify-summary-fields] OK app=${APP} week fields 1-6 present`);
  for (const code of REQUIRED_WEEK_CODES) {
    const t = props[code]?.type || '?';
    console.log(`  ${code} (${t})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
