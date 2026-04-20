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

/**
 * 595 全件（または --limit 件）について、同一メールの 594 / 627 を列挙し、
 * ブラウザの「メールで台帳番号を取り込み」と同様に未登録分だけマージする。
 *
 * - pc_ledger_list … 594 の $id（廃棄・廃止・廃止フラグ行は除外。desktop.js と同条件）
 * - ledger_record_id / ledger_created … 627 が 1 件以上あるとき（代表は数値 ID の最小）
 * - ledger_link_list … フォームにフィールドがあるときのみ行をマージ。無い場合は上記トップのみ更新し、
 *   複数 627 の行展開はスキップ（後から npm run setup:595:ledger_link_subtable で追加可）
 *
 *   npm run backfill:595:ledger_from_mail
 *   npm run backfill:595:ledger_from_mail -- --dry-run
 *   npm run backfill:595:ledger_from_mail -- --verbose
 *   npm run backfill:595:ledger_from_mail -- --limit 20
 *   npm run backfill:595:ledger_from_mail -- --pc-only | --627-only
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

function normId(v) {
  if (v == null || v === '') return '';
  return String(v).trim();
}

/** desktop shouldSkip594RetireOrDisposedRow と同条件 */
function shouldSkip594Row(r) {
  const abo = r.abolished_flag && r.abolished_flag.value;
  if (abo && abo.length) {
    for (let j = 0; j < abo.length; j++) {
      if (abo[j] === '廃止') return true;
    }
  }
  const st = String((r.status && r.status.value) || '').trim();
  return st.includes('廃棄') || st.includes('除却') || st.includes('廃止');
}

