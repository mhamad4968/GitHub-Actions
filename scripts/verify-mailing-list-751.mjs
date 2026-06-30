#!/usr/bin/env node
/** Excel vs 750 突合（751 表示の正本検証） */
import {
  readExcelRows,
  getKintoneConfig,
  fetchJson,
  STATUS_ACTIVE,
} from './lib/mailing-list-kintone.mjs';

const xlsx =
  process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) ||
  'C:\\tmp\\メーリングリスト一覧\\メーリングリスト一覧更新2.xlsx';

const val = (r, f) => String(r[f]?.value ?? '').trim();

async function fetchAll(appId) {
  const { baseUrl, headers } = getKintoneConfig();
  const all = [];
  let offset = 0;
  while (true) {
    const q = `order by sort_no asc limit 500 offset ${offset}`;
    const j = await fetchJson(
      `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`,
      { headers: { ...headers, 'Content-Type': undefined } },
    );
    all.push(...(j.records || []));
    if (!j.records || j.records.length < 500) break;
    offset += 500;
  }
  return all;
}

async function main() {
  const rows = readExcelRows(xlsx);
  const all = await fetchAll(750);
  const byAddr = new Map(all.map((r) => [val(r, 'list_address').toLowerCase(), r]));
  const active = all.filter((r) => val(r, 'status') === STATUS_ACTIVE);

  const diffs = [];
  for (const row of rows) {
    const k = row.list_address.trim().toLowerCase();
    const rec = byAddr.get(k);
    if (!rec) {
      diffs.push({ type: 'missing_in_kintone', addr: row.list_address });
      continue;
    }
    const rowDiff = {};
    for (const f of ['sort_no', 'legacy_no', 'department', 'purpose', 'members_raw', 'status']) {
      const want =
        f === 'sort_no' || f === 'legacy_no'
          ? String(row[f] ?? '')
          : String(row[f] ?? '').trim();
      const got = val(rec, f);
      if (want !== got) rowDiff[f] = { want, got };
    }
    if (Object.keys(rowDiff).length) {
      diffs.push({ addr: row.list_address, rowDiff });
    }
  }

  const extraInKintone = [];
  const excelKeys = new Set(rows.map((r) => r.list_address.trim().toLowerCase()));
  for (const r of active) {
    const k = val(r, 'list_address').toLowerCase();
    if (!excelKeys.has(k)) extraInKintone.push(val(r, 'list_address'));
  }

  const newExcel = rows.filter((r) => !rows.slice(0, rows.length - 4).some(() => false));
  const legacy64 = all
    .filter((r) => Number(val(r, 'legacy_no')) >= 64)
    .sort((a, b) => Number(val(a, 'legacy_no')) - Number(val(b, 'legacy_no')));

  console.log('[verify-751] Excel vs DB 750');
  console.log(`  excel=${rows.length} kintone_total=${all.length} kintone_active=${active.length}`);
  console.log(`  field_diffs=${diffs.length} extra_active=${extraInKintone.length}`);

  if (diffs.length) {
    console.log('  --- diffs (max 15) ---');
    diffs.slice(0, 15).forEach((d) => console.log('   ', JSON.stringify(d)));
  }

  console.log('  --- legacy_no 64+ (new inserts expected: 4) ---');
  for (const r of legacy64) {
    console.log(
      `   ${val(r, 'legacy_no')} | ${val(r, 'department')} | ${val(r, 'list_address')} | members=${val(r, 'members_raw').slice(0, 80)}`,
    );
  }

  const memUpdates = all.filter((r) => val(r, 'last_change_memo'));
  console.log(`  --- last_change_memo rows: ${memUpdates.length} ---`);
  memUpdates
    .sort((a, b) => val(b, 'updated_date').localeCompare(val(a, 'updated_date')))
    .slice(0, 12)
    .forEach((r) => {
      console.log(`   ${val(r, 'list_address')}: ${val(r, 'last_change_memo').slice(0, 100)}`);
    });

  const legacyOnlyDiffs = diffs.every((d) => {
    const keys = Object.keys(d.rowDiff || {});
    return keys.length === 1 && keys[0] === 'legacy_no';
  });
  if (diffs.length && legacyOnlyDiffs) {
    console.log('  NOTE: diffs are legacy_no only (Excel reuse vs kintone unique 64-67) — expected');
    process.exit(0);
  }

  process.exit(diffs.length || extraInKintone.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
