#!/usr/bin/env node
import { getKintoneConfig, fetchJson } from './lib/tokai-ipad-kintone.mjs';

const { baseUrl, headers } = getKintoneConfig();
const h = { ...headers, 'Content-Type': undefined };
const j = await fetchJson(
  `${baseUrl}/k/v1/records.json?app=769&query=${encodeURIComponent('order by device_name asc limit 5')}&totalCount=true`,
  { method: 'GET', headers: h },
);
console.log(JSON.stringify({ total: j.totalCount, sample: (j.records || []).map((r) => ({
  device: r.device_name.value,
  location: r.location.value,
  user: r.user_name.value,
  date: r.rental_start_date.value,
  status: r.status.value,
})) }, null, 2));
for (const id of [769, 770, 720, 721]) {
  const a = await fetchJson(`${baseUrl}/k/v1/app.json?id=${id}`, { method: 'GET', headers: h });
  console.log(JSON.stringify({ id, name: a.name, spaceId: a.spaceId, threadId: a.threadId }));
}
