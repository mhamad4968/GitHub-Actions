#!/usr/bin/env node
/**
 * 595 → 新② 社員マスタ 同期（初回・日次共通）
 * 突合キー: 595 mail（内部）→ 新② は user_name + dept_name（浜田確定・#3）
 */
import {
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/business-improvement-kintone.mjs';

const APP_595 = 595;
const FIELDS_595 = ['user_name', 'dept_name', 'group_name', 'employment_status', 'mail'];
const FIELDS_EMP = ['user_name', 'dept_name', 'group_name', 'employment_status', '$id', '$revision'];

/** 674 / 595 同様の表記ゆれ吸収 */
export function normalizeEmployeeKey(name, dept) {
  const n = String(name || '')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const d = String(dept || '')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${d}\u0001${n}`;
}

async function getAllRecords(baseUrl, headers, app, fields) {
  const out = [];
  let offset = 0;
  const limit = 500;
  for (;;) {
    const query = encodeURIComponent(`order by $id asc limit ${limit} offset ${offset}`);
    const params = fields.map((f, i) => `fields[${i}]=${encodeURIComponent(f)}`).join('&');
    const url = `${baseUrl}/k/v1/records.json?app=${app}&query=${query}&${params}`;
    const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
    const batch = j.records || [];
    out.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return out;
}

function toEmployeeRecord(row595) {
  const rec = {
    user_name: { value: String(row595.user_name?.value || '').trim() },
    dept_name: { value: String(row595.dept_name?.value || '').trim() },
    group_name: { value: String(row595.group_name?.value || '').trim() },
  };
  const st = row595.employment_status?.value;
  if (st) rec.employment_status = { value: st };
  return rec;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const employeeAppId = state.employeeAppId;
  if (!employeeAppId) throw new Error('employeeAppId missing — run business-improvement:create-employee-app');

  const rows595 = await getAllRecords(baseUrl, headers, APP_595, FIELDS_595);
  const rowsEmp = await getAllRecords(baseUrl, headers, employeeAppId, FIELDS_EMP);

  const mailTo595 = new Map();
  for (const r of rows595) {
    const mail = String(r.mail?.value || '').trim().toLowerCase();
    if (mail) mailTo595.set(mail, r);
  }

  const keyToEmp = new Map();
  for (const r of rowsEmp) {
    const key = normalizeEmployeeKey(r.user_name?.value, r.dept_name?.value);
    keyToEmp.set(key, r);
  }

  const toPost = [];
  const toPut = [];
  let skip = 0;

  for (const r595 of rows595) {
    const mail = String(r595.mail?.value || '').trim().toLowerCase();
    const key = normalizeEmployeeKey(r595.user_name?.value, r595.dept_name?.value);
    const payload = toEmployeeRecord(r595);

    let existing = keyToEmp.get(key);
    if (!existing && mail) {
      for (const emp of rowsEmp) {
        const empKey = normalizeEmployeeKey(emp.user_name?.value, emp.dept_name?.value);
        if (empKey === key) {
          existing = emp;
          break;
        }
      }
    }

    if (!existing) {
      toPost.push(payload);
      continue;
    }

    const same =
      String(existing.user_name?.value || '').trim() === payload.user_name.value &&
      String(existing.dept_name?.value || '').trim() === payload.dept_name.value &&
      String(existing.group_name?.value || '').trim() === payload.group_name.value &&
      String(existing.employment_status?.value || '') === String(payload.employment_status?.value || '');

    if (same) {
      skip += 1;
      continue;
    }

    toPut.push({
      id: existing.$id.value,
      revision: existing.$revision.value,
      record: payload,
    });
  }

  console.log(JSON.stringify({
    dryRun,
    source595: rows595.length,
    existingEmp: rowsEmp.length,
    toPost: toPost.length,
    toPut: toPut.length,
    skipUnchanged: skip,
  }, null, 2));

  if (dryRun) return;

  const CHUNK = 100;
  for (let i = 0; i < toPost.length; i += CHUNK) {
    await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: employeeAppId, records: toPost.slice(i, i + CHUNK) }),
    });
    console.log(`[sync] POST ${Math.min(i + CHUNK, toPost.length)}/${toPost.length}`);
  }

  for (const item of toPut) {
    await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: employeeAppId,
        id: item.id,
        revision: item.revision,
        record: item.record,
      }),
    });
  }
  if (toPut.length) console.log(`[sync] PUT ${toPut.length}`);

  console.log(`[sync] OK employeeApp=${employeeAppId}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
