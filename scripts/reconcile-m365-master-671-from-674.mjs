#!/usr/bin/env node
/**
 * M365管理マスタ（671）の linked_pcs / usage_count / status を、新・PC台帳（674）の実データから一括再計算する。
 * 671 を手で触ったあとのズレを正す（正本は 674）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/reconcile-m365-master-671-from-674.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/reconcile-m365-master-671-from-674.mjs --apply
 *
 * 注意: `import 'dotenv/config'` は使わない。
 */
const APP_674 = 674;
const APP_671 = 671;
const APP_ENV = 670;

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  authHeaders.Authorization =
    'Basic ' +
    Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64');
}

async function fetchJson(url, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const h = { ...authHeaders, ...init.headers };
  if (method !== 'GET' && init.body != null) {
    h['Content-Type'] = h['Content-Type'] || 'application/json';
  }
  const res = await fetch(url, { ...init, headers: h });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.message || json?.code || text.slice(0, 2000);
    throw new Error(`${res.status} ${msg}`);
  }
  return json;
}

function valCell(r, code) {
  const field = r[code];
  if (!field || field.value == null) return '';
  const v = field.value;
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' && x?.code ? x.code : x)).join(',');
  return String(v);
}

function parseLinked671(raw) {
  return String(raw ?? '')
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function dedupeLinked671PreserveOrder(pcs) {
  const seen = Object.create(null);
  const out = [];
  for (const p of pcs) {
    if (!p || seen[p]) continue;
    seen[p] = true;
    out.push(p);
  }
  return out;
}

function next671StatusFromUsage(count, lim) {
  return count >= lim ? '満杯' : '利用可';
}

async function loadLicenseLimit() {
  const data = await fetchJson(
    `${baseUrl}/k/v1/records.json?app=${APP_ENV}&query=${encodeURIComponent('order by レコード番号 desc limit 200')}&fields[0]=setting_key&fields[1]=setting_value`,
  );
  const map = Object.create(null);
  for (const r of data.records || []) {
    const k = valCell(r, 'setting_key');
    if (k) map[k] = valCell(r, 'setting_value');
  }
  return parseInt(map.M365_LICENSE_LIMIT || '5', 10) || 5;
}

async function fetchAll674AllocationRows() {
  const fields = ['pc_name', 'account_type', 'pc_status', 'm365_master_record_id'];
  const records = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const params = new URLSearchParams();
    params.set('app', String(APP_674));
    params.set(
      'query',
      `order by レコード番号 asc limit ${limit} offset ${offset}`,
    );
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const data = await fetchJson(`${baseUrl}/k/v1/records.json?${params.toString()}`);
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

/** masterId -> Set(pc_name) */
function aggregate674ByMaster674(rows) {
  const map = new Map();
  for (const r of rows) {
    const acc = valCell(r, 'account_type').trim();
    const st = valCell(r, 'pc_status').trim();
    if (acc !== '共有' && acc !== 'JR端末') continue;
    if (st === '廃棄') continue;
    const mid = valCell(r, 'm365_master_record_id').trim();
    const pc = valCell(r, 'pc_name').trim();
    if (!mid || !pc) continue;
    if (!map.has(mid)) map.set(mid, new Set());
    map.get(mid).add(pc);
  }
  return map;
}

async function fetch671PoolRows() {
  const fields = ['$id', 'linked_pcs', 'usage_count', 'status', 'account_type'];
  const records = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const params = new URLSearchParams();
    params.set('app', String(APP_671));
    params.set(
      'query',
      `account_type in ("共有") order by レコード番号 asc limit ${limit} offset ${offset}`,
    );
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const data = await fetchJson(`${baseUrl}/k/v1/records.json?${params.toString()}`);
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

function desired671State(pcsSet, lim) {
  const pcsArr = Array.from(pcsSet || []).sort();
  const linked = pcsArr.join(',');
  const usage = pcsArr.length;
  const status = next671StatusFromUsage(usage, lim);
  return { linked, usage, status };
}

async function put671IfDiff671(id, revision, desired, currentLinked, currentUsage, currentStatus, dry) {
  const curList = dedupeLinked671PreserveOrder(parseLinked671(currentLinked))
    .slice()
    .sort()
    .join(',');
  if (
    curList === desired.linked &&
    String(currentUsage).trim() === String(desired.usage) &&
    String(currentStatus || '').trim() === desired.status
  ) {
    return { changed: false };
  }
  if (dry) {
    return { changed: true, dry: true };
  }
  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers: {},
    body: JSON.stringify({
      app: APP_671,
      id: String(id),
      revision,
      record: {
        linked_pcs: { value: desired.linked },
        usage_count: { value: String(desired.usage) },
        status: { value: desired.status },
      },
    }),
  });
  return { changed: true };
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  if (!dry && !apply) {
    console.error('Usage: ... reconcile-m365-master-671-from-674.mjs (--dry-run | --apply)');
    process.exit(1);
  }

  const lim = await loadLicenseLimit();
  const [rows674, rows671] = await Promise.all([fetchAll674AllocationRows(), fetch671PoolRows()]);
  const agg = aggregate674ByMaster674(rows674);

  const idsToSync = new Set(agg.keys());
  for (const r of rows671) {
    idsToSync.add(valCell(r, '$id').trim());
  }

  let wouldChange = 0;
  let applied = 0;
  let skipped = 0;

  for (const id of idsToSync) {
    if (!id) continue;
    const pcsSet = agg.get(id) || new Set();
    const desired = desired671State(pcsSet, lim);

    const row671 = rows671.find((x) => valCell(x, '$id').trim() === id);
    if (!row671) {
      if (pcsSet.size > 0) {
        console.warn(`WARN: 674 references m365_master_record_id=${id} but no 671 row found`);
      }
      skipped++;
      continue;
    }
    const st671 = valCell(row671, 'status').trim();
    if (st671 === '廃止') {
      skipped++;
      continue;
    }

    const get671 = await fetchJson(`${baseUrl}/k/v1/record.json?app=${APP_671}&id=${encodeURIComponent(id)}`);
    const rev = get671.revision;
    const r = get671.record;
    const curLinked = valCell(r, 'linked_pcs');
    const curUsage = valCell(r, 'usage_count');
    const curSt = valCell(r, 'status');

    const res = await put671IfDiff671(id, rev, desired, curLinked, curUsage, curSt, dry);
    if (res.changed) {
      wouldChange++;
      if (!res.dry) applied++;
      if (dry) console.log(`DRY would update 671 id=${id} → linked=${desired.linked} usage=${desired.usage} status=${desired.status}`);
    }
  }

  console.log(
    dry
      ? `dry-run: 671 candidates=${idsToSync.size} would_update=${wouldChange} (limit=${lim})`
      : `apply: 671 candidates=${idsToSync.size} updated=${applied} (limit=${lim})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
