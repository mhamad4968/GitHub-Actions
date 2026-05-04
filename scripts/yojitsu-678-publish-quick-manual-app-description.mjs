#!/usr/bin/env node
/**
 * 678 アプリの「アプリの説明」にクイックマニュアル（HTML 断片）を載せ、本番へ deploy する。
 * 正本: templates/yojitsu-budget-lite/docs/yojitsu-quick-manual.html（<body> 内を抽出）
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-678-publish-quick-manual-app-description.mjs
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const MANUAL_HTML = resolve(
  REPO_ROOT,
  'templates/yojitsu-budget-lite/docs/yojitsu-quick-manual.html',
);

const APP_ID = 678;

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

function extractBodyInner(html) {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!m) throw new Error('yojitsu-quick-manual.html: <body> not found');
  return m[1].trim();
}

function buildDescription(fragment) {
  const intro =
    '<div style="margin:0 0 12px;padding:10px 12px;background:#e8f2ea;border:1px solid #b9d6bd;border-radius:6px;font-size:13px;color:#1a4030;">' +
    '<strong>部署予実 678 — クイックマニュアル</strong>（この欄は kintone の「アプリの説明」です。下の一覧はカスタマイズの集計表）</div>';
  // id は kintone 側で除去されることがあるため name アンカー（#y678-quick-manual）を併用
  const wrapped =
    `<div style="max-width:920px;">${intro}<a name="y678-quick-manual"></a>${fragment}</div>`;
  if (wrapped.length > 10000) {
    throw new Error(`description length ${wrapped.length} exceeds kintone limit 10000`);
  }
  return wrapped;
}

async function main() {
  const { headers, baseUrl } = buildHeaders();
  const raw = readFileSync(MANUAL_HTML, 'utf8');
  const fragment = extractBodyInner(raw);
  const description = buildDescription(fragment);

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

  console.log('PUT preview app/settings (description length=' + description.length + ')...');
  await api(baseUrl, headers, 'PUT', '/k/v1/preview/app/settings.json', putBody);

  console.log('POST preview app/deploy...');
  await api(baseUrl, headers, 'POST', '/k/v1/preview/app/deploy.json', { apps: [{ app: APP_ID }] });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const st = await api(baseUrl, headers, 'GET', '/k/v1/preview/app/deploy.json', { apps: [APP_ID] });
    const s = st.apps?.[0]?.status;
    console.log('deploy status:', s);
    if (s === 'SUCCESS') {
      console.log('Done. Open https://jbis-kintone.cybozu.com/k/678/ and scroll to app description.');
      return;
    }
    if (s === 'FAIL' || s === 'CANCEL') throw new Error('deploy failed: ' + JSON.stringify(st));
  }
  throw new Error('deploy poll timeout');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
