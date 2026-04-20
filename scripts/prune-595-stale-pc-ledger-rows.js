import 'dotenv/config';

/**
 * 595 の pc_ledger_list のうち、pc_594_record_id が指す 594 が存在しない（404）行を削除する。
 * 削除後に backfill:594:627_cross_refs の getFail を解消しやすくする。
 *
 *   npm run prune:595:stale_pc_ledger
 *   npm run prune:595:stale_pc_ledger -- --dry-run
 *   npm run prune:595:stale_pc_ledger -- --verbose
 */
function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

function headersWithoutContentType(h) {
  const out = { ...h };
  delete out['Content-Type'];
  return out;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const detail = json?.errors ? ` errors=${JSON.stringify(json.errors)}` : '';
    throw new Error(`HTTP ${res.status} ${res.statusText} ${json?.code || ''} ${json?.message || text}${detail}`.trim());
  }
  return json;
}

async function getRecords(app, query, fields) {
  const params = new URLSearchParams();
  params.set('app', String(app));
  params.set('query', query);
  (fields || []).forEach((f, i) => params.set(`fields[${i}]`, f));
  const url = new URL(`${baseUrl}/k/v1/records.json?${params.toString()}`);
  const res = await fetch(url, { method: 'GET', headers: headersWithoutContentType(headers) });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) {
    throw new Error(`GET records ${json?.code || ''} ${json?.message || text}`.trim());
  }
  return json.records || [];
}

async function putRecord(app, id, revision, record) {
  const putUrl = new URL(`${baseUrl}/k/v1/record.json`);
  return fetchJson(putUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app, id, revision, record }),
  });
}

function normId(v) {
  if (v == null || v === '') return '';
  return String(v).trim();
}

const APP_595 = 595;
const APP_594 = 594;
const FC_TABLE = 'pc_ledger_list';
const FC_PC_ID = 'pc_594_record_id';
const FC_PC_DONE = 'pc_ledger_entry_done';

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

async function record594Exists(id594) {
  const url = new URL(`${baseUrl}/k/v1/record.json`);
  url.searchParams.set('app', String(APP_594));
  url.searchParams.set('id', String(id594));
  const res = await fetch(url, { method: 'GET', headers: headersWithoutContentType(headers) });
  if (res.status === 404) return false;
  const text = await res.text();
  if (!res.ok) {
    let j = null;
    try {
      j = JSON.parse(text);
    } catch {
      /* noop */
    }
    throw new Error(`GET 594 id=${id594} ${res.status} ${j?.code || ''} ${j?.message || text}`.trim());
  }
  return true;
}

/** PUT 用に残す行（子フィールドは GET のままコピー） */
function rowToPut(row) {
  const id = row.id;
  const v = row.value || {};
  const value = {};
  for (const k of Object.keys(v)) {
    value[k] = v[k];
  }
  if (id != null && String(id) !== '') {
    return { id: String(id), value };
  }
  return { value };
}

let updated595 = 0;
let removedRows = 0;
let skipped595 = 0;
const cache594 = new Map();

async function cached594Exists(id594) {
  const k = String(id594);
  if (cache594.has(k)) return cache594.get(k);
  const ok = await record594Exists(k);
  cache594.set(k, ok);
  return ok;
}

let offset = 0;
const page = 100;

for (;;) {
  const batch = await getRecords(
    APP_595,
    `order by $id asc limit ${page} offset ${offset}`,
    ['$id', '$revision', FC_TABLE],
  );
  if (!batch.length) break;
  offset += batch.length;

  for (const rec of batch) {
    const id595 = rec.$id && rec.$id.value != null ? String(rec.$id.value) : '';
    const rows = (rec[FC_TABLE] && rec[FC_TABLE].value) || [];
    if (!id595 || !rows.length) {
      skipped595++;
      continue;
    }

    const kept = [];
    const pruned = [];
    for (const row of rows) {
      const raw = row.value && row.value[FC_PC_ID] ? row.value[FC_PC_ID].value : null;
      const id594 = normId(raw);
      if (!id594) {
        kept.push(row);
        continue;
      }
      let exists;
      try {
        exists = await cached594Exists(id594);
      } catch (e) {
        console.warn(`[prune595] 594 確認エラー id594=${id594} 595=${id595}`, e.message || e);
        kept.push(row);
        continue;
      }
      if (exists) {
        kept.push(row);
      } else {
        pruned.push(id594);
        removedRows++;
      }
    }

    if (!pruned.length) {
      skipped595++;
      continue;
    }

    if (verbose) {
      console.error(`[prune595] 595 id=${id595} remove stale pc_594=[${pruned.join(',')}]`);
    }

    if (dryRun) {
      updated595++;
      continue;
    }

    const putRows = kept.map(rowToPut);
    try {
      await putRecord(APP_595, id595, rec.$revision.value, {
        [FC_TABLE]: { value: putRows },
      });
      console.log(`[prune595] updated 595 id=${id595} removed=${pruned.join(',')}`);
      updated595++;
    } catch (e) {
      console.warn(`[prune595] PUT 失敗 595 id=${id595}`, e.message || e);
    }
  }
}

console.error(
  `[prune-595-stale-pc-ledger] dryRun=${dryRun} updated595=${updated595} subtableRowsRemoved=${removedRows} skippedNoop595≈${skipped595} unique594IdsChecked=${cache594.size}`,
);
