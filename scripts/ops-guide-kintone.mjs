/**
 * 運用ガイド（docs/ops-guide/*.html）を Kintone に「全自動」で載せる。
 *
 * 前提: KINTONE_BASE_URL / KINTONE_USERNAME / KINTONE_PASSWORD（+ 任意 Basic）
 *
 * コマンド:
 *   init     アプリが未設定なら新規作成 → レコード同期 → desktop.js デプロイ
 *   create   新規アプリ作成のみ（KINTONE_OPS_GUIDE_APP が無いとき）
 *   sync     レコードの HTML を docs/ops-guide から上書き
 *   deploy   customize/ops-guide/desktop.js をアプリにデプロイ
 *   publish  sync + deploy（日々の更新はこれ）
 *
 * 環境変数:
 *   KINTONE_OPS_GUIDE_APP   対象アプリ ID（init 初回後に .env へ追記推奨）
 *   KINTONE_OPS_GUIDE_SPACE_ID / KINTONE_OPS_GUIDE_THREAD_ID（任意。無い場合はスペースなしで作成を試行）
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const GUIDE_DIR = path.join(REPO_ROOT, 'docs', 'ops-guide');
const DESKTOP_JS = path.join(REPO_ROOT, 'customize', 'ops-guide', 'desktop.js');

const GUIDE_FILES = [
  { file: 'index.html', slug: 'hub', title: 'ガイドトップ' },
  { file: 'guide-pc.html', slug: 'pc', title: 'PC台帳ガイド' },
  { file: 'guide-personal-account.html', slug: 'personal', title: '個人アカウントガイド' },
  { file: 'guide-shared-account.html', slug: 'shared', title: '共有アカウントガイド' },
  { file: 'guide-employee.html', slug: 'employee', title: '社員マスタガイド' },
  { file: 'guide-lifecycle.html', slug: 'lifecycle', title: '異動・退職・買替ガイド' },
];

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`環境変数がありません: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
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

async function fetchJson(url, init) {
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
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitDeploy(appNum) {
  const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  stUrl.searchParams.set('apps[0]', String(appNum));
  for (let i = 0; i < 90; i++) {
    const st = await fetchJson(stUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const status = Array.isArray(st.apps) && st.apps[0] ? st.apps[0].status : null;
    if (status === 'SUCCESS') return;
    if (status === 'FAIL' || status === 'CANCEL') throw new Error(`デプロイ状態: ${status}`);
    await sleep(1000);
  }
  throw new Error('デプロイがタイムアウトしました（PROCESSING のまま）。');
}

const OPS_FIELD_DEFS = {
  guide_slug: {
    type: 'SINGLE_LINE_TEXT',
    code: 'guide_slug',
    label: 'ガイドID',
    noLabel: false,
    required: true,
    minLength: '',
    maxLength: '64',
    expression: '',
    hideExpression: false,
    unique: true,
    defaultValue: '',
  },
  guide_title: {
    type: 'SINGLE_LINE_TEXT',
    code: 'guide_title',
    label: 'タイトル',
    noLabel: false,
    required: false,
    minLength: '',
    maxLength: '',
    expression: '',
    hideExpression: false,
    unique: false,
    defaultValue: '',
  },
  guide_body_html: {
    type: 'MULTI_LINE_TEXT',
    code: 'guide_body_html',
    label: 'HTML本文',
    noLabel: false,
    required: false,
    defaultValue: '',
  },
};

function injectIframeNavBridge(html) {
  const snippet = `<script>(function(){function go(s){try{if(window.parent&&typeof window.parent.__JBIS_OPS_GUIDE_NAV__==='function')window.parent.__JBIS_OPS_GUIDE_NAV__(s);}catch(_e){}}document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var href=(a.getAttribute('href')||'').trim();if(!href)return;if(/^https?:\\/\\//i.test(href))return;e.preventDefault();var left=href.replace(/^\\.\\//,'');var M={'index.html':'hub','guide-pc.html':'pc','guide-personal-account.html':'personal','guide-shared-account.html':'shared','guide-employee.html':'employee'};var slug=M[left];if(slug)go(slug);},true);})();<\/script>`;
  if (html.includes('</body>')) return html.replace('</body>', `${snippet}</body>`);
  return html + snippet;
}

async function readGuideHtml(entry) {
  const raw = await readFile(path.join(GUIDE_DIR, entry.file), 'utf8');
  return injectIframeNavBridge(raw);
}

async function createOpsGuideApp() {
  const appName = process.env.KINTONE_OPS_GUIDE_APP_NAME || '運用ガイド（OPS）';
  const spaceId = process.env.KINTONE_OPS_GUIDE_SPACE_ID;
  const threadId = process.env.KINTONE_OPS_GUIDE_THREAD_ID;

  const body = { name: appName };
  if (spaceId && /^\d+$/.test(String(spaceId).trim()) && threadId && /^\d+$/.test(String(threadId).trim())) {
    body.space = Number(spaceId);
    body.thread = Number(threadId);
    console.log(`[ops-guide] スペース ${body.space} thread ${body.thread} に作成します`);
  } else {
    console.log('[ops-guide] スペース未指定のため、ドメイン既定でアプリ作成を試行します（失敗時は KINTONE_OPS_GUIDE_SPACE_ID / THREAD を設定）');
  }

  const addAppUrl = new URL(`${baseUrl}/k/v1/preview/app.json`);
  const addAppRes = await fetchJson(addAppUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const appId = Number(addAppRes.app);
  if (!Number.isFinite(appId) || appId <= 0) {
    throw new Error(`アプリ作成の応答が不正: ${JSON.stringify(addAppRes)}`);
  }
  console.log(`[ops-guide] アプリ作成 appId=${appId} revision=${addAppRes.revision}`);

  const postFieldsUrl = new URL(`${baseUrl}/k/v1/preview/app/form/fields.json`);
  const fieldsRes = await fetchJson(postFieldsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties: OPS_FIELD_DEFS }),
  });
  console.log(`[ops-guide] フィールド追加 revision=${fieldsRes.revision}`);

  const depUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
  await fetchJson(depUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apps: [{ app: appId, revision: fieldsRes.revision }] }),
  });
  await waitDeploy(appId);
  console.log(`[ops-guide] デプロイ成功 appId=${appId}`);

  return appId;
}

async function findRecordIdBySlug(app, slug) {
  const u = new URL(`${baseUrl}/k/v1/records.json`);
  u.searchParams.set('app', String(app));
  u.searchParams.set('query', `guide_slug = "${String(slug).replace(/"/g, '\\"')}" limit 1`);
  u.searchParams.set('fields[0]', '$id');
  const json = await fetchJson(u, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  if (json.records && json.records[0] && json.records[0].$id) return json.records[0].$id.value;
  return null;
}

async function syncOpsGuideRecords(app) {
  for (const entry of GUIDE_FILES) {
    const html = await readGuideHtml(entry);
    if (html.length > 60000) {
      console.warn(`[ops-guide] 警告: ${entry.file} が約 ${html.length} 文字。kintone の上限に近い場合は分割してください。`);
    }
    const rid = await findRecordIdBySlug(app, entry.slug);
    const record = {
      guide_slug: { value: entry.slug },
      guide_title: { value: entry.title },
      guide_body_html: { value: html },
    };
    if (rid) {
      await fetchJson(new URL(`${baseUrl}/k/v1/record.json`), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ app, id: rid, record }),
      });
      console.log(`[ops-guide] PUT slug=${entry.slug} id=${rid}`);
    } else {
      const res = await fetchJson(new URL(`${baseUrl}/k/v1/record.json`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ app, record }),
      });
      console.log(`[ops-guide] POST slug=${entry.slug} id=${res.id}`);
    }
  }
}

function runDeployCustomization(appId) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, 'deploy-customization.js'), String(appId), DESKTOP_JS], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`deploy-customization.js が終了コード ${code} で終了しました`));
    });
  });
}

async function cmdSync(appId) {
  await syncOpsGuideRecords(appId);
  console.log('[ops-guide] 同期完了');
}

async function cmdDeploy(appId) {
  await runDeployCustomization(appId);
  console.log('[ops-guide] JS デプロイ完了');
}

async function cmdPublish(appId) {
  await cmdSync(appId);
  await cmdDeploy(appId);
  console.log(`[ops-guide] publish 完了 → ${baseUrl}/k/${appId}/`);
}

async function cmdCreate() {
  const id = await createOpsGuideApp();
  console.log('');
  console.log('=== .env に追記してください（次回から自動で同じアプリに反映） ===');
  console.log(`KINTONE_OPS_GUIDE_APP=${id}`);
  console.log('');
  console.log('アプリ URL:', `${baseUrl}/k/${id}/`);
  return id;
}

async function cmdInit() {
  let appId = process.env.KINTONE_OPS_GUIDE_APP;
  if (!appId || !/^\d+$/.test(String(appId).trim())) {
    console.log('[ops-guide] KINTONE_OPS_GUIDE_APP が未設定 → 新規アプリを作成します');
    appId = await cmdCreate();
  } else {
    appId = Number(String(appId).trim());
    console.log(`[ops-guide] 既存アプリを使用 appId=${appId}`);
  }
  await cmdPublish(appId);
}

const sub = process.argv[2] || 'help';

try {
  if (sub === 'create') {
    const id = await cmdCreate();
    await cmdPublish(id);
  } else if (sub === 'sync') {
    const appId = Number(requireEnv('KINTONE_OPS_GUIDE_APP').trim());
    await cmdSync(appId);
  } else if (sub === 'deploy') {
    const appId = Number(requireEnv('KINTONE_OPS_GUIDE_APP').trim());
    await cmdDeploy(appId);
  } else if (sub === 'publish') {
    const appId = Number(requireEnv('KINTONE_OPS_GUIDE_APP').trim());
    await cmdPublish(appId);
  } else if (sub === 'init') {
    await cmdInit();
  } else {
    console.log(`使い方: node scripts/ops-guide-kintone.mjs <init|create|sync|deploy|publish>
  init    初回: アプリ作成→同期→デプロイ / 2回目以降: 同期→デプロイ
  create  アプリ新規作成のみ（通常は init で十分）
  sync    HTML だけ Kintone に反映
  deploy  desktop.js だけ再デプロイ
  publish sync + deploy（HTML を直したあとに毎回これ）`);
    process.exit(sub === 'help' ? 0 : 1);
  }
} catch (e) {
  console.error('[ops-guide] エラー:', e.message || e);
  process.exit(1);
}
