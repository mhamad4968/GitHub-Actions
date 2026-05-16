/**
 * 部署予実 677 — 指定レコードの `monthly_breakdown` 某暦月の `month_actual` を空にする（孤児月次の手当て）
 *
 * 678 が「支払内訳 0 件」なのに 677 側で月次実績だけ入っているとき、再入力テストの前に月次実績を消す用途。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-677-clear-fiscal-month-actual.mjs \
 *     --summary-contains "ITあんしんサポート保守料" --partner-contains "FBJ" --fiscal-month 5
 *
 *   # 複数月（カンマ区切り）・支払種別で絞り込み・会社は省略可
 *   ... --summary-contains "iRep Link" --fiscal-month 5,6 --payment-type 月額
 *
 *   # 反映
 *   npx dotenv -e .env -e .env.proxy -- node scripts/yojitsu-677-clear-fiscal-month-actual.mjs ... --apply
 *
 * 任意: `--clear-payments` で `payment_breakdown` を全削除（空配列 PUT）
 * 任意: `--record-id N` で 1 件に固定（複数ヒット時は必須）
 * 任意: `--partner-contains` 省略時は会社条件なし
 * 任意: `--payment-type 月額` 等で `payment_type` をクエリに追加
 */
import 'dotenv/config';

const APP = 677;
const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const CLEAR_PAYMENTS = ARGS.includes('--clear-payments');

function argVal(name) {
  const i = ARGS.indexOf(name);
  if (i < 0 || i + 1 >= ARGS.length) return null;
  return ARGS[i + 1];
}

/** 暦月キー（"5" または "5月" 等）を "5" 形式に寄せる */
function fiscalMonthKey(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (!s) return '';
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  const m = s.match(/^(\d+)\s*月/);
  if (m) return String(parseInt(m[1], 10));
  return s;
}

const summaryContains = argVal('--summary-contains') || '';
const partnerContains = argVal('--partner-contains');
const fiscalMonthArg = argVal('--fiscal-month') || '';
const paymentTypeFilter = argVal('--payment-type');
const recordIdArg = argVal('--record-id');

if (!summaryContains || !fiscalMonthArg) {
  console.error(
    'Usage: node scripts/yojitsu-677-clear-fiscal-month-actual.mjs --summary-contains "…" --fiscal-month 5[,6,...] [--partner-contains "…"] [--payment-type 月額] [--record-id N] [--clear-payments] [--apply]',
  );
  process.exit(2);
}

const wantMonthsList = fiscalMonthArg
  .split(/[,，]/)
  .map((s) => fiscalMonthKey(s.trim()))
  .filter(Boolean);
const wantMonthsSet = new Set(wantMonthsList);
if (wantMonthsSet.size === 0) {
  console.error('NG: --fiscal-month が解釈できません（例: 5 または 5,6）');
  process.exit(2);
}

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
      'monthly_breakdown',
      'payment_breakdown',
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

function buildMonthlyPutValue(rows, targetKeysSet) {
  const out = [];
  let changedRows = 0;
  for (const row of rows) {
    const rowId = row.id;
    if (!rowId) throw new Error('monthly_breakdown 行に id がありません（GET 応答を確認）');
    const v = row.value || {};
    const fk = fiscalMonthKey((v.fiscal_month || {}).value);
    const copy = {
      fiscal_month: { value: (v.fiscal_month || {}).value == null ? '' : String((v.fiscal_month || {}).value) },
      month_budget: { value: ((v.month_budget || {}).value) || '' },
      month_actual: { value: ((v.month_actual || {}).value) || '' },
      month_budget_revision: { value: ((v.month_budget_revision || {}).value) || '' },
    };
    if (targetKeysSet.has(fk)) {
      const before = String((v.month_actual || {}).value || '');
      if (before !== '') {
        copy.month_actual = { value: '' };
        changedRows++;
      }
    }
    out.push({ id: rowId, value: copy });
  }
  return { value: out, changedRows };
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
    console.error(`  id=${id} partner=${pr} summary=${sm.slice(0, 60)}`);
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
const payRows = (rec.payment_breakdown && rec.payment_breakdown.value) || [];

const { value: newMonthly, changedRows } = buildMonthlyPutValue(monthlyRows, wantMonthsSet);

console.log('\n対象レコード');
console.log('  $id:', id, 'revision:', revision);
console.log('  summary:', (rec.summary_text && rec.summary_text.value) || '');
console.log('  partner:', (rec.partner_company && rec.partner_company.value) || '');
console.log('  payment_type:', (rec.payment_type && rec.payment_type.value) || '');
console.log('  対象暦月:', [...wantMonthsSet].sort().join(', '));
console.log('  payment_breakdown 行数:', payRows.length);
console.log('  monthly_breakdown 行数:', monthlyRows.length, ' / month_actual を空にする行数(変更予定):', changedRows);

for (const row of monthlyRows) {
  const v = row.value || {};
  const fk = fiscalMonthKey((v.fiscal_month || {}).value);
  if (!wantMonthsSet.has(fk)) continue;
  console.log('  [' + fk + '月行] month_actual before:', JSON.stringify((v.month_actual || {}).value));
}

const record = { monthly_breakdown: { value: newMonthly } };
if (CLEAR_PAYMENTS) {
  record.payment_breakdown = { value: [] };
}

if (!APPLY) {
  console.log('\n(dry-run) PUT 予定の record キー:', Object.keys(record).join(', '));
  if (CLEAR_PAYMENTS) console.log('  ※ payment_breakdown は空配列で全削除');
  console.log('\n反映: 同コマンドに --apply を付けて実行');
  process.exit(0);
}

if (changedRows === 0 && !CLEAR_PAYMENTS) {
  console.log('変更なし（該当月の month_actual は既に空・支払削除も無し）。終了。');
  process.exit(0);
}

const fresh = await apiGetRecords('$id = ' + id + ' limit 1');
if (!fresh.length) throw new Error('再GET失敗');
const rev2 = fresh[0].$revision.value;
const monthly2 = (fresh[0].monthly_breakdown && fresh[0].monthly_breakdown.value) || [];
const built = buildMonthlyPutValue(monthly2, wantMonthsSet);
const record2 = { monthly_breakdown: { value: built.value } };
if (CLEAR_PAYMENTS) record2.payment_breakdown = { value: [] };

await apiPutRecord(id, rev2, record2);
console.log('PUT OK id=', id, 'revision was', rev2, CLEAR_PAYMENTS ? '(payments cleared)' : '');
