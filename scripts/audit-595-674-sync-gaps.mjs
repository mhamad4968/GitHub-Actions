#!/usr/bin/env node
/**
 * 595→674 同期ギャップ監査（原因調査用）
 *   npx dotenv -e .env -e .env.proxy -- node scripts/audit-595-674-sync-gaps.mjs
 */
import {
  getKintoneConfig,
  fetchJson,
} from './lib/mailing-list-kintone.mjs';

const APP_595 = 595;
const APP_674 = 674;
const FC_MAIL = 'mail';
const FC_NAME = 'user_name';
const FC_DEPT = 'dept_name';
const FC_GROUP = 'group_name';
const FC_EMP_ID = 'emp_id';
const FC_TYPE = 'account_type';
const FC_PC_STATUS = 'pc_status';
const FC_EMP = 'employment_status';
const FC595_SUB = 'pc_ledger_v1_list';
const FC595_CELL = 'pc_674_record_id';
const TYPE_PERSONAL = '個人';
const PC_STORAGE = '保管';
const EMP_RETIRED = '退職';

function normMail(m) {
  return String(m ?? '').trim().toLowerCase();
}

function val(r, code) {
  const f = r[code];
  if (!f || f.value == null) return '';
  const v = f.value;
  if (Array.isArray(v)) return v.map((x) => (x?.code ?? x)).join(',');
  return String(v);
}

async function fetchAll(app, fields, { withSubtable = false } = {}) {
  const { baseUrl, headers } = getKintoneConfig();
  const all = [];
  let offset = 0;
  while (true) {
    const q = `order by $id asc limit 500 offset ${offset}`;
    const j = await fetchJson(
      `${baseUrl}/k/v1/records.json?app=${app}&query=${encodeURIComponent(q)}`,
      { headers: { ...headers, 'Content-Type': undefined } },
    );
    const batch = j.records || [];
    for (const r of batch) {
      const o = { $id: val(r, '$id') };
      for (const f of fields) {
        if (f === FC595_SUB && withSubtable) {
          o[FC595_SUB] = r[FC595_SUB]?.value || [];
        } else {
          o[f] = val(r, f);
        }
      }
      if (r.$revision) o.$revision = val(r, '$revision');
      all.push(o);
    }
    if (batch.length < 500) break;
    offset += 500;
  }
  return all;
}

function subtable674Ids(r595) {
  const rows = r595[FC595_SUB] || [];
  return rows
    .map((row) => {
      const cell = row?.value?.[FC595_CELL] ?? row?.[FC595_CELL];
      return String(cell?.value ?? cell ?? '').trim();
    })
    .filter((id) => /^\d+$/.test(id));
}

function orgDiff(want, got) {
  const d = [];
  if (want.name !== got.name) d.push(`name:${got.name}→${want.name}`);
  if (want.dept !== got.dept) d.push(`dept:${got.dept}→${want.dept}`);
  if (want.grp !== got.grp) d.push(`grp:${got.grp}→${want.grp}`);
  return d;
}

