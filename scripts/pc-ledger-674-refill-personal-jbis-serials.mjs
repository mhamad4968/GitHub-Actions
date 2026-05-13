#!/usr/bin/env node
/**
 * 【危険・非推奨】674 個人 PC 名（JBIS+連番-YYYYMM）の既存行一括振り直し。
 * 通常運用は customize の空き若番採番（`pc_name` 空のみ）。本スクリプトは **登録済み JBIS 名を書き換える**。
 * 2026-05-13 に誤実行→ `pc-ledger-674-revert-jbis-refill.mjs` とログから復元済。**`--apply` は CEO 明示 GO ＋ dry-run ログ確認後のみ**。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-refill-personal-jbis-serials.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-refill-personal-jbis-serials.mjs --apply --ack-rebatch-existing-jbis-names
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_674 = 674;
const CHUNK = 100;

const APPLY = process.argv.includes('--apply');
const DRY = !APPLY;
const ACK_REBATCH = process.argv.includes('--ack-rebatch-existing-jbis-names');

if (APPLY && !ACK_REBATCH) {
  console.error(
    '[674-jbis-refill] REFUSED: --apply requires --ack-rebatch-existing-jbis-names (existing JBIS pc_name rebatch). Run --dry-run first.',
  );
  process.exit(2);
}

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
  return String(field.value).trim();
}

function formatYYYYMMJst() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  let y = '';
  let mo = '';
  for (const p of parts) {
    if (p.type === 'year') y = p.value;
    if (p.type === 'month') mo = p.value.padStart(2, '0');
  }
  return y && mo ? `${y}${mo}` : '';
}

function formatSerialDigits(n) {
  const k = Math.floor(Number(n));
  if (!Number.isFinite(k) || k < 1) return '0001';
  if (k <= 9999) return String(k).padStart(4, '0');
  return String(k);
}

function parsePersonalJbisSerial(pcName) {
  const t = String(pcName || '').trim();
  if (/^S-JBIS/i.test(t)) return null;
  const m = /^JBIS(\d+)(?:-(\d{6}))?/i.exec(t);
  if (!m) return null;
  const serial = parseInt(m[1], 10);
  if (!Number.isFinite(serial) || serial < 1) return null;
  return { serial, yyyymm: m[2] || '' };
}

function isJbisPersonalRow(r) {
  if (valCell(r, 'account_type') !== '個人') return false;
  if (valCell(r, 'pc_status') === '廃棄') return false;
  const pc = valCell(r, 'pc_name');
  if (!pc || /^S-JBIS/i.test(pc)) return false;
  return /^JBIS/i.test(pc);
}

async function fetchAllPersonal674() {
  const fields = ['$id', 'account_type', 'pc_status', 'pc_name', 'pc_serial_no', 'user_name'];
  const rows = [];
  let offset = 0;
  while (true) {
    const q = `account_type in ("個人") order by $id asc limit ${CHUNK} offset ${offset}`;
    const params = new URLSearchParams();
    params.set('app', String(APP_674));
    params.set('query', q);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const json = await fetchJson(`${baseUrl}/k/v1/records.json?${params.toString()}`);
    const batch = json.records || [];
    rows.push(...batch);
    if (batch.length < CHUNK) break;
    offset += CHUNK;
  }
  return rows;
}

function buildPcName(serial, yyyymm) {
  const ym = yyyymm || formatYYYYMMJst();
  return `JBIS${formatSerialDigits(serial)}-${ym}`;
}

async function putRecords(updates) {
  for (let i = 0; i < updates.length; i += CHUNK) {
    const slice = updates.slice(i, i + CHUNK);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      body: JSON.stringify({ app: APP_674, records: slice }),
    });
  }
}

async function main() {
  const rows = await fetchAllPersonal674();
  const jbisRows = rows.filter(isJbisPersonalRow).sort((a, b) => Number(valCell(a, '$id')) - Number(valCell(b, '$id')));

  const used = new Set();
  for (const r of rows) {
    if (valCell(r, 'pc_status') === '廃棄') continue;
    const parsed = parsePersonalJbisSerial(valCell(r, 'pc_name'));
    if (!parsed) continue;
    if (!isJbisPersonalRow(r)) used.add(parsed.serial);
  }

  let nextCandidate = 1;
  function takeNextSerial() {
    while (used.has(nextCandidate)) nextCandidate += 1;
    const n = nextCandidate;
    used.add(n);
    nextCandidate += 1;
    return n;
  }

  const plan = [];
  for (const r of jbisRows) {
    const id = valCell(r, '$id');
    const before = valCell(r, 'pc_name');
    const parsed = parsePersonalJbisSerial(before);
    const yyyymm = parsed?.yyyymm || '';
    const serial = takeNextSerial();
    const after = buildPcName(serial, yyyymm);
    if (before === after && valCell(r, 'pc_serial_no') === String(serial)) continue;
    plan.push({
      id,
      before,
      after,
      serial,
      user_name: valCell(r, 'user_name'),
      record: {
        id,
        record: {
          pc_name: { value: after },
          pc_serial_no: { value: String(serial) },
        },
      },
    });
  }

  const report = {
    mode: DRY ? 'dry-run' : 'apply',
    scannedPersonal: rows.length,
    jbisTargets: jbisRows.length,
    plannedUpdates: plan.length,
    updates: plan.map((p) => ({
      id: p.id,
      user_name: p.user_name,
      before: p.before,
      after: p.after,
      serial: p.serial,
    })),
  };

  const outDir = path.join(REPO_ROOT, 'logs');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(outDir, `pc-ledger-674-jbis-refill-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(
    `[674-jbis-refill] mode=${report.mode} personal=${report.scannedPersonal} jbis=${report.jbisTargets} update=${report.plannedUpdates}`,
  );
  console.log(`[674-jbis-refill] report=${outPath}`);
  for (const p of plan.slice(0, 50)) {
    console.log(`  id=${p.id} ${p.before} -> ${p.after}`);
  }
  if (plan.length > 50) console.log(`  ... +${plan.length - 50} more`);

  if (APPLY && plan.length > 0) {
    await putRecords(plan.map((p) => p.record));
    console.log(`[674-jbis-refill] PUT ok (${plan.length} records)`);
  } else if (APPLY) {
    console.log('[674-jbis-refill] nothing to apply');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
