/**
 * 部署予実 677 — learning_fixed_budget バックフィル
 *
 * 背景: 初回移行スクリプトが learning_fixed_budget を空のままにしていたため、
 * customize/678/desktop.js の computeAggregates() が running.budget=0 になる。
 * 旧フォーマット I〜T の月次「予算」合計を learning_fixed_budget にミラーする
 * （yojitsu-migration-kyu-to-kintone.md §4・SPEC 月次正本との整合）。
 *
 * 副作用: --apply 時のみ kintone REST PUT（Tier B）。
 *
 *   node scripts/yojitsu-677-backfill-learning-fixed-from-monthly.mjs
 *   node scripts/yojitsu-677-backfill-learning-fixed-from-monthly.mjs --apply
 */
import 'dotenv/config';

const APP = 677;
const ARGS = new Set(process.argv.slice(2));
const APPLY = ARGS.has('--apply');

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

function toNum(v) {
  if (v === '' || v == null) return 0;
  const n = Number(String(v).replace(/[,\s¥￥]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function sumMonthBudget(rec) {
  const tbl = (rec.monthly_breakdown && rec.monthly_breakdown.value) || [];
  let s = 0;
  for (const row of tbl) {
    const v = row.value && row.value.month_budget && row.value.month_budget.value;
    s += toNum(v);
  }
  return s;
}

function currentLearning(rec) {
  const v = rec.learning_fixed_budget && rec.learning_fixed_budget.value;
  return toNum(v);
}

async function fetchPage(offset, limit) {
  const url = base + '/k/v1/records.json';
  const body = {
    app: APP,
    query: `order by $id asc limit ${limit} offset ${offset}`,
    fields: ['$id', '$revision', 'learning_fixed_budget', 'cost_category', 'summary_text', 'monthly_breakdown'],
    totalCount: offset === 0,
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...h, 'X-HTTP-Method-Override': 'GET' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('GET NG: ' + JSON.stringify(j));
  return { records: j.records || [], totalCount: Number(j.totalCount || 0) };
}

async function fetchAll() {
  const limit = 100;
  let offset = 0;
  let total = null;
  const all = [];
  for (;;) {
    const { records, totalCount } = await fetchPage(offset, limit);
    if (total == null) total = totalCount;
    all.push(...records);
    if (records.length < limit) break;
    offset += limit;
  }
  return all;
}

async function bulkPut(plans) {
  if (plans.length === 0) return;
  const url = base + '/k/v1/records.json';
  const records = plans.map((p) => ({
    id: p.id,
    revision: p.revision,
    record: { learning_fixed_budget: { value: p.newVal } },
  }));
  const body = { app: APP, records };
  const r = await fetch(url, { method: 'PUT', headers: h, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error('PUT NG: ' + JSON.stringify(j));
  return j;
}

const all = await fetchAll();
const plans = [];
for (const rec of all) {
  const sum = sumMonthBudget(rec);
  const cur = currentLearning(rec);
  if (sum <= 0) continue;
  if (cur > 0) continue;
  const id = rec.$id.value;
  const revision = rec.$revision.value;
  const newVal = sum === Math.floor(sum) ? String(Math.floor(sum)) : String(sum);
  plans.push({
    id,
    revision,
    newVal,
    sum,
    cat: (rec.cost_category && rec.cost_category.value) || '',
    summary: ((rec.summary_text && rec.summary_text.value) || '').slice(0, 40),
  });
}

console.log(`677 取得: ${all.length} 件 / learning_fixed 要更新: ${plans.length} 件`);
for (const p of plans) {
  console.log(`  id=${p.id} sum=${p.sum} → learning_fixed_budget="${p.newVal}" [${p.cat}] ${p.summary}`);
}

if (!APPLY) {
  console.log('\n(dry-run) 反映するには: node scripts/yojitsu-677-backfill-learning-fixed-from-monthly.mjs --apply');
  process.exit(0);
}

if (plans.length === 0) {
  console.log('更新なし。終了。');
  process.exit(0);
}

await bulkPut(plans);
console.log('PUT 完了:', plans.length, '件');
