/**
 * 714 で pc_name 空の行を、595 / 674 個人稼働 PC（1台）と突合して埋める。
 * 2台以上・0台・共有行は触らない。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/software-ledger-714-backfill-pc-from-674.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/software-ledger-714-backfill-pc-from-674.mjs --apply
 */
import { fetchJson, getKintoneConfig } from './lib/software-ledger-kintone.mjs';

const APP_714 = 714;
const APP_595 = 595;
const APP_674 = 674;
const TARGET_SHARED = '共有';
const TARGET_PERSONAL = '個人';
const FC595_SUB = 'pc_ledger_v1_list';
const FC595_CELL = 'pc_674_record_id';

function excludedStatus(s) {
  const v = String(s || '').trim();
  return v === '廃棄' || v === '取消' || v === '保管';
}

function cell(r, code) {
  const f = r[code];
  if (!f || f.value == null) return '';
  return String(f.value).trim();
}

function idOf(r) {
  return cell(r, '$id');
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

function parse595LinkedIds(rec) {
  const sub = rec[FC595_SUB]?.value;
  if (!Array.isArray(sub)) return [];
  return sub
    .map((row) => {
      const c = row?.value?.[FC595_CELL];
      return c?.value != null ? String(c.value).trim() : '';
    })
    .filter((id) => /^\d+$/.test(id));
}

function uniquePcs(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    if (!p.id || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

function flatten674(rec) {
  return {
    id: idOf(rec),
    pc_name: cell(rec, 'pc_name'),
    emp_id: cell(rec, 'emp_id'),
    mail: cell(rec, 'mail').toLowerCase(),
    account_type: cell(rec, 'account_type'),
    pc_status: cell(rec, 'pc_status'),
  };
}

function isEligiblePersonal(p) {
  return p.account_type === TARGET_PERSONAL && !excludedStatus(p.pc_status) && p.pc_name;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const { baseUrl, headers } = getKintoneConfig();

  const recs714 = await fetchAll(baseUrl, headers, APP_714, [
    '$id',
    '$revision',
    'emp_id',
    'user_name',
    'install_target',
    'pc_name',
    'pc_674_id',
    'software_name',
  ]);
  const recs595 = await fetchAll(baseUrl, headers, APP_595, [
    '$id',
    'emp_id',
    'mail',
    'user_name',
    FC595_SUB,
  ]);
  const recs674 = await fetchAll(baseUrl, headers, APP_674, [
    '$id',
    'pc_name',
    'emp_id',
    'mail',
    'account_type',
    'pc_status',
  ]);

  const pcs = recs674.map(flatten674).filter(isEligiblePersonal);
  const byEmp = new Map();
  const byMail = new Map();
  const byId = new Map();
  for (const p of pcs) {
    byId.set(p.id, p);
    if (p.emp_id) {
      const arr = byEmp.get(p.emp_id) || [];
      arr.push(p);
      byEmp.set(p.emp_id, arr);
    }
    if (p.mail) {
      const arr = byMail.get(p.mail) || [];
      arr.push(p);
      byMail.set(p.mail, arr);
    }
  }
  const emp595 = new Map();
  for (const r of recs595) {
    const emp = cell(r, 'emp_id');
    if (emp) emp595.set(emp, r);
  }

  const fill = [];
  const skipShared = [];
  const unmatched = [];
  const ambiguous = [];
  let already = 0;

  for (const r of recs714) {
    const pcName = cell(r, 'pc_name');
    if (pcName) {
      already += 1;
      continue;
    }
    const target = cell(r, 'install_target');
    const row = {
      id: idOf(r),
      revision: cell(r, '$revision'),
      emp_id: cell(r, 'emp_id'),
      user_name: cell(r, 'user_name'),
      software_name: cell(r, 'software_name'),
      install_target: target,
    };
    if (target === TARGET_SHARED) {
      skipShared.push(row);
      continue;
    }
    const rec595 = row.emp_id ? emp595.get(row.emp_id) : null;
    const mail = rec595 ? cell(rec595, 'mail').toLowerCase() : '';
    const linked = rec595 ? parse595LinkedIds(rec595) : [];
    const cands = uniquePcs(
      [
        ...(row.emp_id ? byEmp.get(row.emp_id) || [] : []),
        ...(mail ? byMail.get(mail) || [] : []),
        ...linked.map((id) => byId.get(id)).filter(Boolean),
      ].filter(isEligiblePersonal),
    );
    if (cands.length === 1) {
      fill.push({ ...row, pc: cands[0] });
    } else if (cands.length === 0) {
      unmatched.push(row);
    } else {
      ambiguous.push({ ...row, pcs: cands.map((p) => `${p.id}:${p.pc_name}`) });
    }
  }

  const summary = {
    total714: recs714.length,
    alreadyHasPcName: already,
    fillable1pc: fill.length,
    unmatched0pc: unmatched.length,
    ambiguous2plus: ambiguous.length,
    skipSharedBlank: skipShared.length,
    apply,
  };
  console.log(JSON.stringify(summary, null, 2));
  console.log('[fill sample]', fill.slice(0, 8).map((x) => ({
    id: x.id,
    user_name: x.user_name,
    emp_id: x.emp_id,
    software_name: x.software_name,
    pc: x.pc.pc_name,
    pc_674_id: x.pc.id,
  })));
  if (unmatched.length) {
    console.log(
      '[unmatched]',
      unmatched.slice(0, 20).map((x) => ({ id: x.id, user_name: x.user_name, emp_id: x.emp_id })),
    );
  }
  if (ambiguous.length) {
    console.log(
      '[ambiguous]',
      ambiguous.map((x) => ({ id: x.id, user_name: x.user_name, pcs: x.pcs })),
    );
  }
  if (skipShared.length) {
    console.log('[skip shared blank]', skipShared);
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
    record: {
      pc_name: { value: x.pc.pc_name },
      pc_674_id: { value: x.pc.id },
      install_target: { value: TARGET_PERSONAL },
    },
  }));
  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100);
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: APP_714, records: chunk }),
    });
    console.log(`[apply] PUT ${chunk.length} (offset ${i})`);
  }
  console.log(`[apply] done filled=${fill.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