async function main() {
  const f595 = [FC_MAIL, FC_NAME, FC_DEPT, FC_GROUP, FC_EMP_ID, FC_EMP, FC595_SUB];
  const f674 = [FC_MAIL, FC_NAME, FC_DEPT, FC_GROUP, FC_EMP_ID, FC_TYPE, FC_PC_STATUS];
  const rec595 = await fetchAll(APP_595, f595, { withSubtable: true });
  const rec674 = await fetchAll(APP_674, f674);

  const by674Id = new Map(rec674.map((r) => [r.$id, r]));
  const byMail674 = new Map();
  for (const r of rec674) {
    const mk = normMail(r[FC_MAIL]);
    if (!mk) continue;
    if (!byMail674.has(mk)) byMail674.set(mk, []);
    byMail674.get(mk).push(r);
  }
  const byEmp674 = new Map();
  for (const r of rec674) {
    const e = r[FC_EMP_ID].trim();
    if (!e) continue;
    if (!byEmp674.has(e)) byEmp674.set(e, []);
    byEmp674.get(e).push(r);
  }

  const gaps = {
    mailMatchOrgDiff: [],
    empIdMatchOrgDiff: [],
    subtableLinkOrgDiff: [],
    subtableLinkSkipped: [],
    mailNo674: [],
    mail674WrongType: [],
    mail674Storage: [],
  };

  for (const e595 of rec595) {
    if (val({ x: e595[FC_EMP] }, 'x') === EMP_RETIRED) continue;
    const want = {
      name: e595[FC_NAME].trim(),
      dept: e595[FC_DEPT].trim(),
      grp: e595[FC_GROUP].trim(),
      mail: e595[FC_MAIL].trim(),
      empId: e595[FC_EMP_ID].trim(),
    };
    if (!want.mail && !want.empId) continue;

    const mk = normMail(want.mail);
    const mailHits = mk ? (byMail674.get(mk) || []) : [];
    const personalActive = mailHits.filter(
      (r) => r[FC_TYPE] === TYPE_PERSONAL && r[FC_PC_STATUS] !== PC_STORAGE,
    );

    if (mk && personalActive.length === 0) {
      if (mailHits.length === 0) {
        gaps.mailNo674.push({ empId: want.empId, mail: want.mail, name: want.name });
      } else {
        for (const r of mailHits) {
          if (r[FC_TYPE] !== TYPE_PERSONAL) {
            gaps.mail674WrongType.push({ id674: r.$id, mail: want.mail, type: r[FC_TYPE] });
          }
          if (r[FC_PC_STATUS] === PC_STORAGE) {
            gaps.mail674Storage.push({ id674: r.$id, mail: want.mail });
          }
        }
      }
    }

    for (const r of personalActive) {
      const diff = orgDiff(want, { name: r[FC_NAME].trim(), dept: r[FC_DEPT].trim(), grp: r[FC_GROUP].trim() });
      if (diff.length) {
        gaps.mailMatchOrgDiff.push({ id674: r.$id, mail: want.mail, empId: want.empId, diff });
      }
    }

    if (want.empId) {
      const empHits = (byEmp674.get(want.empId) || []).filter(
        (r) => r[FC_TYPE] === TYPE_PERSONAL && r[FC_PC_STATUS] !== PC_STORAGE,
      );
      for (const r of empHits) {
        if (mk && normMail(r[FC_MAIL]) === mk) continue;
        const diff = orgDiff(want, { name: r[FC_NAME].trim(), dept: r[FC_DEPT].trim(), grp: r[FC_GROUP].trim() });
        if (diff.length) {
          gaps.empIdMatchOrgDiff.push({
            id674: r.$id,
            mail674: r[FC_MAIL],
            mail595: want.mail,
            empId: want.empId,
            diff,
          });
        }
      }
    }

    const ids = subtable674Ids(e595);
    for (const id674 of ids) {
      const r = by674Id.get(id674);
      if (!r) {
        gaps.subtableLinkSkipped.push({ empId: want.empId, id674, reason: '674 not found' });
        continue;
      }
      if (r[FC_TYPE] !== TYPE_PERSONAL || r[FC_PC_STATUS] === PC_STORAGE) {
        gaps.subtableLinkSkipped.push({
          empId: want.empId,
          id674,
          reason: `type=${r[FC_TYPE]} status=${r[FC_PC_STATUS]}`,
        });
        continue;
      }
      const diff = orgDiff(want, { name: r[FC_NAME].trim(), dept: r[FC_DEPT].trim(), grp: r[FC_GROUP].trim() });
      if (diff.length) {
        gaps.subtableLinkOrgDiff.push({ id674, empId: want.empId, mail595: want.mail, diff });
      }
    }
  }

  console.log('[audit-595-674] summary');
  console.log(`  595 rows=${rec595.length} 674 rows=${rec674.length}`);
  for (const [k, arr] of Object.entries(gaps)) {
    console.log(`  ${k}: ${arr.length}`);
    arr.slice(0, 8).forEach((x) => console.log('   ', JSON.stringify(x)));
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
