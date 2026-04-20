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
 * 既存データ: 595 の mail に一致する 594 を列挙し、pc_ledger_list に不足行を追加し「作成済み」を付与する。
 * 実行は管理者の .env（API 認証）を使用。.env に書かれたテナントに対して書き込む。
 *
 *   npm run backfill:595:pc_ledger_from_594
 *   npm run backfill:595:pc_ledger_from_594 -- --dry-run
 *   npm run backfill:595:pc_ledger_from_594 -- --verbose   （スキップ理由を 1 行ずつ表示）
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

function escapeQuery(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const APP_595 = 595;
const APP_594 = 594;
const FC_595_MAIL = 'mail';
const FC_PC_TABLE = 'pc_ledger_list';
const FC_PC_ID = 'pc_594_record_id';
const FC_PC_DONE = 'pc_ledger_entry_done';
const DONE_OPT = '作成済み';
const FC_594_MAIL = 'mail';

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

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

function buildMergedRows(existingRows, ids594) {
  const rows = Array.isArray(existingRows) ? [...existingRows] : [];
  const known = new Set();
  for (const row of rows) {
    const val = row.value && row.value[FC_PC_ID] ? normId(row.value[FC_PC_ID].value) : '';
    if (val) known.add(val);
  }

  let changed = false;
  const next = rows.map((row) => {
    const cellId = row.value && row.value[FC_PC_ID] ? normId(row.value[FC_PC_ID].value) : '';
    if (!cellId || !ids594.has(cellId)) {
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

  for (const id594 of ids594) {
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

let offset = 0;
const pageSize = 100;
let updatedCount = 0;
let skippedCount = 0;

for (;;) {
  const batch = await getRecords(
    APP_595,
    `order by $id asc limit ${pageSize} offset ${offset}`,
    ['$id', '$revision', FC_595_MAIL, FC_PC_TABLE]
  );
  if (!batch.length) break;
  offset += batch.length;

  for (const rec595 of batch) {
    const mail = normId(rec595[FC_595_MAIL] && rec595[FC_595_MAIL].value);
    const id595 = rec595.$id.value;
    if (!mail) {
      if (verbose) console.log(`[skip] 595 id=${id595} reason=no_mail`);
      skippedCount++;
      continue;
    }

    const rows594 = await getRecords(APP_594, `${FC_594_MAIL} = "${escapeQuery(mail)}"`, ['$id']);
    const ids594 = new Set(rows594.map((r) => normId(r.$id && r.$id.value)).filter(Boolean));
    if (ids594.size === 0) {
      if (verbose) console.log(`[skip] 595 id=${id595} mail=${mail} reason=no_matching_594 (594側メールの表記・空白が595と一致しているか確認)`);
      skippedCount++;
      continue;
    }

    const existing = (rec595[FC_PC_TABLE] && rec595[FC_PC_TABLE].value) || [];
    const { rows: merged, changed } = buildMergedRows(existing, ids594);
    if (!changed) {
      if (verbose) console.log(`[skip] 595 id=${id595} mail=${mail} reason=already_synced`);
      skippedCount++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] 595 id=${id595} mail=${mail} would merge pc rows for 594 ids=[${[...ids594].join(', ')}]`);
      updatedCount++;
      continue;
    }

    const putUrl = new URL(`${baseUrl}/k/v1/record.json`);
    await fetchJson(putUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: APP_595,
        id: id595,
        revision: rec595.$revision.value,
        record: {
          [FC_PC_TABLE]: { value: merged },
        },
      }),
    });
    console.log(`[backfill] updated 595 id=${id595} mail=${mail}`);
    updatedCount++;
  }
}

console.log(`[backfill] done dryRun=${dryRun} updatedOrWould=${updatedCount} skippedNoop=${skippedCount}`);
