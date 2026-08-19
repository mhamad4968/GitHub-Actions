/**
 * 674 個人で emp_id が空の行を 595（mail / サブテーブル / 氏名）から埋める。
 * 共有・JR は対象外。既存 emp_id は上書きしない。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-backfill-emp-id-from-595.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-backfill-emp-id-from-595.mjs --apply
 */
import { fetchJson, getKintoneConfig } from './lib/software-ledger-kintone.mjs';

const APP_595 = 595;
const APP_674 = 674;
const TYPE_PERSONAL = '個人';
const FC595_SUB = 'pc_ledger_v1_list';
const FC595_CELL = 'pc_674_record_id';

function cell(r, code) {
  const f = r[code];
  if (!f || f.value == null) return '';
  return String(f.value).trim();
}

function idOf(r) {
  return cell(r, '$id');
}

function normMail(m) {
  return String(m || '').trim().toLowerCase();
}

async function fetchAll(baseUrl, headers, app, fields) {
  const out = [];
  let offset = 0;
  for (;;) {
    const p = new URLSearchParams();
    p.set('app', String(app));
    p.set('query', `order by $id asc limit 500 offset ${offset}`);
    for (const f of fields) p.append('fields', f);
    const json = await fetchJson(`${baseUrl}/k/v1/records.json?${p.toString()}`, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    const batch = json.records || [];
    out.push(...batch);
    if (batch.length < 500) break;
    offset += batch.length;
  }
  return out;
}

function parseLinkedIds(rec) {
  const sub = rec[FC595_SUB]?.value;
  if (!Array.isArray(sub)) return [];
  return sub
    .map((row) => {
      const c = row?.value?.[FC595_CELL];
      return c?.value != null ? String(c.value).trim() : '';
    })
    .filter((id) => /^\d+$/.test(id));
}

async function main() {
  const apply = process.argv.includes('--apply');
  const { baseUrl, headers } = getKintoneConfig();
  const recs595 = await fetchAll(baseUrl, headers, APP_595, [
    '$id',
    'emp_id',
    'mail',
    'user_name',
    FC595_SUB,
  ]);
  const recs674 = await fetchAll(baseUrl, headers, APP_674, [
    '$id',
    '$revision',
    'account_type',
    'pc_status',
    'pc_name',
    'user_name',
    'mail',
    'emp_id',
  ]);

  const byMail = new Map();
  const byName = new Map();
  const by674Id = new Map();
  for (const r of recs595) {
    const emp = cell(r, 'emp_id');
    if (!emp) continue;
    const mail = normMail(cell(r, 'mail'));
    const name = cell(r, 'user_name');
    if (mail) {
      const arr = byMail.get(mail) || [];
      arr.push({ emp, name, id595: idOf(r) });
      byMail.set(mail, arr);
    }
    if (name) {
      const arr = byName.get(name) || [];
      arr.push({ emp, name, id595: idOf(r) });
      byName.set(name, arr);
    }
    for (const id674 of parseLinkedIds(r)) {
      const arr = by674Id.get(id674) || [];
      arr.push({ emp, name, id595: idOf(r) });
      by674Id.set(id674, arr);
    }
  }

  const fill = [];
  const unmatched = [];
  const ambiguous = [];
  let skipNonPersonal = 0;
  let already = 0;

  for (const r of recs674) {
    if (cell(r, 'account_type') !== TYPE_PERSONAL) {
      skipNonPersonal += 1;
      continue;
    }
    if (cell(r, 'emp_id')) {
      already += 1;
      continue;
    }
    const row = {
      id: idOf(r),
      revision: cell(r, '$revision'),
      pc_name: cell(r, 'pc_name'),
      user_name: cell(r, 'user_name'),
      mail: cell(r, 'mail'),
      pc_status: cell(r, 'pc_status'),
    };
    const fromLink = by674Id.get(row.id) || [];
    const fromMail = row.mail ? byMail.get(normMail(row.mail)) || [] : [];
    const fromName = row.user_name ? byName.get(row.user_name) || [] : [];
    const seen = new Set();
    const cands = [];
    for (const c of [...fromLink, ...fromMail, ...fromName]) {
      if (seen.has(c.emp)) continue;
      seen.add(c.emp);
      cands.push(c);
    }
    if (cands.length === 1) {
      fill.push({ ...row, emp_id: cands[0].emp, via595: cands[0].id595 });
    } else if (cands.length === 0) {
      unmatched.push(row);
    } else {
      ambiguous.push({ ...row, emps: cands.map((c) => c.emp) });
    }
  }

  const summary = {
    personalAlreadyHasEmpId: already,
    fillable: fill.length,
    unmatched: unmatched.length,
    ambiguous: ambiguous.length,
    skipNonPersonal,
    apply,
  };
  console.log(JSON.stringify(summary, null, 2));
  console.log(
    '[fill sample]',
    fill.slice(0, 10).map((x) => ({
      id: x.id,
      pc_name: x.pc_name,
      user_name: x.user_name,
      emp_id: x.emp_id,
    })),
  );
  if (unmatched.length) {
    console.log(
      '[unmatched]',
      unmatched.slice(0, 30).map((x) => ({
        id: x.id,
        pc_name: x.pc_name,
        user_name: x.user_name,
        mail: x.mail,
        pc_status: x.pc_status,
      })),
    );
  }
  if (ambiguous.length) {
    console.log('[ambiguous]', ambiguous);
  }
  if (!apply) {
    console.log('[dry-run] PUT していません。埋めるときは --apply');
    return;
  }
  if (!fill.length) {
    console.log('[apply] 対象なし');
    return;
  }
  const updates = fill.map((x) => ({
    id: x.id,
    revision: x.revision,
    record: { emp_id: { value: x.emp_id } },
  }));
  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: APP_674, records: chunk }),
    });
    console.log(`[apply] PUT ${chunk.length} (offset ${i})`);
  }
  console.log(`[apply] done filled=${fill.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
