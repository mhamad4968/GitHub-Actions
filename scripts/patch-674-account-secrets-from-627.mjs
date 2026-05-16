#!/usr/bin/env node
/**
 * 674 既存行に、627 のアカウント情報を B-1 と同条件で PUT 同期する。
 * - 対象: `account_type`=個人 かつ `pc_status`≠保管 かつ **627 行の特定に成功した**行（674 に `legacy_record_id_594` が無い前提のため、突合は多段）
 * - **突合の優先順**: ① `mail`（trim・小文字）② `mail_acct`、無ければ `mail` の @ 前（627・674 とも同ルール）③ `logon_name`（trim・小文字）。いずれも 627 は **先に出てきた行を採用**（同一キーが複数 627 行にあると誤結合の余地あり）
 * - フィールド: logon / mail / M365 / 各種 PW / VPN など 674 が持つアカウント系（627 に無い列は触らない）
 * - 627 が空で 674 にだけ値がある列は上書きしない（手入力・別経路の値を消さない）
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/patch-674-account-secrets-from-627.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/patch-674-account-secrets-from-627.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_627 = 627;
const APP_674 = 674;
const CHUNK = 100;

/** 627 から 674 に載せるアカウント系（674 form に存在するもの） */
const PATCH_FIELD_CODES = [
  'logon_name',
  'logon_pw',
  'windows_name',
  'mail',
  'mail_acct',
  'mail_pw',
  'm365_id',
  'm365_pw',
  'gb_id',
  'gb_pw',
  'sb_id',
  'sb_pw',
  'vpn_id',
  'vpn_pw',
];

const FIELDS_627 = [
  '$id',
  'レコード番号',
  'pc_594_record_id',
  'logon_name',
  'logon_pw',
  'windows_name',
  'mail',
  'mail_acct',
  'mail_pw',
  'm365_id',
  'm365_pw',
  'gb_id',
  'gb_pw',
  'sb_id',
  'sb_pw',
  'vpn_id',
  'vpn_pw',
];

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  authHeaders.Authorization =
    'Basic ' +
    Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64');
}

async function fetchJson(url, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const h = { ...authHeaders, ...init.headers };
  if (method !== 'GET' && init.body != null) {
    h['Content-Type'] = h['Content-Type'] || 'application/json';
  }
  const res = await fetch(url, { ...init, headers: h });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.message || json?.code || text.slice(0, 2000);
    throw new Error(`${res.status} ${msg}`);
  }
  return json;
}

function valCell(r, code) {
  const field = r[code];
  if (!field || field.value == null) return '';
  const v = field.value;
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' && x?.code ? x.code : x)).join(',');
  return String(v);
}

function mailLocalPartFromMail(mail) {
  const t = String(mail ?? '').trim();
  const i = t.indexOf('@');
  if (i <= 0) return '';
  return t.slice(0, i);
}

function deriveM365IdFromMailAcct(mailAcct) {
  const acct = String(mailAcct ?? '').trim();
  if (!acct) return '';
  const rawDom = (process.env.M365_DOMAIN || 'kensetsutoso01.onmicrosoft.com').trim();
  const dom = rawDom.replace(/^@/, '');
  return `${acct}@${dom}`;
}

function normalizeMailKey(mail) {
  return String(mail ?? '').trim().toLowerCase();
}

function normalizeAcctKey(s) {
  return String(s ?? '').trim().toLowerCase();
}

function normalizeLogonKey(s) {
  return String(s ?? '').trim().toLowerCase();
}

/** `mail_acct` があればそれ、無ければ `mail` の @ より前（627・674 共通） */
function acctKeyFromAccountRow(row, mailCode, acctCode) {
  const ac = valCell(row, acctCode).trim();
  if (ac) return normalizeAcctKey(ac);
  return normalizeAcctKey(mailLocalPartFromMail(valCell(row, mailCode)));
}

/**
 * 627 行から突合用 Map を構築（各キーは先勝ち。同一キーが複数 627 行にあると誤結合の余地あり）。
 */
function build627Lookup(rec627) {
  const byMail = new Map();
  const byAcct = new Map();
  const byLogon = new Map();
  for (const r of rec627) {
    const mk = normalizeMailKey(valCell(r, 'mail'));
    if (mk && !byMail.has(mk)) byMail.set(mk, r);

    const ak = acctKeyFromAccountRow(r, 'mail', 'mail_acct');
    if (ak && !byAcct.has(ak)) byAcct.set(ak, r);

    const lk = normalizeLogonKey(valCell(r, 'logon_name'));
    if (lk && !byLogon.has(lk)) byLogon.set(lk, r);
  }
  return { byMail, byAcct, byLogon };
}

function resolveK627(r674, lookup) {
  const mk = normalizeMailKey(valCell(r674, 'mail'));
  if (mk && lookup.byMail.has(mk)) return lookup.byMail.get(mk);

  const ak674 = acctKeyFromAccountRow(r674, 'mail', 'mail_acct');
  if (ak674 && lookup.byAcct.has(ak674)) return lookup.byAcct.get(ak674);

  const lk = normalizeLogonKey(valCell(r674, 'logon_name'));
  if (lk && lookup.byLogon.has(lk)) return lookup.byLogon.get(lk);

  return undefined;
}

