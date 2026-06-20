#!/usr/bin/env node
import {
  fetchJson,
  getKintoneConfig,
  inferDomainFromVpnId,
  loadAppIds,
  RECORD_KIND_LICENSE_SNAPSHOT,
  RECORD_KIND_SETTING,
} from './lib/vpn-account-kintone.mjs';

const { baseUrl, headers } = getKintoneConfig();
const appId = loadAppIds().dbAppId;
const baseQuery = `record_kind not in ("${RECORD_KIND_SETTING}", "${RECORD_KIND_LICENSE_SNAPSHOT}") order by $id asc`;
const all = [];
let offset = 0;
let totalCount = null;

while (true) {
  const q = encodeURIComponent(`${baseQuery} limit 100 offset ${offset}`);
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${q}&fields[0]=vpn_domain&fields[1]=vpn_id&fields[2]=dept&totalCount=true`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  if (totalCount == null) totalCount = Number(j.totalCount || 0);
  const rows = j.records || [];
  all.push(...rows);
  if (!rows.length || all.length >= totalCount) break;
  offset += rows.length;
}

const domains = {};
all.forEach((r) => {
  const k = r.vpn_domain?.value ?? '(empty)';
  domains[k] = (domains[k] || 0) + 1;
});
console.log(`total=${totalCount} fetched=${all.length}`);
console.log('vpn_domain counts:', domains);

const bnp = all.filter((r) => String(r.vpn_id?.value || '').includes('bnp001'));
console.log(
  'bnp:',
  bnp.map((r) => ({ vpnId: r.vpn_id?.value, domain: r.vpn_domain?.value, dept: r.dept?.value })),
);

const inferred = { fre: 0, ds: 0, bnp: 0 };
all.forEach((r) => {
  const d = inferDomainFromVpnId(r.vpn_id?.value || '');
  if (d.includes('ds.fre')) inferred.ds++;
  else if (d.includes('bnp001')) inferred.bnp++;
  else inferred.fre++;
});
console.log('inferred from vpn_id:', inferred);
