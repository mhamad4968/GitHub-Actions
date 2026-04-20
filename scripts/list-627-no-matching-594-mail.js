import 'dotenv/config';

/**
 * アカウント管理台帳（627）のうち、PC台帳番号（pc_594_record_id）が空で、
 * かつ PC台帳（594）に **同一 mail（前後トリム・627 と同じ完全一致クエリ）** のレコードが
 * 1 件も無い行を CSV 化する。`backfill:594:627_cross_refs` の fallback `no594` 調査用。
 *
 *   npm run list:627:no-matching-594-mail
 *   npm run list:627:no-matching-594-mail -- --bom
 *
 * 例: npm run list:627:no-matching-594-mail > reports/627-no594-mail.csv
 */
function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
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

function headersWithoutContentType(h) {
  const out = { ...h };
  delete out['Content-Type'];
  return out;
}

async function getRecords(app, query, fields) {
  const params = new URLSearchParams();
  params.set('app', String(app));
  params.set('query', query);
  (fields || []).forEach((f, i) => params.set(`fields[${i}]`, f));
  const url = new URL(`${baseUrl}/k/v1/records.json?${params.toString()}`);
  const res = await fetch(url, { method: 'GET', headers: headersWithoutContentType(headers) });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) {
    throw new Error(`GET records ${json?.code || ''} ${json?.message || text}`.trim());
  }
  return json.records || [];
}

function normId(v) {
  if (v == null || v === '') return '';
  return String(v).trim();
}

const APP_594 = 594;
const APP_595 = 595;
const APP_627 = 627;
const FC_MAIL = 'mail';
const FC_PC594 = 'pc_594_record_id';
const FC_LEDGER = 'ledger_record_id';

const useBom = process.argv.includes('--bom');

/** @type {Set<string>} */
const mails594 = new Set();
let o594 = 0;
const p594 = 500;
for (;;) {
  const batch = await getRecords(
    APP_594,
    `order by $id asc limit ${p594} offset ${o594}`,
    [FC_MAIL],
  );
  if (!batch.length) break;
  o594 += batch.length;
  for (const r of batch) {
    const m = r[FC_MAIL] && r[FC_MAIL].value != null ? String(r[FC_MAIL].value).trim() : '';
    if (m) mails594.add(m);
  }
}

/** 627 $id -> 595 の代表1件（ledger_record_id で紐づく） */
/** @type {Map<string, { id595: string, mail: string, userName: string }>} */
const ledger627To595 = new Map();
let o595 = 0;
const p595 = 100;
for (;;) {
  const batch = await getRecords(
    APP_595,
    `order by $id asc limit ${p595} offset ${o595}`,
    ['$id', FC_MAIL, 'user_name', FC_LEDGER],
  );
  if (!batch.length) break;
  o595 += batch.length;
  for (const r of batch) {
    const id595 = r.$id && r.$id.value != null ? String(r.$id.value) : '';
    const lid = normId(r[FC_LEDGER] && r[FC_LEDGER].value);
    if (!id595 || !lid) continue;
    if (!ledger627To595.has(lid)) {
      const mail =
        r[FC_MAIL] && r[FC_MAIL].value != null ? String(r[FC_MAIL].value).trim() : '';
      const userName =
        r.user_name && r.user_name.value != null ? String(r.user_name.value) : '';
      ledger627To595.set(lid, { id595, mail, userName });
    }
  }
}

const rowsOut = [];
let o627 = 0;
const p627 = 100;
for (;;) {
  const batch = await getRecords(
    APP_627,
    `order by $id asc limit ${p627} offset ${o627}`,
    [
      '$id',
      FC_MAIL,
      'user_name',
      'dept_name',
      'group_name',
      'employment_status',
      'account_state',
      FC_PC594,
    ],
  );
  if (!batch.length) break;
  o627 += batch.length;

  for (const r of batch) {
    const id627 = r.$id && r.$id.value != null ? String(r.$id.value) : '';
    const mail = r[FC_MAIL] && r[FC_MAIL].value != null ? String(r[FC_MAIL].value).trim() : '';
    const userName = r.user_name && r.user_name.value != null ? String(r.user_name.value) : '';
    const dept = r.dept_name && r.dept_name.value != null ? String(r.dept_name.value) : '';
    const group = r.group_name && r.group_name.value != null ? String(r.group_name.value) : '';
    const emp =
      r.employment_status && r.employment_status.value != null
        ? String(r.employment_status.value)
        : '';
    const acct = r.account_state && r.account_state.value != null ? String(r.account_state.value) : '';
    const pc = normId(r[FC_PC594] && r[FC_PC594].value);

    if (pc) continue;

    const from595 = ledger627To595.get(id627) || null;
    const id595 = from595 ? from595.id595 : '';
    const mail595 = from595 ? from595.mail : '';
    const user595 = from595 ? from595.userName : '';

    if (!mail) {
      rowsOut.push({
        reason: 'empty_mail_on_627',
        id627,
        mail627: '',
        user627: userName,
        dept627: dept,
        group627: group,
        emp627: emp,
        acct627: acct,
        id595,
        mail595,
        user595,
      });
      continue;
    }
    if (!mails594.has(mail)) {
      rowsOut.push({
        reason: 'no_594_same_mail',
        id627,
        mail627: mail,
        user627: userName,
        dept627: dept,
        group627: group,
        emp627: emp,
        acct627: acct,
        id595,
        mail595,
        user595,
      });
    }
  }
}

function csvCell(s) {
  const t = String(s ?? '');
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

const hdr = [
  'reason',
  '627_record_id',
  '627_mail',
  '627_user_name',
  '627_dept_name',
  '627_group_name',
  '627_employment_status',
  '627_account_state',
  '595_record_id_if_linked',
  '595_mail_if_linked',
  '595_user_name_if_linked',
];
const lines = [hdr.map(csvCell).join(',')];
for (const row of rowsOut) {
  lines.push(
    [
      row.reason,
      row.id627,
      row.mail627,
      row.user627,
      row.dept627,
      row.group627,
      row.emp627,
      row.acct627,
      row.id595,
      row.mail595,
      row.user595,
    ]
      .map(csvCell)
      .join(','),
  );
}

const body = lines.join('\r\n');
const out = useBom ? `\uFEFF${body}` : body;
process.stdout.write(`${out}\n`);

console.error(
  `[list-627-no-matching-594-mail] 594 ユニークmail=${mails594.size} 627(pc空かつ条件一致)=${rowsOut.length} ` +
    `（reason=no_594_same_mail|empty_mail_on_627）`,
);
