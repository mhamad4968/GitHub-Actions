/**
 * kintone 設定レコード（record_kind=setting 等）の idempotent 投入（R45）
 */

/**
 * @param {object} opts
 * @param {string} opts.baseUrl
 * @param {object} opts.headers
 * @param {number|string} opts.appId
 * @param {string} opts.recordKindValue — 設定レコードの record_kind 値
 * @param {string} opts.recordKindField — デフォルト record_kind
 * @param {(fetchJson: Function) => Promise<object>} opts.buildRecord — kintone record オブジェクト
 * @param {Function} opts.fetchJson
 * @param {Function} [opts.log=console.log]
 */
export async function ensureSettingsRecord({
  baseUrl,
  headers,
  appId,
  recordKindValue,
  recordKindField = 'record_kind',
  buildRecord,
  fetchJson,
  log = console.log,
}) {
  const q = encodeURIComponent(`${recordKindField} in ("${recordKindValue}") limit 1`);
  const j = await fetchJson(`${baseUrl}/k/v1/records.json?app=${appId}&query=${q}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  if ((j.records || []).length) {
    log('settings exists');
    return { created: false, id: j.records[0].$id?.value };
  }

  const record = await buildRecord();
  const res = await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, record }),
  });
  log('settings posted id=', res.id);
  return { created: true, id: res.id };
}

/**
 * 必須フィールドを満たすためのダミー値ヘルパ（CB_VA01 回避）
 * @param {Record<string, unknown>} requiredFields — { fieldCode: defaultValue }
 */
export function dummyRequiredFields(requiredFields) {
  const rec = {};
  for (const [code, val] of Object.entries(requiredFields)) {
    rec[code] = { value: val };
  }
  return rec;
}
