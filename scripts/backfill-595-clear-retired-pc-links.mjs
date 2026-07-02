#!/usr/bin/env node
/**
 * 退職済み 595 社員の pc_ledger_v1_list / pc_ledger_list を一括クリア（674 保管後の名残リンク解消）
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/backfill-595-clear-retired-pc-links.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/backfill-595-clear-retired-pc-links.mjs --apply
 */
import process from 'node:process';

const APP_595 = 595;
const FC_EMP = 'employment_status';
const EMP_RETIRED = '退職';
const FC595_PC674_SUB = 'pc_ledger_v1_list';
const FC595_PC594_SUB = 'pc_ledger_list';

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

function subtableRowCount(r, subCode) {
  const f = r[subCode];
  if (!f || !Array.isArray(f.value)) return 0;
  return f.value.length;
}

async function fetchAll595RetiredWithLinks() {
  const fields = ['$id', '$revision', 'user_name', 'mail', FC_EMP, FC595_PC674_SUB, FC595_PC594_SUB];
  const all = [];
  const limit = 500;
  let offset = 0;
  for (;;) {
    const q = `${FC_EMP} in ("${EMP_RETIRED}") order by $id asc limit ${limit} offset ${offset}`;
    const params = new URLSearchParams();
    params.set('app', String(APP_595));
    params.set('query', q);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const url = `${baseUrl}/k/v1/records.json?${params.toString()}`;
    const json = await fetchJson(url);
    const batch = json.records || [];
    for (const r of batch) {
      if (subtableRowCount(r, FC595_PC674_SUB) || subtableRowCount(r, FC595_PC594_SUB)) {
        all.push(r);
      }
    }
    if (batch.length < limit) break;
    offset += limit;
  }
  return all;
}

async function clear595Subtables(r, dryRun) {
  const id = String(r.$id.value);
  const rev = String(r.$revision.value);
  const patch = {};
  if (subtableRowCount(r, FC595_PC674_SUB)) patch[FC595_PC674_SUB] = { value: [] };
  if (subtableRowCount(r, FC595_PC594_SUB)) patch[FC595_PC594_SUB] = { value: [] };
  if (!Object.keys(patch).length) return { id, skipped: true };
  if (dryRun) return { id, dryRun: true, patchKeys: Object.keys(patch) };
  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    body: JSON.stringify({ app: APP_595, id, revision: rev, record: patch }),
  });
  return { id, cleared: true, patchKeys: Object.keys(patch) };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
  console.log(`[backfill-595-clear-retired-pc-links] mode=${dryRun ? 'dry-run' : 'apply'}`);
  const targets = await fetchAll595RetiredWithLinks();
  console.log(`[backfill-595-clear-retired-pc-links] retired with pc_ledger links: ${targets.length}`);
  let ok = 0;
  let fail = 0;
  for (const r of targets) {
    const name = (r.user_name && r.user_name.value) || (r.mail && r.mail.value) || '';
    try {
      const res = await clear595Subtables(r, dryRun);
      ok += 1;
      console.log(
        `  $id=${res.id} ${name} ${dryRun ? 'would clear' : 'cleared'} [${(res.patchKeys || []).join(', ')}]`,
      );
    } catch (e) {
      fail += 1;
      console.error(`  NG $id=${r.$id.value} ${name}: ${e.message}`);
    }
  }
  console.log(`[backfill-595-clear-retired-pc-links] done ok=${ok} fail=${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
