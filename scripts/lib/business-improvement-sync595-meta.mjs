/**
 * 595→698 同期結果を 697 共通設定 sync595_meta に保存
 */
import { fetchJson } from './business-improvement-kintone.mjs';

export function formatJstNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const g = (t) => parts.find((p) => p.type === t)?.value || '';
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}:${g('second')} JST`;
}

export function buildSync595Meta({ ok, stats, error }) {
  const at = new Date().toISOString();
  const meta = {
    at,
    atDisplay: formatJstNow(),
    ok: Boolean(ok),
    source595: stats?.source595 ?? null,
    existingBefore: stats?.existingEmp ?? null,
    added: stats?.toPost ?? null,
    updated: stats?.toPut ?? null,
    unchanged: stats?.skipUnchanged ?? null,
    mirrorTotal: stats?.mirrorTotal ?? null,
    error: error ? String(error).slice(0, 2000) : null,
  };
  return meta;
}

async function fetchCommonSettings(baseUrl, headers, settingsAppId) {
  const query = encodeURIComponent('record_kind in ("共通設定") order by $id asc limit 1');
  const url =
    `${baseUrl}/k/v1/records.json?app=${settingsAppId}` +
    `&query=${query}&fields[0]=$id&fields[1]=sync595_meta`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return (j.records || [])[0] || null;
}

export async function writeSync595Meta(baseUrl, headers, settingsAppId, meta, { dryRun = false } = {}) {
  if (!settingsAppId) throw new Error('settingsAppId missing');
  const rec = await fetchCommonSettings(baseUrl, headers, settingsAppId);
  if (!rec) throw new Error('共通設定レコードがありません');
  const payload = JSON.stringify(meta, null, 0);
  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, recordId: rec.$id.value, meta }, null, 2));
    return;
  }
  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: settingsAppId,
      id: rec.$id.value,
      record: { sync595_meta: { value: payload } },
    }),
  });
  console.log(`[sync595_meta] written record=${rec.$id.value} ok=${meta.ok}`);
}
