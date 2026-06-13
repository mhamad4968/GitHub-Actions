/**
 * Kintone 疎通確認（認証・595 + 670/671/672/673/674 のアプリ設定が読めるか）。
 * `npm run kintone:test` から実行。
 *
 * **594（旧PC台帳）は既定から除外**（廃止予定・`docs/plans/2026-04-21-new-pc-ledger-spec.md` §1.5）。移行・監査で疎通が必要なときだけ
 * **`INCLUDE_LEGACY_APP_594=1`** を付けて実行する。
 *
 * 旧 PC 台帳スタック: 595（626/627 は本番から削除済みのため対象外。採番後継は 672）
 * 新 PC 台帳スタック: 670 (環境設定) / 671 (M365 管理) / 672 (jbm 採番) / 673 (sjbm 採番) / 674 (新・PC台帳ver.1)
 * ソフトウェア台帳スタック: 714 (DB) / 715 (Dash)
 */
import 'dotenv/config';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');
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

/** 626/627 は GAIA 上削除済み（404）。kintone-apps.md の 672 が採番系の後継。594 は廃止予定のため既定では除外（INCLUDE_LEGACY_APP_594=1 で先頭に追加）。 */
const PC_STACK_APPS = [
  ...(process.env.INCLUDE_LEGACY_APP_594 === '1' ? [594] : []),
  595, 670, 671, 672, 673, 674,
];

const SOFTWARE_LEDGER_APPS = [714, 715];

async function fetchJson(url) {
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 400);
    throw new Error(`HTTP ${res.status} ${msg}`);
  }
  return json;
}

let failures = 0;

for (const app of [...PC_STACK_APPS, ...SOFTWARE_LEDGER_APPS]) {
  const u = new URL(`${baseUrl}/k/v1/app.json`);
  u.searchParams.set('id', String(app));
  try {
    const json = await fetchJson(u.toString());
    const name = json?.name != null ? String(json.name) : '(no name)';
    console.log(`[ok] app ${app}: ${name}`);
  } catch (e) {
    failures += 1;
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[ng] app ${app}: ${msg}`);
  }
}

if (failures > 0) {
  console.error(`[kintone:test] ${failures} app(s) failed (see [ng] lines above)`);
  process.exit(1);
}

if (process.env.INCLUDE_LEGACY_APP_594 !== '1') {
  console.log('[kintone:test] app 594 は既定でスキップ（移行時のみ INCLUDE_LEGACY_APP_594=1）');
}
console.log('[kintone:test] PC台帳 + ソフトウェア台帳スタック疎通 OK');
