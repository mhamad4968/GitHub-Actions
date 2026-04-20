/**
 * ⚠️ ONE-SHOT BACKFILL SCRIPT —— 通常運用では実行しないでください。
 *
 * 用途:
 *   過去データの「紐付けの抜け」を埋めるための **1 度きり** スクリプトです。
 *   通常の登録・更新・退職処理では、各アプリの保存時自動連携で十分整います。
 *
 * 再実行を検討すべきケース（例）:
 *   - 大量 CSV インポートで紐付けだけ反映漏れがあった
 *   - 別テナント / 別環境からデータを丸ごと移行した
 *   - 障害復旧でバックアップを書き戻し、紐付けが破損した
 *
 * 再実行する前に必ず:
 *   1) 運用者と相談し、再実行が本当に必要か合意する
 *   2) まず `-- --dry-run` を付けて対象件数・内容を確認する
 *   3) 問題なければ環境変数 `ONESHOT_CONFIRM=yes` を付けて本実行する
 *
 * 詳細: kintone-apps.md の「保留中の整理候補（B: ワンショット）」を参照
 */

import 'dotenv/config';

if (process.env.ONESHOT_CONFIRM !== 'yes' && !process.argv.includes('--dry-run')) {
  console.error('');
  console.error('⚠️  このスクリプトは ONE-SHOT BACKFILL（実行済み・通常運用不要）です。');
  console.error('   このまま実行することはブロックされています。');
  console.error('');
  console.error('   ・ 件数・対象を確認したいだけ → 末尾に  -- --dry-run  を付けて実行');
  console.error('   ・ 本当に再実行する          → 先頭に  ONESHOT_CONFIRM=yes  を付けて実行');
  console.error('');
  console.error('   詳細: kintone-apps.md「保留中の整理候補(B: ワンショット)」');
  console.error('');
  process.exit(2);
}

import {
  shouldSkip627PcAutolinkFromRecord,
  loadSkipRulesFromEnv,
  FC_627_CATEGORY,
} from './lib/kintone-627-pc-autolink-skip.js';

/**
 * 627 のサブテーブル `pc_ledger_links` に、次の集合をマージしたユニークな 594 ID を反映する。
 * - 627 の単一フィールド `pc_594_record_id`（代表・既存運用）
 * - 同一メールの 595 の `pc_ledger_list` 各行
 * - すでに `pc_ledger_links` にある行（手入力分を消さない）
 *
 *   npm run backfill:627:pc_ledger_links
 *   npm run backfill:627:pc_ledger_links -- --dry-run
 *   npm run backfill:627:pc_ledger_links -- --verbose
 *
 * 管理者など PC 自動結線の対象外は `scripts/lib/kintone-627-pc-autolink-skip.js`（.env）参照。
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

async function getRecord(app, id) {
  const url = new URL(`${baseUrl}/k/v1/record.json`);
  url.searchParams.set('app', String(app));
  url.searchParams.set('id', String(id));
  return fetchJson(url, { method: 'GET', headers: headersWithoutContentType(headers) }).then((j) => j.record);
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

function normMail(m) {
  return String(m || '')
    .trim()
    .toLowerCase();
}

const APP_595 = 595;
const APP_627 = 627;
const FC_595_MAIL = 'mail';
const FC_595_PC_TABLE = 'pc_ledger_list';
/** 627 トップの代表 PC（594 の $id） */
const FC_627_TOP_PC594 = 'pc_594_record_id';
/** 595 pc_ledger_list ・627 サブテーブル内の列（594 の $id）。627 サブはトップとコード重複できないため別名 */
const FC_627_SUB_PC594 = 'pc_ledger_link_594_id';
const FC_595_PC594 = 'pc_594_record_id';
const FC_627_MAIL = 'mail';
const FC_627_SUB = 'pc_ledger_links';

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');
const skipPcRules = loadSkipRulesFromEnv();

/** @param {string[]} ids */
function sortedIds(ids) {
  return [...ids].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

/** @param {{ value?: Record<string, unknown> }[]} rows */
function idsFrom627Subtable(rows) {
  const out = [];
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    const cell =
      row.value && row.value[FC_627_SUB_PC594] ? normId(row.value[FC_627_SUB_PC594].value) : '';
    if (cell) out.push(cell);
  }
  return sortedIds([...new Set(out)]);
}

/** @param {string[]} nextIds sorted unique */
function buildSubtableValue(nextIds) {
  return nextIds.map((id594) => ({
    value: {
      [FC_627_SUB_PC594]: { value: id594 },
    },
  }));
}

