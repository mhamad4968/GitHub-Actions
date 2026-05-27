/**
 * 部署予実 677 — 指定暦月の month_budget のみ修正（他月・revision は維持）
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-677-fix-one-month-budget.mjs \
 *     --summary-contains "メールサーバー" --fiscal-month 6 --month-budget 73900 [--apply]
 */
import 'dotenv/config';

const APP = 677;
const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');

function argVal(name) {
  const i = ARGS.indexOf(name);
  if (i < 0 || i + 1 >= ARGS.length) return null;
  return ARGS[i + 1];
}

const summaryContains = argVal('--summary-contains') || '';
const fiscalMonth = argVal('--fiscal-month') || '';
const monthBudgetArg = argVal('--month-budget');
const recordIdArg = argVal('--record-id');

if (!summaryContains || !fiscalMonth || !monthBudgetArg) {
  console.error(
    'Usage: node scripts/yojitsu-677-fix-one-month-budget.mjs --summary-contains "…" --fiscal-month 6 --month-budget 73900 [--record-id N] [--apply]',
  );
  process.exit(2);
}

const targetMonth = String(fiscalMonth).trim();
const monthBudgetYen = Math.round(Number(String(monthBudgetArg).replace(/[,¥￥]/g, '')));
const monthBudgetStr = String(monthBudgetYen);

const u = process.env.KINTONE_USERNAME;
const p = process.env.KINTONE_PASSWORD;
if (!u || !p || !process.env.KINTONE_BASE_URL) {
  console.error('NG: .env');
  process.exit(2);
}

const base = process.env.KINTONE_BASE_URL.replace(/\/k$/, '');
const t = Buffer.from(u + ':' + p).toString('base64');
const h = { 'X-Cybozu-Authorization': t, 'Content-Type': 'application/json' };
if (process.env.KINTONE_BASIC_AUTH_USERNAME) {
  h.Authorization =
    'Basic ' +
    Buffer.from(
      process.env.KINTONE_BASIC_AUTH_USERNAME + ':' + process.env.KINTONE_BASIC_AUTH_PASSWORD,
    ).toString('base64');
}

function escQuery(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeFiscalMonthLabel(raw) {
  const s = String(raw ?? '')
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (!s) return '';
  const tIdx = s.indexOf('T');
  const head = tIdx >= 0 ? s.slice(0, tIdx) : s;
  const m1 = head.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
  if (m1) return String(Number(m1[2]));
  const m2 = head.match(/^(\d{1,2})$/);
  if (m2) return String(Number(m2[1]));
  const m3 = head.match(/(\d{1,2})\s*月/);
  if (m3) return String(Number(m3[1]));
  return head;
}

async function apiGetRecords(query) {
  const url = base + '/k/v1/records.json';
  const body = {
    app: APP,
    query,
    fields: ['$id', '$revision', 'summary_text', 'partner_company', 'payment_type', 'monthly_breakdown'],
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...h, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('records GET NG: ' + JSON.stringify(j));
  return j.records || [];
}

async function apiPutRecord(id, revision, record) {
  const url = base + '/k/v1/record.json';
  const body = { app: APP, id, revision, record };
  const r = await fetch(url, { method: 'PUT', headers: h, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error('record PUT NG: ' + JSON.stringify(j));
  return j;
}

function patchMonthly(rows, targetLab, yenStr) {
  const out = [];
  let hit = false;
  let changed = false;
  for (const row of rows) {
    const rowId = row.id;
    const v = row.value || {};
    const lab = normalizeFiscalMonthLabel(v.fiscal_month?.value);
    const copy = {
      fiscal_month: { value: v.fiscal_month?.value == null ? '' : String(v.fiscal_month.value) },
      month_budget: { value: ((v.month_budget || {}).value) || '' },
      month_actual: { value: ((v.month_actual || {}).value) || '' },
      month_budget_revision: { value: ((v.month_budget_revision || {}).value) || '' },
    };
    if (lab === targetLab) {
      hit = true;
      const before = String(copy.month_budget.value).trim();
      if (before !== yenStr) changed = true;
      copy.month_budget.value = yenStr;
    }
    out.push({ id: rowId, value: copy });
  }
  return { value: out, hit, changed };
}

const q = 'summary_text like "%' + escQuery(summaryContains) + '%"';
const hits = await apiGetRecords(q + ' limit 20');
console.log('hits:', hits.length);
if (!hits.length) process.exit(0);
if (hits.length > 1 && !recordIdArg) {
  for (const r of hits) {
    console.error('id=', r.$id.value, r.summary_text?.value, r.partner_company?.value);
  }
  process.exit(2);
}
const rec = recordIdArg ? hits.find((r) => String(r.$id.value) === String(recordIdArg)) : hits[0];
const id = rec.$id.value;
const monthlyRows = rec.monthly_breakdown?.value || [];
const built = patchMonthly(monthlyRows, targetMonth, monthBudgetStr);

console.log('id', id, rec.summary_text?.value);
if (!built.hit) {
  console.error('NG: fiscal_month', targetMonth, 'の行がありません');
  process.exit(2);
}
for (const row of monthlyRows) {
  const v = row.value || {};
  const lab = normalizeFiscalMonthLabel(v.fiscal_month?.value);
  if (lab === targetMonth || lab === '5' || lab === '7') {
    console.log(' ', v.fiscal_month?.value, 'budget', v.month_budget?.value);
  }
}
console.log('changed:', built.changed);
if (!APPLY) {
  console.log('(dry-run) --apply で PUT');
  process.exit(0);
}
const fresh = await apiGetRecords('$id = ' + id + ' limit 1');
const rev2 = fresh[0].$revision.value;
const built2 = patchMonthly(fresh[0].monthly_breakdown?.value || [], targetMonth, monthBudgetStr);
await apiPutRecord(id, rev2, { monthly_breakdown: { value: built2.value } });
console.log('PUT OK');
