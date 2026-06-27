#!/usr/bin/env node
/** JRE-C_Hub — 既存 DB レコードの permissions を Excel 正本で PATCH（続き行マージ後） */
import {
  DEFAULT_XLSX,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  readExcelAccountRows,
  trimCell,
} from './lib/jre-chub-account-kintone.mjs';

const PAGE = 100;

function parseArgs() {
  return {
    dryRun: process.argv.includes('--dry-run'),
    apply: process.argv.includes('--apply'),
    xlsx: process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) || DEFAULT_XLSX,
    appId: process.argv.find((a) => a.startsWith('--app='))?.slice(6),
  };
}

function recordKey(userId, org, dept) {
  return `${userId}\t${org}\t${dept}`;
}

function permissionsToList(rec) {
  const st = rec?.permissions;
  if (!st?.value || !Array.isArray(st.value)) return [];
  return st.value
    .map((row) => trimCell(row.value?.perm?.value))
    .filter(Boolean);
}

function permissionsFields(perms) {
  return {
    permissions: {
      value: perms.map((p) => ({ value: { perm: { value: p } } })),
    },
  };
}

function samePermList(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort().join('|');
  const sb = [...b].sort().join('|');
  return sa === sb;
}

async function fetchAllRecords(baseUrl, headers, appId) {
  const all = [];
  let offset = 0;
  while (true) {
    const q = `order by user_id asc limit ${PAGE} offset ${offset}`;
    const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}&fields[0]=user_id&fields[1]=org&fields[2]=dept&fields[3]=permissions&fields[4]=%24id&fields[5]=%24revision`;
    const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const rows = j.records || [];
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

async function main() {
  const { dryRun, apply, xlsx, appId: appArg } = parseArgs();
  const { rows: excelRows, skippedPerms } = readExcelAccountRows(xlsx);
  const excelMap = new Map();
  for (const row of excelRows) {
    excelMap.set(recordKey(row.user_id, row.org, row.dept), row.permissions);
  }
  const multi = excelRows.filter((r) => r.permissions.length > 1).length;
  console.log(`excel: ${excelRows.length} records, ${multi} with 2+ permissions`);
  if (skippedPerms.length) console.warn('skipped continuation perms:', skippedPerms);

  const { baseUrl, headers } = getKintoneConfig();
  const appId = appArg ? Number(appArg) : loadAppIds().dbAppId;
  if (!appId) throw new Error('dbAppId missing');

  const kintoneRows = await fetchAllRecords(baseUrl, headers, appId);
  console.log(`kintone: ${kintoneRows.length} records`);

  const updates = [];
  const missing = [];
  for (const rec of kintoneRows) {
    const userId = trimCell(rec.user_id?.value);
    const org = trimCell(rec.org?.value);
    const dept = trimCell(rec.dept?.value);
    const key = recordKey(userId, org, dept);
    const expected = excelMap.get(key);
    if (!expected) {
      missing.push(key);
      continue;
    }
    const current = permissionsToList(rec);
    if (samePermList(current, expected)) continue;
    updates.push({
      id: Number(rec.$id.value),
      revision: Number(rec.$revision.value),
      user_id: userId,
      current,
      expected,
    });
  }

  console.log(`updates needed: ${updates.length}`);
  if (missing.length) console.warn(`excel unmatched kintone keys: ${missing.length}`, missing.slice(0, 3));

  if (dryRun) {
    updates.slice(0, 8).forEach((u) => {
      console.log(`${u.user_id}: [${u.current.join(', ')}] -> [${u.expected.join(', ')}]`);
    });
    return;
  }
  if (!apply) {
    console.error('Use --apply to PUT (or --dry-run)');
    process.exit(1);
  }

  for (const u of updates) {
    await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: appId,
        id: u.id,
        revision: u.revision,
        record: permissionsFields(u.expected),
      }),
    });
    console.log(`updated ${u.user_id} -> ${u.expected.join('、')}`);
  }
  console.log(`done updates=${updates.length}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