// --- load 595 → mail → Set of 594 ids
/** @type {Map<string, Set<string>>} */
const mailTo594 = new Map();
const page595 = 500;
let off595 = 0;
for (;;) {
  const batch = await getRecords(
    APP_595,
    `order by $id asc limit ${page595} offset ${off595}`,
    ['$id', FC_595_MAIL, FC_595_PC_TABLE],
  );
  if (!batch.length) break;
  off595 += batch.length;
  for (const r of batch) {
    const m = normMail(r[FC_595_MAIL] && r[FC_595_MAIL].value != null ? r[FC_595_MAIL].value : '');
    if (!m) continue;
    if (!mailTo594.has(m)) mailTo594.set(m, new Set());
    const set = mailTo594.get(m);
    const tbl = (r[FC_595_PC_TABLE] && r[FC_595_PC_TABLE].value) || [];
    if (Array.isArray(tbl)) {
      for (const row of tbl) {
        const id = row.value && row.value[FC_595_PC594] ? normId(row.value[FC_595_PC594].value) : '';
        if (id) set.add(id);
      }
    }
  }
  if (batch.length < page595) break;
}

if (verbose) {
  console.error(`[627-pc-links] 595 loaded mails with pc rows=${mailTo594.size}`);
}

// --- paginate 627
let ok = 0;
let skip = 0;
let skipPcAutolink = 0;
let changed = 0;
let off627 = 0;
const page = 100;

for (;;) {
  const batch = await getRecords(
    APP_627,
    `order by $id asc limit ${page} offset ${off627}`,
    ['$id', '$revision', FC_627_MAIL, FC_627_TOP_PC594, FC_627_SUB, FC_627_CATEGORY],
  );
  if (!batch.length) break;
  off627 += batch.length;

  for (const r627 of batch) {
    const id627 = r627.$id && r627.$id.value != null ? String(r627.$id.value) : '';
    if (!id627) {
      skip++;
      continue;
    }

    const mail = normMail(r627[FC_627_MAIL] && r627[FC_627_MAIL].value != null ? r627[FC_627_MAIL].value : '');
    const { skip: skipRow, reason: skipReason } = shouldSkip627PcAutolinkFromRecord(r627, skipPcRules);
    if (skipRow) {
      if (verbose) console.error(`[skip-pc-autolink] 627 id=${id627} reason=${skipReason}`);
      skipPcAutolink++;
      continue;
    }

    const top = normId(
      r627[FC_627_TOP_PC594] && r627[FC_627_TOP_PC594].value != null
        ? r627[FC_627_TOP_PC594].value
        : '',
    );
    const existingRows = (r627[FC_627_SUB] && r627[FC_627_SUB].value) || [];
    const existingIds = idsFrom627Subtable(existingRows);

    const merged = new Set();
    if (top) merged.add(top);
    for (const x of existingIds) merged.add(x);
    if (mail && mailTo594.has(mail)) {
      for (const x of mailTo594.get(mail)) merged.add(x);
    }

    const nextSorted = sortedIds([...merged]);
    const curSorted = existingIds;
    const same =
      nextSorted.length === curSorted.length && nextSorted.every((v, i) => v === curSorted[i]);

    if (same) {
      if (verbose) console.error(`[skip] 627 id=${id627} unchanged n=${nextSorted.length}`);
      skip++;
      continue;
    }

    changed++;
    if (dryRun) {
      console.log(
        `[dry-run] 627 id=${id627} mail=${mail || '(empty)'} was=[${curSorted.join(',')}] → will=[${nextSorted.join(',')}]`,
      );
      ok++;
      continue;
    }

    try {
      const rec = await getRecord(APP_627, id627);
      await putRecord(APP_627, id627, rec.$revision.value, {
        [FC_627_SUB]: { value: buildSubtableValue(nextSorted) },
      });
      console.log(`[627-pc-links] 627 id=${id627} pc_ledger_links n=${nextSorted.length}`);
      ok++;
    } catch (e) {
      console.warn(`[627-pc-links] PUT failed 627 id=${id627}`, e.message || e);
      skip++;
    }
  }
}

console.error(
  `[backfill-627-pc-ledger-links] dryRun=${dryRun} ok=${ok} skip=${skip} skipPcAutolink=${skipPcAutolink} wouldChange=${changed} mails595=${mailTo594.size}`,
);
