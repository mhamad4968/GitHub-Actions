#!/usr/bin/env node
/**
 * 678 の「アプリの説明」を短い案内にし、クイックマニュアル専用アプリ（既定 679）へ誘導する。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-678-set-manual-pointer-description.mjs
 */
import 'dotenv/config';

const APP_ID = 678;
const MANUAL_APP = Number(process.env.YOJITSU_QUICK_MANUAL_APP_ID || 679);

function buildHeaders() {
  const u = process.env.KINTONE_USERNAME;
  const p = process.env.KINTONE_PASSWORD;
  if (!u || !p) throw new Error('KINTONE_USERNAME / KINTONE_PASSWORD required');
  let base = String(process.env.KINTONE_BASE_URL || '').trim().replace(/\/+$/, '');
  base = base.replace(/\/k$/i, '');
  const h = {
    'X-Cybozu-Authorization': Buffer.from(`${u}:${p}`, 'utf8').toString('base64'),
    'Content-Type': 'application/json',
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    h.Authorization =
      'Basic ' +
      Buffer.from(
        `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
        'utf8',
      ).toString('base64');
  }
  return { headers: h, baseUrl: base };
}

async function api(baseUrl, headers, method, path, body) {
  const url = baseUrl + path;
  let actualMethod = method;
  let actualHeaders = { ...headers };
  let actualBody;
  if (method === 'GET' && body) {
    actualMethod = 'POST';
    actualHeaders['X-HTTP-Method-Override'] = 'GET';
    actualBody = JSON.stringify(body);
  } else if (method === 'GET') {
    actualBody = undefined;
  } else {
    actualBody = body ? JSON.stringify(body) : undefined;
  }
  const r = await fetch(url, { method: actualMethod, headers: actualHeaders, body: actualBody });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} → HTTP ${r.status} ${JSON.stringify(j)}`);
  return j;
}

const { headers, baseUrl } = buildHeaders();
const manualUrl = `${baseUrl}/k/${MANUAL_APP}/`;

const description =
  '<div style="font-size:13px;line-height:1.55;color:#1a4030;">' +
  '<p style="margin:0 0 8px;">担当者向けの案内は <a href="' +
  manualUrl +
  '"><strong>システム推進室予実アプリガイド</strong></a> にあります。</p>' +
  '<p style="margin:0;">日々の集計・入力はこの画面の一覧（<strong>システム推進室予実管理システム</strong>）をご利用ください。</p>' +
  '</div>';

async function main() {
  const live = await api(baseUrl, headers, 'GET', '/k/v1/app/settings.json', { app: APP_ID });
  const putBody = {
    app: String(APP_ID),
    revision: live.revision,
    name: live.name,
    description,
    icon: live.icon,
    theme: live.theme,
    titleField: live.titleField,
    enableThumbnails: live.enableThumbnails,
    enableBulkDeletion: live.enableBulkDeletion,
    enableComments: live.enableComments,
    enableDuplicateRecord: live.enableDuplicateRecord,
    enableInlineRecordEditing: live.enableInlineRecordEditing,
    numberPrecision: live.numberPrecision,
    firstMonthOfFiscalYear: live.firstMonthOfFiscalYear,
  };

  console.log('PUT preview app/settings (678 pointer, description length=' + description.length + ')...');
  await api(baseUrl, headers, 'PUT', '/k/v1/preview/app/settings.json', putBody);
  console.log('POST preview app/deploy...');
  await api(baseUrl, headers, 'POST', '/k/v1/preview/app/deploy.json', { apps: [{ app: APP_ID }] });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const st = await api(baseUrl, headers, 'GET', '/k/v1/preview/app/deploy.json', { apps: [APP_ID] });
    const s = st.apps?.[0]?.status;
    console.log('deploy status:', s);
    if (s === 'SUCCESS') {
      console.log('Done.');
      return;
    }
    if (s === 'FAIL' || s === 'CANCEL') throw new Error(JSON.stringify(st));
  }
  throw new Error('deploy poll timeout');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
