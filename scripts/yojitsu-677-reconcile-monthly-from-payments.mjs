/**
 * 部署予実 677 — `monthly_breakdown.month_actual` を `payment_breakdown` のロールアップに同期
 *
 * 背景（2026-05-26）:
 * - 旧 678 の `buildMonthlyTableForPayments` が「支払のない月の month_actual を維持」しており、
 *   移行・手入力で入った月次実績だけが残り、支払内訳と 677/678 で見え方がずれる。
 * - 678 修正後も既存レコードは手当てが必要。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-677-reconcile-monthly-from-payments.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-677-reconcile-monthly-from-payments.mjs --apply
 *   ... --record-id 55
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

const recordIdArg = argVal('--record-id');
const summaryContains = argVal('--summary-contains');

const u = process.env.KINTONE_USERNAME;
const p = process.env.KINTONE_PASSWORD;
if (!u || !p || !process.env.KINTONE_BASE_URL) {
  console.error('NG: .env に KINTONE_USERNAME / KINTONE_PASSWORD / KINTONE_BASE_URL');
  process.exit(2);
}

const base = process.env.KINTONE_BASE_URL.replace(/\/k$/, '');
const h = {
  'X-Cybozu-Authorization': Buffer.from(`${u}:${p}`).toString('base64'),
  'Content-Type': 'application/json',
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME) {
  h.Authorization =
    'Basic ' +
    Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
    ).toString('base64');
}

function fiscalMonthKey(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  const m = s.match(/^(\d+)\s*月/);
  if (m) return String(parseInt(m[1], 10));
  const ym = s.match(/^(\d{4})-(\d{2})/);
  if (ym) return String(parseInt(ym[2], 10));
  const ym2 = s.match(/^(\d{4})\/(\d{1,2})/);
  if (ym2) return String(parseInt(ym2[2], 10));
  return s;
}

function toNum(v) {
  if (v === '' || v == null) return 0;
  const n = Number(String(v).replace(/[,\s¥￥]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function rollupFromPayments(prow) {
  const sums = {};
  for (const pr of prow || []) {
    const v = pr.value || {};
    const d = v.payment_date?.value || '';
    const m = d.match(/^\d+-(\d{2})-/);
    if (!m) continue;
    const lab = String(parseInt(m[1], 10));
    sums[lab] = (sums[lab] || 0) + toNum(v.payment_amount?.value);
  }
  return sums;
}

function buildMonthlyTableForPayments(rec, sums) {
  const src = (rec.monthly_breakdown && rec.monthly_breakdown.value) || [];
  let paymentDriven = false;
  for (const sk of Object.keys(sums)) {
    if (Object.prototype.hasOwnProperty.call(sums, sk)) {
      paymentDriven = true;
      break;
    }
  }
  const seen = {};
  const out = [];
  for (const row of src) {
    const v = row.value || {};
    const lab = fiscalMonthKey((v.fiscal_month || {}).value);
    seen[lab] = true;
    let actualVal;
    if (sums[lab] != null) {
      actualVal = String(sums[lab]);
    } else if (paymentDriven) {
      actualVal = '';
    } else {
      actualVal = ((v.month_actual || {}).value) || '';
    }
    const copy = {
      value: {
        fiscal_month: { value: lab },
        month_budget: { value: ((v.month_budget || {}).value) || '' },
        month_actual: { value: actualVal },
        month_budget_revision: { value: ((v.month_budget_revision || {}).value) || '' },
      },
    };
    if (row.id) copy.id = row.id;
    out.push(copy);
  }
  for (const lab2 of Object.keys(sums)) {
    if (seen[lab2]) continue;
    out.push({
      value: {
        fiscal_month: { value: lab2 },
        month_budget: { value: '' },
        month_actual: { value: String(sums[lab2]) },
        month_budget_revision: { value: '0' },
      },
    });
  }
  return out;
}

function monthActualMap(rec) {
  const m = {};
  for (const row of (rec.monthly_breakdown && rec.monthly_breakdown.value) || []) {
    const v = row.value || {};
    const lab = fiscalMonthKey(v.fiscal_month?.value);
    m[lab] = String((v.month_actual || {}).value || '');
  }
  return m;
}

function needsReconcile(rec) {
  const prow = (rec.payment_breakdown && rec.payment_breakdown.value) || [];
  if (!prow.length) return false;
  const sums = rollupFromPayments(prow);
  const expected = buildMonthlyTableForPayments(rec, sums);
  const expMap = {};
  for (const row of expected) {
    const lab = fiscalMonthKey(row.value.fiscal_month?.value);
    expMap[lab] = String((row.value.month_actual || {}).value || '');
  }
  const cur = monthActualMap(rec);
  for (const lab of Object.keys(expMap)) {
    if (expMap[lab] !== (cur[lab] || '')) return true;
  }
  for (const lab of Object.keys(cur)) {
    const act = toNum(cur[lab]);
    if (act <= 0) continue;
    if (sums[lab] == null) return true;
  }
  return false;
}

async function apiGetRecords(query) {
  const r = await fetch(`${base}/k/v1/records.json`, {
    method: 'POST',
    headers: { ...h, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify({
      app: APP,
      query,
      fields: [
        '$id',
        '$revision',
        'summary_text',
        'partner_company',
        'payment_breakdown',
        'monthly_breakdown',
      ],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('records GET NG: ' + JSON.stringify(j));
  return j.records || [];
}

async function apiPutRecord(id, revision, record) {
  const r = await fetch(`${base}/k/v1/record.json`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ app: APP, id, revision, record }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('record PUT NG: ' + JSON.stringify(j));
  return j;
}

async function fetchAllWithPayments() {
  const limit = 500;
  let offset = 0;
  const all = [];
  for (;;) {
    const page = await apiGetRecords(`order by $id asc limit ${limit} offset ${offset}`);
    if (!page.length) break;
    all.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }
  return all.filter((rec) => ((rec.payment_breakdown && rec.payment_breakdown.value) || []).length > 0);
}

let targets;
if (recordIdArg) {
  targets = await apiGetRecords('$id = ' + recordIdArg + ' limit 1');
} else if (summaryContains) {
  targets = await apiGetRecords('summary_text like "%' + summaryContains + '%" limit 50');
} else {
  targets = await fetchAllWithPayments();
}

const todo = targets.filter(needsReconcile);
console.log('scanned', targets.length, 'need_reconcile', todo.length);
for (const rec of todo) {
  const prow = rec.payment_breakdown.value || [];
  const sums = rollupFromPayments(prow);
  const orphans = [];
  const cur = monthActualMap(rec);
  for (const lab of Object.keys(cur)) {
    if (toNum(cur[lab]) <= 0) continue;
    if (sums[lab] == null) orphans.push(lab + '月=' + cur[lab]);
  }
  console.log(
    ' id',
    rec.$id.value,
    (rec.summary_text && rec.summary_text.value) || '',
    'payments',
    prow.length,
    orphans.length ? 'orphan ' + orphans.join(', ') : 'diff',
  );
}

if (!APPLY) {
  console.log('\n(dry-run) 反映: 同コマンドに --apply');
  process.exit(0);
}

if (!todo.length) {
  console.log('同期対象なし。終了。');
  process.exit(0);
}

let ok = 0;
for (const rec of todo) {
  const id = rec.$id.value;
  const fresh = (await apiGetRecords('$id = ' + id + ' limit 1'))[0];
  if (!fresh) {
    console.error('skip id', id, '再GET失敗');
    continue;
  }
  const prow = fresh.payment_breakdown.value || [];
  const sums = rollupFromPayments(prow);
  const newMonthly = buildMonthlyTableForPayments(fresh, sums);
  await apiPutRecord(fresh.$id.value, fresh.$revision.value, {
    monthly_breakdown: { value: newMonthly },
  });
  ok++;
  console.log('PUT OK id=', id);
}

console.log('done', ok, '/', todo.length);
