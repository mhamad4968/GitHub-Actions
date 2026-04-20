import 'dotenv/config';

/**
 * 社員マスタ（595）のうち、PC台帳（594）に **同一 mail（完全一致・前後トリム）** のレコードが1件も無い行をリスト化する。
 * PC台帳をエクスポートして mail を突き合わせる用途の代替として、API で一覧化できる。
 *
 *   npm run list:595:no-pc-mail-match
 *   npm run list:595:no-pc-mail-match -- --bom        （Excel 向け UTF-8 BOM 付き）
 *
 * 標準出力に CSV（ヘッダ付き）。リダイレクト例:
 *   npm run list:595:no-pc-mail-match > reports/595-no-pc-mail.csv
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

const APP_595 = 595;
const APP_594 = 594;
const FC_MAIL = 'mail';
const useBom = process.argv.includes('--bom');

/** @type {Set<string>} */
const mails594 = new Set();
let offset594 = 0;
const page594 = 500;
for (;;) {
  const batch = await getRecords(
    APP_594,
    `order by $id asc limit ${page594} offset ${offset594}`,
    [FC_MAIL]
  );
  if (!batch.length) break;
  offset594 += batch.length;
  for (const r of batch) {
    const m = r[FC_MAIL] && r[FC_MAIL].value != null ? String(r[FC_MAIL].value).trim() : '';
    if (m) mails594.add(m);
  }
}

const rowsOut = [];
let offset595 = 0;
const page595 = 100;
for (;;) {
  const batch = await getRecords(
    APP_595,
    `order by $id asc limit ${page595} offset ${offset595}`,
    ['$id', FC_MAIL, 'user_name', 'dept_name', 'group_name']
  );
  if (!batch.length) break;
  offset595 += batch.length;

  for (const r of batch) {
    const id595 = r.$id && r.$id.value != null ? String(r.$id.value) : '';
    const mail =
      r[FC_MAIL] && r[FC_MAIL].value != null ? String(r[FC_MAIL].value).trim() : '';
    const userName = r.user_name && r.user_name.value != null ? String(r.user_name.value) : '';
    const dept = r.dept_name && r.dept_name.value != null ? String(r.dept_name.value) : '';
    const group = r.group_name && r.group_name.value != null ? String(r.group_name.value) : '';

    if (!mail) {
      rowsOut.push({
        reason: 'no_mail',
        id595,
        mail: '',
        userName,
        dept,
        group,
      });
      continue;
    }
    if (!mails594.has(mail)) {
      rowsOut.push({
        reason: 'no_pc_match',
        id595,
        mail,
        userName,
        dept,
        group,
      });
    }
  }
}

function csvCell(s) {
  const t = String(s ?? '');
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

const lines = [
  ['reason', '595_record_id', 'mail', 'user_name', 'dept_name', 'group_name'].map(csvCell).join(','),
];
for (const row of rowsOut) {
  lines.push(
    [row.reason, row.id595, row.mail, row.userName, row.dept, row.group].map(csvCell).join(',')
  );
}

const body = lines.join('\r\n');
const out = useBom ? `\uFEFF${body}` : body;
process.stdout.write(`${out}\n`);

console.error(
  `[list-595-no-pc-mail] PC台帳(594) ユニーク mail 件数=${mails594.size} / 595 行のうちリスト出力=${rowsOut.length}（reason=no_mail|no_pc_match）`
);