/** @param {string[]} ids */
function sortedIds(ids) {
  return [...ids].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

function primary627(ids) {
  if (!ids.length) return '';
  const nums = ids.map((s) => parseInt(String(s), 10)).filter((n) => Number.isFinite(n));
  return nums.length > 0 ? String(Math.min(...nums)) : String(ids[0]);
}

const APP_595 = 595;
const APP_594 = 594;
const APP_627 = 627;
const FC_595_MAIL = 'mail';
const FC_PC_TABLE = 'pc_ledger_list';
const FC_PC_ID = 'pc_594_record_id';
const FC_PC_DONE = 'pc_ledger_entry_done';
const DONE_OPT = '作成済み';
const FC_594_MAIL = 'mail';
const FC_627_MAIL = 'mail';
const FC_LEDGER_RID = 'ledger_record_id';
const FC_LEDGER_DONE = 'ledger_created';
const FC_LEDGER_TABLE = 'ledger_link_list';
const FC_LEDGER_COL_627 = 'ledger_627_record_id';

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');
const pcOnly = process.argv.includes('--pc-only');
const k627Only = process.argv.includes('--627-only');
if (pcOnly && k627Only) {
  console.error('[backfill] --pc-only と --627-only は同時に指定しないでください');
  process.exit(1);
}
const doPc = !k627Only;
const do627 = !pcOnly;

let recordLimit = 0;
{
  const i = process.argv.indexOf('--limit');
  if (i >= 0 && process.argv[i + 1]) {
    recordLimit = Math.max(1, parseInt(process.argv[i + 1], 10) || 0);
  }
}

/** 627 複数行用サブテーブル（無ければ ledger_record_id / ledger_created のみ更新） */
let hasLedgerSub = false;
if (do627) {
  const formUrl = new URL(`${baseUrl}/k/v1/app/form/fields.json`);
  formUrl.searchParams.set('app', String(APP_595));
  const formJson = await fetchJson(formUrl, { method: 'GET', headers: headersWithoutContentType(headers) });
  hasLedgerSub = Boolean(formJson.properties && formJson.properties[FC_LEDGER_TABLE]);
  if (!hasLedgerSub) {
    console.error(
      `[backfill] 注意: ${FC_LEDGER_TABLE} がありません。627 は「アカウント台帳レコード番号（最小）」と「作成済み」のみ更新します。複数 627 を行で持つには npm run setup:595:ledger_link_subtable を実行後に再バックフィルしてください。`,
    );
  }
}

function buildMergedPcRows(existingRows, ids594Set) {
  const rows = Array.isArray(existingRows) ? [...existingRows] : [];
  const known = new Set();
  for (const row of rows) {
    const val = row.value && row.value[FC_PC_ID] ? normId(row.value[FC_PC_ID].value) : '';
    if (val) known.add(val);
  }

  let changed = false;
  const next = rows.map((row) => {
    const cellId = row.value && row.value[FC_PC_ID] ? normId(row.value[FC_PC_ID].value) : '';
    if (!cellId || !ids594Set.has(cellId)) {
      return row;
    }
    const done = (row.value[FC_PC_DONE] && row.value[FC_PC_DONE].value) || [];
    if (!Array.isArray(done) || !done.includes(DONE_OPT)) {
      changed = true;
      return {
        id: row.id,
        value: {
          [FC_PC_ID]: row.value[FC_PC_ID],
          [FC_PC_DONE]: { value: [DONE_OPT] },
        },
      };
    }
    return row;
  });

  for (const id594 of ids594Set) {
    if (!known.has(id594)) {
      changed = true;
      next.push({
        value: {
          [FC_PC_ID]: { value: id594 },
          [FC_PC_DONE]: { value: [DONE_OPT] },
        },
      });
    }
  }

  return { rows: next, changed };
}

function buildMergedLedger627Rows(existingRows, ids627List) {
  const seen = new Set();
  const newRows = existingRows.map((row) => {
    const id = row.value && row.value[FC_LEDGER_COL_627] ? normId(row.value[FC_LEDGER_COL_627].value) : '';
    if (id) seen.add(id);
    return row.id != null ? { id: row.id, value: row.value } : { value: row.value };
  });

  let added = false;
  for (const idStr of ids627List) {
    if (!idStr || seen.has(idStr)) continue;
    seen.add(idStr);
    added = true;
    const num = Number(idStr);
    const valueCell = Number.isFinite(num) ? num : idStr;
    newRows.push({
      value: {
        [FC_LEDGER_COL_627]: { value: valueCell },
      },
    });
  }

  return { rows: newRows, added };
}

function ledgerTopNeedsPatch(r595, primary, ids627) {
  if (!ids627.length) return false;
  const curRid = normId(r595[FC_LEDGER_RID] && r595[FC_LEDGER_RID].value);
  const curDone = (r595[FC_LEDGER_DONE] && r595[FC_LEDGER_DONE].value) || [];
  const hasDone = Array.isArray(curDone) && curDone.includes(DONE_OPT);
  const ridOk = curRid === primary;
  return !ridOk || !hasDone;
}

// --- preload 594 → mail → Set(594 $id)
/** @type {Map<string, Set<string>>} */
const mailTo594 = new Map();
{
  let offset = 0;
  const page = 500;
  for (;;) {
    const batch = await getRecords(
      APP_594,
      `order by $id asc limit ${page} offset ${offset}`,
      ['$id', FC_594_MAIL, 'status', 'abolished_flag'],
    );
    if (!batch.length) break;
    offset += batch.length;
    for (const r of batch) {
      if (shouldSkip594Row(r)) continue;
      const mail = normId(r[FC_594_MAIL] && r[FC_594_MAIL].value);
      if (!mail) continue;
      const id = normId(r.$id && r.$id.value);
      if (!id) continue;
      if (!mailTo594.has(mail)) mailTo594.set(mail, new Set());
      mailTo594.get(mail).add(id);
    }
    if (batch.length < page) break;
  }
}

// --- preload 627 → mail → id[]
/** @type {Map<string, string[]>} */
const mailTo627Ids = new Map();
{
  let offset = 0;
  const page = 500;
  for (;;) {
    const batch = await getRecords(
      APP_627,
      `order by $id asc limit ${page} offset ${offset}`,
      ['$id', FC_627_MAIL],
    );
    if (!batch.length) break;
    offset += batch.length;
    for (const r of batch) {
      const mail = normId(r[FC_627_MAIL] && r[FC_627_MAIL].value);
      if (!mail) continue;
      const id627 = normId(r.$id && r.$id.value);
      if (!id627) continue;
      if (!mailTo627Ids.has(mail)) mailTo627Ids.set(mail, []);
      mailTo627Ids.get(mail).push(id627);
    }
    if (batch.length < page) break;
  }
  for (const [m, arr] of mailTo627Ids) {
    mailTo627Ids.set(m, sortedIds([...new Set(arr)]));
  }
}

if (verbose) {
  console.error(`[595-mail] 594 mails=${mailTo594.size} 627 mails=${mailTo627Ids.size}`);
}

const fields595 = ['$id', '$revision', FC_595_MAIL, FC_PC_TABLE];
if (do627) {
  fields595.push(FC_LEDGER_RID, FC_LEDGER_DONE);
  if (hasLedgerSub) {
    fields595.push(FC_LEDGER_TABLE);
  }
}

let updated = 0;
let skipped = 0;
let processed = 0;
let off595 = 0;
const page595 = 100;

outer: for (;;) {
  const batch = await getRecords(
    APP_595,
    `order by $id asc limit ${page595} offset ${off595}`,
    fields595,
  );
  if (!batch.length) break;
  off595 += batch.length;

  for (const rec595 of batch) {
    if (recordLimit && processed >= recordLimit) break outer;
    processed++;

    const id595 = rec595.$id && rec595.$id.value != null ? String(rec595.$id.value) : '';
    const mail = normId(rec595[FC_595_MAIL] && rec595[FC_595_MAIL].value);
    if (!mail) {
      if (verbose) console.log(`[skip] 595 id=${id595} reason=no_mail`);
      skipped++;
      continue;
    }

    const ids594Set = mailTo594.get(mail) || new Set();
    const ids627 = do627 ? mailTo627Ids.get(mail) || [] : [];

    let patch = {};
    let anyPatch = false;

    if (doPc) {
      const existingPc = (rec595[FC_PC_TABLE] && rec595[FC_PC_TABLE].value) || [];
      const { rows: mergedPc, changed: pcChanged } = buildMergedPcRows(existingPc, ids594Set);
      if (pcChanged) {
        patch[FC_PC_TABLE] = { value: mergedPc };
        anyPatch = true;
      }
    }

    if (do627 && ids627.length) {
      const primary = primary627(ids627);
      const topChanged = ledgerTopNeedsPatch(rec595, primary, ids627);
      if (hasLedgerSub) {
        const existingLed = (rec595[FC_LEDGER_TABLE] && rec595[FC_LEDGER_TABLE].value) || [];
        const { rows: mergedLedRows, added: ledRowsAdded } = buildMergedLedger627Rows(existingLed, ids627);
        if (ledRowsAdded) {
          patch[FC_LEDGER_TABLE] = { value: mergedLedRows };
          anyPatch = true;
        }
      }
      if (topChanged) {
        patch[FC_LEDGER_RID] = { value: primary };
        patch[FC_LEDGER_DONE] = { value: [DONE_OPT] };
        anyPatch = true;
      }
    }

    if (!anyPatch) {
      if (verbose) console.log(`[skip] 595 id=${id595} mail=${mail} reason=already_synced`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(
        `[dry-run] 595 id=${id595} mail=${mail} patchKeys=${Object.keys(patch).join(',')} 594n=${ids594Set.size} 627n=${ids627.length}`,
      );
      updated++;
      continue;
    }

    const putUrl = new URL(`${baseUrl}/k/v1/record.json`);
    await fetchJson(putUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: APP_595,
        id: rec595.$id.value,
        revision: rec595.$revision.value,
        record: patch,
      }),
    });
    console.log(`[backfill] 595 id=${id595} mail=${mail} keys=${Object.keys(patch).join(',')}`);
    updated++;
  }
}

console.error(
  `[backfill-595-ledger-from-mail] dryRun=${dryRun} pc=${doPc} k627=${do627} ledgerSubtable=${hasLedgerSub} updatedOrWould=${updated} skipped=${skipped} scanned595=${processed}`,
);
