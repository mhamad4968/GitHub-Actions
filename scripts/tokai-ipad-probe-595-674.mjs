#!/usr/bin/env node
import { getKintoneConfig, fetchJson } from './lib/tokai-ipad-kintone.mjs';

const { baseUrl, headers } = getKintoneConfig();
const h = { ...headers, 'Content-Type': undefined };

const f595 = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=595`, { method: 'GET', headers: h });
const interesting = Object.entries(f595.properties)
  .filter(([c, p]) => /name|dept|org|所属|氏名|emp|退職/i.test(c + (p.label || '')))
  .map(([c, p]) => ({ c, t: p.type, l: p.label }));
console.log('595', JSON.stringify(interesting, null, 2));

const f674 = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=674`, { method: 'GET', headers: h });
for (const c of ['user_name', 'm365_id', 'm365_pw', 'vpn_id', 'vpn_pw', 'dept_name', 'status', 'employee_name']) {
  const p = f674.properties[c];
  console.log('674', c, p ? `${p.type}/${p.label}` : 'MISSING');
}

// sample one 595 record
const s = await fetchJson(
  `${baseUrl}/k/v1/records.json?app=595&query=${encodeURIComponent('limit 1')}&totalCount=true`,
  { method: 'GET', headers: h },
);
console.log('595 total', s.totalCount);
if (s.records && s.records[0]) {
  const r = s.records[0];
  console.log(
    '595 sample keys',
    Object.keys(r)
      .filter((k) => !k.startsWith('$') && r[k] && r[k].value)
      .slice(0, 25),
  );
}
