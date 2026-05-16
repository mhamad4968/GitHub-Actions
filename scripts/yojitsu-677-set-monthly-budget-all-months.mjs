/**
 * 部署予実 677 — 指定レコードの `monthly_breakdown` 全行の `month_budget` を同一金額にし、
 * `learning_fixed_budget` を月次「予算」の合計に合わせる（月額定額の一括修正用）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-677-set-monthly-budget-all-months.mjs \
 *     --summary-contains "iRep Link" --payment-type 月額 --month-budget 5940
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-677-set-monthly-budget-all-months.mjs \
 *     ... --record-id N --apply
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
const partnerContains = argVal('--partner-contains');
const paymentTypeFilter = argVal('--payment-type');
const recordIdArg = argVal('--record-id');
const monthBudgetArg = argVal('--month-budget');

if (!summaryContains || !monthBudgetArg) {
  console.error(
    'Usage: node scripts/yojitsu-677-set-monthly-budget-all-months.mjs --summary-contains "…" --month-budget 5940 [--payment-type 月額] [--partner-contains "…"] [--record-id N] [--apply]',
  );
  process.exit(2);
}

const monthBudgetYen = Math.round(Number(String(monthBudgetArg).replace(/[,¥￥]/g, '')));
if (!Number.isFinite(monthBudgetYen) || monthBudgetYen < 0) {
  console.error('NG: --month-budget が数値として解釈できません');
  process.exit(2);
}
const monthBudgetStr = String(monthBudgetYen);

const u = process.env.KINTONE_USERNAME;
const p = process.env.KINTONE_PASSWORD;
if (!u || !p || !process.env.KINTONE_BASE_URL) {
  console.error('NG: .env に KINTONE_USERNAME / KINTONE_PASSWORD / KINTONE_BASE_URL');
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

async function apiGetRecords(query) {
  const url = base + '/k/v1/records.json';
  const body = {
    app: APP,
    query,
    fields: [
      '$id',
      '$revision',
      'summary_text',
      'partner_company',
      'payment_type',
      'cost_category',
      'learning_fixed_budget',
      'monthly_breakdown',
    ],
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

function buildMonthlyAllSameBudget(rows, yenStr) {
  const out = [];
  let changed = 0;
  for (const row of rows) {
    const rowId = row.id;
    if (!rowId) throw new Error('monthly_breakdown 行に id がありません');
    const v = row.value || {};
    const before = String((v.month_budget || {}).value ?? '').trim();
    const copy = {
      fiscal_month: { value: (v.fiscal_month || {}).value == null ? '' : String((v.fiscal_month || {}).value) },
      month_budget: { value: yenStr },
      month_actual: { value: ((v.month_actual || {}).value) || '' },
      month_budget_revision: { value: ((v.month_budget_revision || {}).value) || '' },
    };
    if (before !== yenStr) changed++;
    out.push({ id: rowId, value: copy });
  }
  const sumLearning = yenStr ? monthBudgetYen * out.length : 0;
  return { value: out, changedRows: changed, rowCount: out.length, sumLearning };
}

const queryParts = ['summary_text like "%' + escQuery(summaryContains) + '%"'];
if (partnerContains != null && String(partnerContains).length > 0) {
  queryParts.push('partner_company like "%' + escQuery(String(partnerContains)) + '%"');
}
if (paymentTypeFilter != null && String(paymentTypeFilter).trim() !== '') {
  queryParts.push('payment_type in ("' + escQuery(String(paymentTypeFilter).trim()) + '")');
}
const q = queryParts.join(' and ');

console.log('query:', q);
const hits = await apiGetRecords(q + ' limit 20');
console.log('hits:', hits.length);
if (hits.length === 0) {
  console.log('該当レコードなし。終了。');
  process.exit(0);
}
if (hits.length > 1 && !recordIdArg) {
  console.error('複数ヒット。--record-id で 1 件を指定してください。');
  for (const hrec of hits) {
    const id = hrec.$id.value;
    const sm = (hrec.summary_text && hrec.summary_text.value) || '';
    const pr = (hrec.partner_company && hrec.partner_company.value) || '';
    console.error(`  id=${id} partner=${pr} summary=${sm.slice(0, 80)}`);
  }
  process.exit(2);
}

const rec = recordIdArg ? hits.find((r) => String(r.$id.value) === String(recordIdArg)) : hits[0];
if (!rec) {
  console.error('NG: --record-id がヒットしません');
  process.exit(2);
}

const id = rec.$id.value;
const revision = rec.$revision.value;
const monthlyRows = (rec.monthly_breakdown && rec.monthly_breakdown.value) || [];
const { value: newMonthly, changedRows, rowCount, sumLearning } = buildMonthlyAllSameBudget(
  monthlyRows,
  monthBudgetStr,
);

console.log('\n対象レコード');
console.log('  $id:', id, 'revision:', revision);
console.log('  summary:', (rec.summary_text && rec.summary_text.value) || '');
console.log('  partner:', (rec.partner_company && rec.partner_company.value) || '');
console.log('  payment_type:', (rec.payment_type && rec.payment_type.value) || '');
console.log('  cost_category:', (rec.cost_category && rec.cost_category.value) || '');
console.log('  learning_fixed_budget (現在):', (rec.learning_fixed_budget && rec.learning_fixed_budget.value) || '');
console.log('  monthly_breakdown 行数:', rowCount);
console.log('  各行 month_budget →', monthBudgetStr, '/ 変更行数(予算値):', changedRows);
console.log('  learning_fixed_budget →', String(sumLearning), '(= 月額 × 行数)');

for (const row of monthlyRows.slice(0, 14)) {
  const v = row.value || {};
  const fm = (v.fiscal_month || {}).value;
  const mb = (v.month_budget || {}).value;
  console.log('    fiscal_month=', fm, ' month_budget=', mb);
}

const learningStr = String(sumLearning);
const record = {
  monthly_breakdown: { value: newMonthly },
  learning_fixed_budget: { value: learningStr },
};

if (!APPLY) {
  console.log('\n(dry-run) PUT 予定: monthly_breakdown 全行 + learning_fixed_budget');
  console.log('反映: 同コマンドに --apply を付けて実行');
  process.exit(0);
}

const fresh = await apiGetRecords('$id = ' + id + ' limit 1');
if (!fresh.length) throw new Error('再GET失敗');
const rev2 = fresh[0].$revision.value;
const monthly2 = (fresh[0].monthly_breakdown && fresh[0].monthly_breakdown.value) || [];
const built = buildMonthlyAllSameBudget(monthly2, monthBudgetStr);
const record2 = {
  monthly_breakdown: { value: built.value },
  learning_fixed_budget: { value: String(built.sumLearning) },
};

await apiPutRecord(id, rev2, record2);
console.log('PUT OK id=', id, 'revision was', rev2);
