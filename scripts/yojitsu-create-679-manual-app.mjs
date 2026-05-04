#!/usr/bin/env node
/**
 * 部署予実クイックマニュアル用 kintone アプリ（既定 Space 54 / thread 58）を preview で作成し、
 * 空フォームのまま本番 deploy する（カスタマイズは別途 `npm run deploy:679`）。
 *
 * 既に同名アプリがある場合は appId を表示して終了する。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-create-679-manual-app.mjs
 */
import 'dotenv/config';

const NAME = '部署予実クイックマニュアル';
const SPACE = Number(process.env.YOJITSU_SPACE_ID || 54);
const THREAD = Number(process.env.YOJITSU_THREAD_ID || 58);

function headers() {
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
  return { h, base };
}

async function api(base, h, method, path, body) {
  const url = base + path;
  let m = method;
  let hh = { ...h };
  let b;
  if (method === 'GET' && body) {
    m = 'POST';
    hh['X-HTTP-Method-Override'] = 'GET';
    b = JSON.stringify(body);
  } else if (method === 'GET') {
    b = undefined;
  } else {
    b = body ? JSON.stringify(body) : undefined;
  }
  const r = await fetch(url, { method: m, headers: hh, body: b });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${path} HTTP ${r.status} ${JSON.stringify(j)}`);
  return j;
}

async function main() {
  const { h, base } = headers();
  const found = await api(base, h, 'GET', '/k/v1/apps.json', { name: NAME });
  const apps = (found.apps || []).filter((a) => a.name === NAME);
  if (apps.length) {
    console.log('既存:', apps.map((a) => a.appId).join(', '));
    return;
  }
  const add = await api(base, h, 'POST', '/k/v1/preview/app.json', {
    name: NAME,
    space: SPACE,
    thread: THREAD,
  });
  const appId = Number(add.app);
  console.log('作成 app=', appId, 'revision=', add.revision);
  await api(base, h, 'POST', '/k/v1/preview/app/deploy.json', { apps: [{ app: appId }] });
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1200));
    const st = await api(base, h, 'GET', '/k/v1/preview/app/deploy.json', { apps: [appId] });
    const s = st.apps?.[0]?.status;
    console.log('deploy', s);
    if (s === 'SUCCESS') {
      console.log('完了:', `${base}/k/${appId}/`);
      return;
    }
    if (s === 'FAIL' || s === 'CANCEL') throw new Error(String(s));
  }
  throw new Error('timeout');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
