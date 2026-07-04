#!/usr/bin/env node
/** 595↔698 突合分析 — mail / user_name での照合 */
import { fetchJson, getKintoneConfig, loadAppIds } from './lib/business-improvement-kintone.mjs';
import { normalizeEmployeeKey } from './business-improvement-sync-595.mjs';

function normName(name) {
  return String(name || '')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normMail(mail) {
  return String(mail || '').trim().toLowerCase();
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

const { baseUrl, headers } = getKintoneConfig();
const empId = loadAppIds().employeeAppId;
const r595 = await getAllRecords(baseUrl, headers, 595, [
  'user_name',
  'dept_name',
  'group_name',
  'employment_status',
  'mail',
  '$id',
]);
const r698 = await getAllRecords(baseUrl, headers, empId, [
  'user_name',
  'dept_name',
  'group_name',
  'employment_status',
  '$id',
]);

const keys595 = new Set();
const byName595 = new Map();
const byMail595 = new Map();
for (const r of r595) {
  const key = normalizeEmployeeKey(r.user_name?.value, r.dept_name?.value);
  keys595.add(key);
  const name = normName(r.user_name?.value);
  if (!byName595.has(name)) byName595.set(name, []);
  byName595.get(name).push(r);
  const mail = normMail(r.mail?.value);
  if (mail) byMail595.set(mail, r);
}

const orphans698 = [];
const dupNames698 = [];
for (const r of r698) {
  const key = normalizeEmployeeKey(r.user_name?.value, r.dept_name?.value);
  if (!keys595.has(key)) {
    const name = normName(r.user_name?.value);
    const in595ByName = byName595.get(name) || [];
    orphans698.push({
      id698: r.$id?.value,
      user698: r.user_name?.value,
      dept698: r.dept_name?.value,
      group698: r.group_name?.value,
      status698: r.employment_status?.value,
      match595ByName: in595ByName.map((x) => ({
        id595: x.$id?.value,
        dept: x.dept_name?.value,
        group: x.group_name?.value,
        mail: x.mail?.value,
        status: x.employment_status?.value,
      })),
    });
  }
}

const dupNames595 = [...byName595.entries()].filter(([, rows]) => rows.length > 1);
const mailDupes = new Map();
for (const r of r595) {
  const mail = normMail(r.mail?.value);
  if (!mail) continue;
  if (!mailDupes.has(mail)) mailDupes.set(mail, []);
  mailDupes.get(mail).push(r);
}
const mailNotUnique = [...mailDupes.entries()].filter(([, rows]) => rows.length > 1);

console.log(
  JSON.stringify(
    {
      count595: r595.length,
      count698: r698.length,
      drift698Only: orphans698.length,
      orphans698,
      dupNames595Count: dupNames595.length,
      mailNotUniqueCount: mailNotUnique.length,
      mailNotUniqueSample: mailNotUnique.slice(0, 3).map(([m, rows]) => ({
        mail: m,
        users: rows.map((r) => ({ name: r.user_name?.value, dept: r.dept_name?.value })),
      })),
    },
    null,
    2,
  ),
);
