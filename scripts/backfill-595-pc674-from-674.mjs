#!/usr/bin/env node
/**
 * 674（新・PC台帳）の個人・利用中レコードを mail で突き合わせ、595 の pc_ledger_v1_list に不足分の
 * pc_674_record_id を追記する（最大2件／社員あたり。既存行は維持）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/backfill-595-pc674-from-674.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/backfill-595-pc674-from-674.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const APP_595 = 595;
const APP_674 = 674;
const FC_MAIL = 'mail';
const FC_TYPE = 'account_type';
const FC_PC_STATUS = 'pc_status';
const TYPE_PERSONAL = '個人';
const PC_STORAGE = '保管';
const FC595_SUB = 'pc_ledger_v1_list';
const FC595_CELL = 'pc_674_record_id';
const PERSONAL_MAX = 2;

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

function normMail(m) {
  return String(m ?? '')
    .trim()
    .toLowerCase();
}

async function fetchPaged(app, fields, orderField = 'レコード番号') {
  const records = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const params = new URLSearchParams();
    params.set('app', String(app));
    params.set('query', `order by ${orderField} asc limit ${limit} offset ${offset}`);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const data = await fetchJson(`${baseUrl}/k/v1/records.json?${params.toString()}`);
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

function getSub674IdSet(rec595) {
  const f = rec595[FC595_SUB];
  const set = new Set();
  if (!f || !Array.isArray(f.value)) return set;
  for (const row of f.value) {
    const cell = row.value && row.value[FC595_CELL];
    if (!cell || cell.value == null || cell.value === '') continue;
    const t = String(cell.value).trim();
    if (!t || t === '0') continue;
    set.add(t);
  }
  return set;
}

function cloneSubRowsForPut(rows) {
  return rows.map((row) => {
    const o = { value: {} };
    if (row.id) o.id = row.id;
    const cell = row.value && row.value[FC595_CELL];
    o.value[FC595_CELL] = cell && cell.value != null && cell.value !== '' ? { value: cell.value } : { value: '' };
    return o;
  });
}

function main() {
  return (async () => {
    const dry = process.argv.includes('--dry-run');
    const apply = process.argv.includes('--apply');
    if (!dry && !apply) {
      console.error('Usage: ... backfill-595-pc674-from-674.mjs (--dry-run | --apply)');
      process.exit(1);
    }

    const logPath = path.join(REPO_ROOT, 'tmp', 'backfill-595-pc674-from-674.log.txt');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, `${dry ? 'dry-run' : 'apply'} ${new Date().toISOString()}\n`, 'utf8');
    const log = (line) => {
      console.log(line);
      fs.appendFileSync(logPath, line + '\n', 'utf8');
    };

    const fields674 = ['$id', FC_MAIL, FC_TYPE, FC_PC_STATUS];
    const flat674 = await fetchPaged(APP_674, fields674);

    /** @type {Map<string, string[]>} mail -> 674 $id 昇順 */
    const byMail = new Map();
    for (const r of flat674) {
      if (valCell(r, FC_TYPE).trim() !== TYPE_PERSONAL) continue;
      if (valCell(r, FC_PC_STATUS).trim() === PC_STORAGE) continue;
      const mk = normMail(valCell(r, FC_MAIL));
      if (!mk) continue;
      const id674 = valCell(r, '$id').trim();
      if (!id674) continue;
      if (!byMail.has(mk)) byMail.set(mk, []);
      byMail.get(mk).push(id674);
    }
    for (const [, arr] of byMail) {
      arr.sort((a, b) => Number(a) - Number(b));
    }
    log(`674 eligible rows grouped: ${byMail.size} mails, total 674 refs=${[...byMail.values()].reduce((n, a) => n + a.length, 0)}`);

    const fields595 = ['$id', '$revision', FC_MAIL, FC595_SUB];
    const rec595 = await fetchPaged(APP_595, fields595);

    let wouldUpdate = 0;
    let skipped = 0;
    let capBlocked = 0;
    const samples = [];
    const CAP_LOG_MAX = 40;
    let capLogCount = 0;

    for (const emp of rec595) {
      const mk = normMail(valCell(emp, FC_MAIL));
      if (!mk) {
        skipped++;
        continue;
      }
      const candidates = byMail.get(mk);
      if (!candidates || !candidates.length) {
        skipped++;
        continue;
      }
      if (!emp[FC595_SUB]) {
        log(`[skip] 595 $id=${valCell(emp, '$id')} no field ${FC595_SUB}`);
        skipped++;
        continue;
      }

      const existingRows = Array.isArray(emp[FC595_SUB].value) ? [...emp[FC595_SUB].value] : [];
      const have = getSub674IdSet(emp);
      const nextRows = cloneSubRowsForPut(existingRows);
      let added = 0;
      const addedIds = [];
      for (const id674 of candidates) {
        if (have.size >= PERSONAL_MAX) break;
        if (have.has(id674)) continue;
        have.add(id674);
        const cell = {};
        cell[FC595_CELL] = { value: id674 };
        nextRows.push({ value: cell });
        added++;
        addedIds.push(id674);
      }
      const stillUnlinked = candidates.filter((id) => !have.has(id));
      if (stillUnlinked.length && have.size >= PERSONAL_MAX) {
        capBlocked++;
        if (capLogCount < CAP_LOG_MAX) {
          capLogCount++;
          log(
            `[cap] 595 $id=${valCell(emp, '$id')} mail=${mk} 台数上限のため未反映674=${stillUnlinked.join(',')}`,
          );
        }
      }
      if (added === 0) {
        skipped++;
        continue;
      }
      wouldUpdate++;
      if (samples.length < 15) {
        samples.push(`595 $id=${valCell(emp, '$id')} mail=${mk} add674=[${addedIds.join(', ')}]`);
      }

      if (dry) continue;

      const id595 = valCell(emp, '$id').trim();
      const rev = valCell(emp, '$revision').trim();
      await fetchJson(`${baseUrl}/k/v1/record.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: APP_595,
          id: id595,
          revision: rev,
          record: {
            [FC595_SUB]: { value: nextRows },
          },
        }),
      });
      log(`[apply] 595 id=${id595} +${added} rows`);
    }

    log(`summary would_update=${wouldUpdate} skipped=${skipped} cap_blocked_employees=${capBlocked} dry=${dry}`);
    for (const s of samples) log(`  sample: ${s}`);
    if (dry) log('dry-run: no PUT');
    else log(`done ${new Date().toISOString()}`);
  })();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
