/**
 * 652 予算変更: 摘要ドロップダウンを 651 と同一オプションにする（651 の API から options をコピー）。
 *
 * 補足: kintone は既存ルックアップの「コピー元キー」変更を無視することがあるため、
 * キーを job_lookup → matching_key に直すときは管理画面または API でフィールド削除→同一コードで再作成が必要。
 * （2026-04-10 に MCP で `ルックアップ` 再作成済みの環境では本スクリプトは摘要同期のみ使う想定。）
 */
import 'dotenv/config';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const baseHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  baseHeaders.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

async function getJson(url) {
  const res = await fetch(url, { headers: baseHeaders });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Not JSON: ${res.status} ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${json.code || ''} ${json.message || ''}`);
  return json;
}

async function putJson(url, body) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${json.code || ''} ${json.message || ''}`);
  return json;
}

const APP_652 = 652;
const APP_651 = 651;

async function main() {
  const [f652, f651] = await Promise.all([
    getJson(`${baseUrl}/k/v1/app/form/fields.json?app=${APP_652}`),
    getJson(`${baseUrl}/k/v1/app/form/fields.json?app=${APP_651}`),
  ]);

  const rev = f652.revision;
  const summary652 = f652.properties.summary;
  const summary651 = f651.properties.summary;
  if (!summary652 || summary652.type !== 'DROP_DOWN') throw new Error('652 summary not DROP_DOWN');
  if (!summary651 || summary651.type !== 'DROP_DOWN') throw new Error('651 summary not DROP_DOWN');

  summary652.options = summary651.options;
  summary652.defaultValue = summary652.defaultValue || '';

  const putBody = {
    app: APP_652,
    revision: rev,
    properties: {
      summary: summary652,
    },
  };

  const preview = await putJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, putBody);
  const newRev = preview.revision;

  const depUrl = `${baseUrl}/k/v1/preview/app/deploy.json`;
  const depRes = await fetch(depUrl, {
    method: 'POST',
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ apps: [{ app: String(APP_652), revision: newRev }] }),
  });
  const depText = await depRes.text();
  const depJson = JSON.parse(depText);
  if (!depRes.ok) {
    throw new Error(`deploy POST ${depRes.status} ${depJson.code || ''} ${depJson.message || ''}`);
  }
  console.log('652: preview form updated, deploy requested');

  for (let i = 0; i < 60; i++) {
    const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    stUrl.searchParams.set('apps[0]', String(APP_652));
    const stRes = await fetch(stUrl, { headers: baseHeaders });
    const stJson = await stRes.json();
    const st = stRes.ok && stJson.apps && stJson.apps[0] ? stJson.apps[0].status : null;
    if (st === 'SUCCESS') {
      console.log('652: deploy SUCCESS');
      return;
    }
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`652 deploy ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('652: deploy status timeout');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