async function fetchPaged(app, fields) {
  const records = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const params = new URLSearchParams();
    params.set('app', String(app));
    params.set('query', `order by レコード番号 asc limit ${limit} offset ${offset}`);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const data = await fetchJson(`${baseUrl}/k/v1/records.json?${params.toString()}`);
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

/**
 * build-b1-import-csv と同様の「627 主＋メール系フォールバック」で目標値を組み立てる（プレーン文字列）
 */
function effectiveAccountPlain(k627, r674) {
  const mail674 = valCell(r674, 'mail').trim();
  const kMail = valCell(k627, 'mail').trim();
  const mail = kMail || mail674;

  let mail_acct = valCell(k627, 'mail_acct').trim();
  if (!mail_acct) {
    mail_acct = mailLocalPartFromMail(mail) || mailLocalPartFromMail(kMail) || mailLocalPartFromMail(mail674);
  }
  let m365_id = valCell(k627, 'm365_id').trim();
  if (!m365_id && mail_acct) m365_id = deriveM365IdFromMailAcct(mail_acct);

  return {
    logon_name: valCell(k627, 'logon_name').trim(),
    logon_pw: valCell(k627, 'logon_pw').trim(),
    windows_name: valCell(k627, 'windows_name').trim(),
    mail,
    mail_acct,
    mail_pw: valCell(k627, 'mail_pw').trim(),
    m365_id,
    m365_pw: valCell(k627, 'm365_pw').trim(),
    gb_id: valCell(k627, 'gb_id').trim(),
    gb_pw: valCell(k627, 'gb_pw').trim(),
    sb_id: valCell(k627, 'sb_id').trim(),
    sb_pw: valCell(k627, 'sb_pw').trim(),
    vpn_id: valCell(k627, 'vpn_id').trim(),
    vpn_pw: valCell(k627, 'vpn_pw').trim(),
  };
}

/** 627 が空でも 674 にだけ値がある列は消さない。差分がある列だけ kintone 形式で返す */
function buildPartialRecordPatch(r674, wantPlain) {
  const rec = {};
  for (const code of PATCH_FIELD_CODES) {
    const want = wantPlain[code] ?? '';
    const cur = valCell(r674, code);
    if (want === cur) continue;
    const wt = String(want ?? '').trim();
    const ct = String(cur ?? '').trim();
    if (!wt && ct) continue;
    rec[code] = { value: String(want ?? '') };
  }
  return rec;
}

function hasRecordFields(obj) {
  return obj && Object.keys(obj).length > 0;
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  if (!dry && !apply) {
    console.error('Usage: ... patch-674-account-secrets-from-627.mjs (--dry-run | --apply)');
    process.exit(1);
  }

  const logPath = path.join(REPO_ROOT, 'tmp', 'patch-674-secrets-from-627.log.txt');
  const log = (line) => {
    console.log(line);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, line + '\n', 'utf8');
  };

  if (apply) fs.writeFileSync(logPath, `started ${new Date().toISOString()}\n`, 'utf8');

  const fields674 = ['$id', 'account_type', 'pc_status', ...PATCH_FIELD_CODES];
  const [rec627, flat674] = await Promise.all([
    fetchPaged(APP_627, FIELDS_627),
    fetchPaged(APP_674, fields674),
  ]);

  const lookup627 = build627Lookup(rec627);

  const updates = [];
  let skipped = 0;
  for (const r of flat674) {
    const acc = valCell(r, 'account_type').trim();
    const st = valCell(r, 'pc_status').trim();
    if (acc !== '個人' || st === '保管') {
      skipped++;
      continue;
    }
    const k627 = resolveK627(r, lookup627);
    if (!k627) {
      skipped++;
      continue;
    }
    const wantPlain = effectiveAccountPlain(k627, r);
    const patch = buildPartialRecordPatch(r, wantPlain);
    if (!hasRecordFields(patch)) {
      skipped++;
      continue;
    }
    const id674 = valCell(r, '$id').trim();
    updates.push({ id: id674, record: patch });
  }

  log(
    `627 rows=${rec627.length} 674 rows=${flat674.length} ` +
      `627_keys mail=${lookup627.byMail.size} mail_acct_derived=${lookup627.byAcct.size} logon=${lookup627.byLogon.size}`,
  );
  log(`to_update=${updates.length} skipped_nochange_or_ineligible=${skipped}`);

  if (dry) {
    log('dry-run: no PUT');
    return;
  }

  let done = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const slice = updates.slice(i, i + CHUNK);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      body: JSON.stringify({ app: APP_674, records: slice }),
    });
    done += slice.length;
    log(`PUT ${done}/${updates.length}`);
  }
  log(`done ${new Date().toISOString()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
