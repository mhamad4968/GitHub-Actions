#!/usr/bin/env node
/**
 * 595（社員マスタ）の現行の氏名・部署・グループを、674 / 594 の既存行へ一括反映する。
 * - 用途: CSV 移行などで台帳側に旧部署が残っているときの矯正（保存フックは触らない）
 * - 674: account_type=個人 かつ pc_status≠保管 かつ mail が 595 と一致する行のみ
 * - 594: mail が 595 と一致する行（種別問わず）
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/backfill-org-from-595-to-674-594.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/backfill-org-from-595-to-674-594.mjs --apply
 *
 * オプション:
 *   --674-only   674 のみ
 *   --594-only   594 のみ
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const APP_595 = 595;
const APP_594 = 594;
const APP_674 = 674;
const CHUNK = 100;

const FC_MAIL = 'mail';
const FC_NAME = 'user_name';
const FC_DEPT = 'dept_name';
const FC_GROUP = 'group_name';
const FC_TYPE = 'account_type';
const FC_PC_STATUS = 'pc_status';
const TYPE_PERSONAL = '個人';
const PC_STORAGE = '保管';

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

/** mail(小文字) → { user_name, dept_name, group_name }（同一メールは $id が大きい行を優先） */
function build595OrgByMail(rec595) {
  const sorted = [...rec595].sort(
    (a, b) => Number(valCell(a, '$id')) - Number(valCell(b, '$id')),
  );
  const map = new Map();
  for (const r of sorted) {
    const mk = normMail(valCell(r, FC_MAIL));
    if (!mk) continue;
    map.set(mk, {
      [FC_NAME]: valCell(r, FC_NAME),
      [FC_DEPT]: valCell(r, FC_DEPT),
      [FC_GROUP]: valCell(r, FC_GROUP),
    });
  }
  return map;
}

function orgPatchIfDiff(r, want) {
  const patch = {};
  for (const code of [FC_NAME, FC_DEPT, FC_GROUP]) {
    const w = String(want[code] ?? '');
    const c = String(valCell(r, code) ?? '');
    if (w !== c) patch[code] = { value: w };
  }
  return patch;
}

function main() {
  return (async () => {
    const dry = process.argv.includes('--dry-run');
    const apply = process.argv.includes('--apply');
    if (!dry && !apply) {
      console.error('Usage: ... backfill-org-from-595-to-674-594.mjs (--dry-run | --apply)');
      process.exit(1);
    }
    const only674 = process.argv.includes('--674-only');
    const only594 = process.argv.includes('--594-only');
    if (only674 && only594) {
      console.error('Cannot use both --674-only and --594-only');
      process.exit(1);
    }

    const logPath = path.join(REPO_ROOT, 'tmp', 'backfill-org-595-to-674-594.log.txt');
    const log = (line) => {
      console.log(line);
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, line + '\n', 'utf8');
    };

    if (apply) fs.writeFileSync(logPath, `started ${new Date().toISOString()}\n`, 'utf8');

    const fields595 = ['$id', FC_MAIL, FC_NAME, FC_DEPT, FC_GROUP];
    const rec595 = await fetchPaged(APP_595, fields595);
    const byMail = build595OrgByMail(rec595);
    log(`595 rows=${rec595.length} unique_mail_keys=${byMail.size}`);

    const updates594 = [];
    const updates674 = [];

    if (!only674) {
      const f594 = ['$id', '$revision', FC_MAIL, FC_NAME, FC_DEPT, FC_GROUP];
      const rec594 = await fetchPaged(APP_594, f594);
      for (const r of rec594) {
        const mk = normMail(valCell(r, FC_MAIL));
        if (!mk) continue;
        const want = byMail.get(mk);
        if (!want) continue;
        const patch = orgPatchIfDiff(r, want);
        if (Object.keys(patch).length === 0) continue;
        updates594.push({
          id: valCell(r, '$id'),
          revision: valCell(r, '$revision'),
          record: patch,
        });
      }
      log(`594 candidate_updates=${updates594.length}`);
    }

    if (!only594) {
      const f674 = ['$id', '$revision', FC_MAIL, FC_TYPE, FC_PC_STATUS, FC_NAME, FC_DEPT, FC_GROUP];
      const rec674 = await fetchPaged(APP_674, f674);
      for (const r of rec674) {
        if (valCell(r, FC_TYPE).trim() !== TYPE_PERSONAL) continue;
        if (valCell(r, FC_PC_STATUS).trim() === PC_STORAGE) continue;
        const mk = normMail(valCell(r, FC_MAIL));
        if (!mk) continue;
        const want = byMail.get(mk);
        if (!want) continue;
        const patch = orgPatchIfDiff(r, want);
        if (Object.keys(patch).length === 0) continue;
        updates674.push({
          id: valCell(r, '$id'),
          revision: valCell(r, '$revision'),
          record: patch,
        });
      }
      log(`674 candidate_updates=${updates674.length}`);
    }

    const preview = (label, arr) => {
      const n = Math.min(12, arr.length);
      for (let i = 0; i < n; i++) {
        const u = arr[i];
        log(`  sample ${label} $id=${u.id} patch=${JSON.stringify(u.record)}`);
      }
    };
    if (updates594.length) preview('594', updates594);
    if (updates674.length) preview('674', updates674);

    if (dry) {
      log('dry-run: no PUT');
      return;
    }

    async function putChunks(app, rows) {
      let done = 0;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK).map((x) => ({
          id: x.id,
          revision: x.revision,
          record: x.record,
        }));
        await fetchJson(`${baseUrl}/k/v1/records.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app, records: slice }),
        });
        done += slice.length;
        log(`PUT app=${app} ${done}/${rows.length}`);
      }
    }

    if (!only674 && updates594.length) await putChunks(APP_594, updates594);
    if (!only594 && updates674.length) await putChunks(APP_674, updates674);
    log(`done ${new Date().toISOString()}`);
  })();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
