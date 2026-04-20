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
  console.error('   詳細: kintone-apps.md「保留中の整理候補（B: ワンショット）」');
  console.error('');
  process.exit(2);
}

import {
  shouldSkip627PcAutolinkFromRecord,
  loadSkipRulesFromEnv,
  FC_627_CATEGORY,
} from './lib/kintone-627-pc-autolink-skip.js';

/**
 * 594 のアカウント台帳番号（ledger_record_id）と 627 の PC台帳番号（pc_594_record_id）を一括で揃える。
 *
 * - **主経路（デフォルト）**: 595 を走査し、`ledger_record_id`（627 の $id）と `pc_ledger_list` の
 *   各行 `pc_594_record_id`（594 の $id）から、各 594 に ledger を書き、各 627 には
 *   **サブテーブル先頭行**の 594 を `pc_594_record_id` に書く（代表）。複数台一覧は 627 の
 *   `pc_ledger_links` と `npm run backfill:627:pc_ledger_links` で揃える。
 * - **--mail-fallback**: 627 の `pc_594_record_id` が空のとき、同一 mail の 594 を列挙する。
 *   **1 件**: 従来どおり 594・627 を更新。**複数件**: 全 594 に `ledger_record_id` を付与、627 の `pc_594_record_id` は **$id 昇順で最小の 594** を代表として設定、595 の `pc_ledger_list` に不足行を追加（作成済み）。
 *
 *   npm run backfill:594:627_cross_refs
 *   npm run backfill:594:627_cross_refs -- --dry-run
 *   npm run backfill:594:627_cross_refs -- --verbose
 *   npm run backfill:594:627_cross_refs -- --mail-fallback
 *   npm run backfill:594:627_cross_refs -- --no-from-595 --mail-fallback   （595 を見ず mail のみ）
 *   npm run backfill:594:627_cross_refs -- --no-mail-check   （595 と 594/627 のメール一致チェックを無効化。データ不整合時のみ）
 *
 * 627 の PC 自動結線スキップ（管理者など）: `scripts/lib/kintone-627-pc-autolink-skip.js` および .env。
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

/** @returns {Promise<Record<string, unknown>>} 単一レコード（`$revision` を含む） */
async function getRecord(app, id) {
  const url = new URL(`${baseUrl}/k/v1/record.json`);
  url.searchParams.set('app', String(app));
  url.searchParams.set('id', String(id));
  const j = await fetchJson(url, { method: 'GET', headers: headersWithoutContentType(headers) });
  return j.record;
}

async function putRecord(app, id, revision, record) {
  const putUrl = new URL(`${baseUrl}/k/v1/record.json`);
  return fetchJson(putUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app, id, revision, record }),
  });
}

function escapeQuery(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normId(v) {
  if (v == null || v === '') return '';
  return String(v).trim();
}

/** レコード ID 比較（NUMBER フィールドが数値 JSON になる場合も揃える） */
function sameRecordId(a, b) {
  const x = normId(a);
  const y = normId(b);
  if (x === y) return true;
  const nx = Number(x);
  const ny = Number(y);
  if (Number.isFinite(nx) && Number.isFinite(ny) && nx === ny) return true;
  return false;
}

/** メールは大小文字のみ無視して比較（表示ゆれ対策） */
function mailMismatchStrict(a, b) {
  const x = String(a || '').trim().toLowerCase();
  const y = String(b || '').trim().toLowerCase();
  return !!(x && y && x !== y);
}

const APP_594 = 594;
const APP_595 = 595;
const APP_627 = 627;

const FC_595_MAIL = 'mail';
const FC_595_LEDGER = 'ledger_record_id';
const FC_595_PC_TABLE = 'pc_ledger_list';
const FC_595_PC594 = 'pc_594_record_id';
const FC_595_PC_DONE = 'pc_ledger_entry_done';
const VAL_PC_LEDGER_DONE = '作成済み';

const FC_594_MAIL = 'mail';
const FC_594_LEDGER = 'ledger_record_id';

const FC_627_MAIL = 'mail';
const FC_627_PC594 = 'pc_594_record_id';

const skip627PcRules = loadSkipRulesFromEnv();
/** @type {Map<string, boolean>} */
const skip627PcCache = new Map();

async function is627SkipPcAutolinkCached(id627) {
  const k = normId(id627);
  if (!k) return false;
  if (skip627PcCache.has(k)) return skip627PcCache.get(k);
  let rec;
  try {
    rec = await getRecord(APP_627, k);
  } catch {
    skip627PcCache.set(k, false);
    return false;
  }
  const sk = shouldSkip627PcAutolinkFromRecord(rec, skip627PcRules).skip;
  skip627PcCache.set(k, sk);
  return sk;
}

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');
const mailFallback = process.argv.includes('--mail-fallback');
const from595 = !process.argv.includes('--no-from-595');
const noMailCheck = process.argv.includes('--no-mail-check');

/**
 * `backfill-595-pc-ledger-from-594.js` と同趣旨。Set は 594 の $id（文字列）。
 * @param {unknown[]} existingRows
 * @param {Set<string>} ids594
 */
function buildMergedPcLedgerRows(existingRows, ids594) {
  const rows = Array.isArray(existingRows) ? [...existingRows] : [];
  const known = new Set();
  for (const row of rows) {
    const val =
      row.value && row.value[FC_595_PC594] ? normId(row.value[FC_595_PC594].value) : '';
    if (val) known.add(val);
  }
  let changed = false;
  const next = rows.map((row) => {
    const cellId =
      row.value && row.value[FC_595_PC594] ? normId(row.value[FC_595_PC594].value) : '';
    if (!cellId || !ids594.has(cellId)) return row;
    const done = (row.value[FC_595_PC_DONE] && row.value[FC_595_PC_DONE].value) || [];
    if (!Array.isArray(done) || !done.includes(VAL_PC_LEDGER_DONE)) {
      changed = true;
      return {
        id: row.id,
        value: {
          [FC_595_PC594]: row.value[FC_595_PC594],
          [FC_595_PC_DONE]: { value: [VAL_PC_LEDGER_DONE] },
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
          [FC_595_PC594]: { value: id594 },
          [FC_595_PC_DONE]: { value: [VAL_PC_LEDGER_DONE] },
        },
      });
    }
  }
  return { rows: next, changed };
}

/**
 * 627 に対応する 595 を 1 件返す（ledger_record_id 優先、なければ mail）。
 * @param {string} id627
 * @param {string} mail
 */
async function find595RowFor627(id627, mail) {
  const fields = ['$id', '$revision', FC_595_PC_TABLE, FC_595_MAIL];
  const n = Number(id627);
  if (Number.isFinite(n)) {
    const rows = await getRecords(APP_595, `ledger_record_id = ${n}`, fields);
    if (rows.length) {
      if (rows.length > 1 && verbose) {
        console.warn(
          `[warn-fallback] 595 が複数 hit ledger_record_id=${n} count=${rows.length}（先頭を使用）`,
        );
      }
      return rows[0];
    }
  }
  if (mail) {
    const rows = await getRecords(APP_595, `${FC_595_MAIL} = "${escapeQuery(mail)}"`, fields);
    if (rows.length) {
      if (rows.length > 1 && verbose) {
        console.warn(`[warn-fallback] 595 が複数 hit mail=${mail} count=${rows.length}（先頭を使用）`);
      }
      return rows[0];
    }
  }
  return null;
}

/**
 * 595 の pc_ledger_list から、行順で pc_594_record_id の一覧を返す。
 * @param {Record<string, unknown>} rec595
 * @returns {string[]}
 */
function pc594IdsInOrderFrom595(rec595) {
  const tbl = (rec595[FC_595_PC_TABLE] && rec595[FC_595_PC_TABLE].value) || [];
  const out = [];
  for (const row of tbl) {
    const raw = row.value && row.value[FC_595_PC594] ? row.value[FC_595_PC594].value : null;
    const id = normId(raw);
    if (id) out.push(id);
  }
  return out;
}

/**
 * @returns {Promise<{ map594: Map<string, { id627: string, mail595: string }>, map627Primary: Map<string, { id594: string, mail595: string }>, conflicts594: string[] }>}
 */
async function buildPlanFrom595() {
  /** @type {Map<string, { id627: string, mail595: string }>} */
  const map594 = new Map();
  /** @type {Map<string, { id594: string, mail595: string }>} */
  const map627Primary = new Map();
  /** @type {Set<string>} */
  const conflicts594 = new Set();

  let offset = 0;
  const page = 100;
  for (;;) {
    const batch = await getRecords(
      APP_595,
      `order by $id asc limit ${page} offset ${offset}`,
      ['$id', FC_595_MAIL, FC_595_LEDGER, FC_595_PC_TABLE],
    );
    if (!batch.length) break;
    offset += batch.length;

    for (const r of batch) {
      const mail595 =
        r[FC_595_MAIL] && r[FC_595_MAIL].value != null ? String(r[FC_595_MAIL].value).trim() : '';
      const id627Raw = r[FC_595_LEDGER] && r[FC_595_LEDGER].value != null ? r[FC_595_LEDGER].value : '';
      const id627 = normId(id627Raw);
      const ids594 = pc594IdsInOrderFrom595(r);

      if (!id627 || ids594.length === 0) {
        if (verbose && mail595 && id627 && ids594.length === 0) {
          console.log(`[skip-plan] 595 mail=${mail595} ledger=${id627} reason=no_pc_ledger_list_rows`);
        }
        continue;
      }

      const primary594 = ids594[0];

      const prev627 = map627Primary.get(id627);
      if (prev627 && prev627.id594 !== primary594) {
        if (verbose) {
          console.warn(
            `[warn-plan] 627 id=${id627} primary 594 が複数の 595 由来で不一致: ${prev627.id594} vs ${primary594}（先を維持）`,
          );
        }
      } else if (!prev627) {
        map627Primary.set(id627, { id594: primary594, mail595 });
      }

      for (const id594 of ids594) {
        const prev = map594.get(id594);
        if (prev && prev.id627 !== id627) {
          conflicts594.add(id594);
          if (verbose) {
            console.warn(
              `[warn-plan] 594 id=${id594} に対し 627 が複数: ${prev.id627} vs ${id627}（この 594 はスキップ）`,
            );
          }
        } else if (!prev || prev.id627 === id627) {
          map594.set(id594, { id627, mail595 });
        }
      }
    }
  }

  for (const id of conflicts594) {
    map594.delete(id);
  }

  return { map594, map627Primary, conflicts594: [...conflicts594] };
}

/** @param {Map<string, { id627: string, mail595: string }>} map594 */
async function apply594Map(map594) {
  let ok = 0;
  let skip = 0;
  const r = { getFail: 0, mailMismatch: 0, alreadyOk: 0, putFail: 0, getFail594Ids: [], skipPcAutolink: 0 };
  for (const [id594, { id627, mail595 }] of map594) {
    if (await is627SkipPcAutolinkCached(id627)) {
      if (verbose) console.warn(`[skip-594] id=${id594} 627=${id627} reason=pc_autolink_skip`);
      r.skipPcAutolink++;
      skip++;
      continue;
    }
    let rec;
    try {
      rec = await getRecord(APP_594, id594);
    } catch (e) {
      console.warn(`[594] GET 失敗 id=${id594}`, e.message || e);
      r.getFail++;
      if (r.getFail594Ids.length < 30) r.getFail594Ids.push(String(id594));
      skip++;
      continue;
    }
    const mail594 =
      rec[FC_594_MAIL] && rec[FC_594_MAIL].value != null ? String(rec[FC_594_MAIL].value).trim() : '';
    if (!noMailCheck && mailMismatchStrict(mail594, mail595)) {
      if (verbose) {
        console.warn(`[skip-594] id=${id594} reason=mail_mismatch 594=${mail594} 595=${mail595}`);
      }
      r.mailMismatch++;
      skip++;
      continue;
    }

    const cur = normId(rec[FC_594_LEDGER] && rec[FC_594_LEDGER].value);
    if (sameRecordId(cur, id627)) {
      if (verbose) console.log(`[skip-594] id=${id594} already ledger=${id627}`);
      r.alreadyOk++;
      skip++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] 594 id=${id594} ledger_record_id ${cur || '(空)'} -> ${id627}`);
      ok++;
      continue;
    }

    try {
      await putRecord(APP_594, id594, rec.$revision.value, { [FC_594_LEDGER]: { value: id627 } });
      console.log(`[backfill] 594 id=${id594} ledger_record_id=${id627}`);
      ok++;
    } catch (e) {
      console.warn(`[594] PUT 失敗 id=${id594}`, e.message || e);
      r.putFail++;
      skip++;
    }
  }
  return { ok, skip, reasons: r };
}

/** @param {Map<string, { id594: string, mail595: string }>} map627 */
async function apply627Map(map627) {
  let ok = 0;
  let skip = 0;
  const r = { getFail: 0, mailMismatch: 0, alreadyOk: 0, putFail: 0, skipPcAutolink: 0 };
  for (const [id627, { id594, mail595 }] of map627) {
    let rec;
    try {
      rec = await getRecord(APP_627, id627);
    } catch (e) {
      console.warn(`[627] GET 失敗 id=${id627}`, e.message || e);
      r.getFail++;
      skip++;
      continue;
    }
    const sk627 = shouldSkip627PcAutolinkFromRecord(rec, skip627PcRules);
    skip627PcCache.set(id627, sk627.skip);
    if (sk627.skip) {
      if (verbose) console.warn(`[skip-627] id=${id627} reason=pc_autolink_skip(${sk627.reason})`);
      r.skipPcAutolink++;
      skip++;
      continue;
    }
    const mail627 =
      rec[FC_627_MAIL] && rec[FC_627_MAIL].value != null ? String(rec[FC_627_MAIL].value).trim() : '';
    if (!noMailCheck && mailMismatchStrict(mail627, mail595)) {
      if (verbose) {
        console.warn(`[skip-627] id=${id627} reason=mail_mismatch 627=${mail627} 595=${mail595}`);
      }
      r.mailMismatch++;
      skip++;
      continue;
    }

    const cur = normId(rec[FC_627_PC594] && rec[FC_627_PC594].value);
    if (sameRecordId(cur, id594)) {
      if (verbose) console.log(`[skip-627] id=${id627} already pc_594=${id594}`);
      r.alreadyOk++;
      skip++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] 627 id=${id627} pc_594_record_id ${cur || '(空)'} -> ${id594}`);
      ok++;
      continue;
    }

    try {
      await putRecord(APP_627, id627, rec.$revision.value, { [FC_627_PC594]: { value: id594 } });
      console.log(`[backfill] 627 id=${id627} pc_594_record_id=${id594}`);
      ok++;
    } catch (e) {
      console.warn(`[627] PUT 失敗 id=${id627}`, e.message || e);
      r.putFail++;
      skip++;
    }
  }
  return { ok, skip, reasons: r };
}

async function mailFallbackPass() {
  let off = 0;
  const page = 100;
  let ok594 = 0;
  let ok627 = 0;
  let skip = 0;
  const rs = {
    no594ForMail: 0,
    multi594Batches: 0,
    ledgerConflict: 0,
    put594Fail: 0,
    put627Fail: 0,
    put595Fail: 0,
    ok595merge: 0,
    skipPcAutolink: 0,
  };

  for (;;) {
    const batch = await getRecords(
      APP_627,
      `order by $id asc limit ${page} offset ${off}`,
      ['$id', '$revision', FC_627_MAIL, FC_627_PC594, FC_627_CATEGORY],
    );
    if (!batch.length) break;
    off += batch.length;

    for (const r627 of batch) {
      const id627 = r627.$id && r627.$id.value != null ? String(r627.$id.value) : '';
      const mail =
        r627[FC_627_MAIL] && r627[FC_627_MAIL].value != null
          ? String(r627[FC_627_MAIL].value).trim()
          : '';
      const curPc = normId(r627[FC_627_PC594] && r627[FC_627_PC594].value);

      if (shouldSkip627PcAutolinkFromRecord(r627, skip627PcRules).skip) {
        if (verbose) console.log(`[skip-fallback] 627 id=${id627} reason=pc_autolink_skip`);
        rs.skipPcAutolink++;
        skip++;
        continue;
      }

      if (!id627 || !mail || curPc) {
        if (verbose && id627 && mail && curPc) {
          console.log(`[skip-fallback] 627 id=${id627} reason=pc_already_set`);
        }
        continue;
      }

      const hits = await getRecords(APP_594, `${FC_594_MAIL} = "${escapeQuery(mail)}"`, [
        '$id',
        '$revision',
        FC_594_MAIL,
        FC_594_LEDGER,
      ]);

      if (hits.length === 0) {
        if (verbose) console.log(`[skip-fallback] 627 id=${id627} mail=${mail} reason=no_594_for_mail`);
        rs.no594ForMail++;
        skip++;
        continue;
      }

      let conflict = false;
      for (const h of hits) {
        const idH = normId(h.$id?.value);
        const led = normId(h[FC_594_LEDGER]?.value);
        if (led && !sameRecordId(led, id627)) {
          if (verbose) {
            console.warn(
              `[skip-fallback] 594 id=${idH} ledger=${led} differs from 627 id=${id627}`,
            );
          }
          conflict = true;
          break;
        }
      }
      if (conflict) {
        rs.ledgerConflict++;
        skip++;
        continue;
      }

      hits.sort((a, b) => Number(a.$id?.value) - Number(b.$id?.value));
      const primary594 = normId(hits[0].$id?.value);
      const idsSet = new Set(hits.map((h) => normId(h.$id?.value)).filter(Boolean));

      if (!primary594) {
        rs.no594ForMail++;
        skip++;
        continue;
      }

      if (hits.length > 1) rs.multi594Batches++;

      if (dryRun) {
        console.log(
          `[dry-run-fallback] mail=${mail} 627=${id627} n594=${hits.length} primary=${primary594} ids=[${[...idsSet].join(',')}]`,
        );
        ok594 += hits.length;
        ok627++;
        continue;
      }

      let batch594Ok = 0;
      for (const h of hits) {
        const id594 = normId(h.$id?.value);
        if (!id594) continue;
        try {
          const rec594 = await getRecord(APP_594, id594);
          const curL = normId(rec594[FC_594_LEDGER]?.value);
          if (!sameRecordId(curL, id627)) {
            await putRecord(APP_594, id594, rec594.$revision.value, {
              [FC_594_LEDGER]: { value: id627 },
            });
            console.log(`[backfill-fallback] 594 id=${id594} ledger_record_id=${id627}`);
          }
          batch594Ok++;
          ok594++;
        } catch (e) {
          console.warn(`[fallback] 594 GET/PUT 失敗 id=${id594}`, e.message || e);
          rs.put594Fail++;
        }
      }

      if (batch594Ok === 0) {
        skip++;
        continue;
      }

      try {
        const rec627 = await getRecord(APP_627, id627);
        const curPcVal = normId(rec627[FC_627_PC594]?.value);
        if (!sameRecordId(curPcVal, primary594)) {
          await putRecord(APP_627, id627, rec627.$revision.value, {
            [FC_627_PC594]: { value: primary594 },
          });
          console.log(`[backfill-fallback] 627 id=${id627} pc_594_record_id=${primary594}`);
        }
        ok627++;
      } catch (e) {
        console.warn(`[fallback] 627 PUT 失敗 id=${id627}`, e.message || e);
        rs.put627Fail++;
        skip++;
        continue;
      }

      const r595stub = await find595RowFor627(id627, mail);
      if (r595stub) {
        const id595 = normId(r595stub.$id?.value);
        try {
          const r595 = await getRecord(APP_595, id595);
          const existing = (r595[FC_595_PC_TABLE] && r595[FC_595_PC_TABLE].value) || [];
          const { rows: merged, changed } = buildMergedPcLedgerRows(existing, idsSet);
          if (changed) {
            await putRecord(APP_595, id595, r595.$revision.value, {
              [FC_595_PC_TABLE]: { value: merged },
            });
            console.log(
              `[backfill-fallback] 595 id=${id595} pc_ledger_list merged 594=[${[...idsSet].join(',')}]`,
            );
            rs.ok595merge++;
          }
        } catch (e) {
          console.warn(`[fallback] 595 PUT 失敗 id=${id595}`, e.message || e);
          rs.put595Fail++;
        }
      } else if (verbose) {
        console.warn(
          `[warn-fallback] 595 未検出 627 id=${id627} mail=${mail}（594・627 のみ更新）`,
        );
      }
    }
  }

  return { ok594, ok627, skip, reasons: rs };
}

// --- main ---
if (!from595 && !mailFallback) {
  console.error('Specify --from-595 (default) and/or --mail-fallback.');
  throw new Error('Nothing to do');
}

let map594 = new Map();
let map627Primary = new Map();

if (from595) {
  const plan = await buildPlanFrom595();
  map594 = plan.map594;
  map627Primary = plan.map627Primary;
  if (verbose) {
    console.error(
      `[plan] from595: 594=${map594.size} 627(primaries)=${map627Primary.size} conflicts594=${plan.conflicts594.length}`,
    );
  }
}

const r594 = await apply594Map(map594);
const r627 = await apply627Map(map627Primary);

let fb = {
  ok594: 0,
  ok627: 0,
  skip: 0,
  reasons: {
    no594ForMail: 0,
    multi594Batches: 0,
    ledgerConflict: 0,
    put594Fail: 0,
    put627Fail: 0,
    put595Fail: 0,
    ok595merge: 0,
    skipPcAutolink: 0,
  },
};
if (mailFallback) {
  fb = await mailFallbackPass();
}

const s594 = r594.reasons || {};
const s627 = r627.reasons || {};
const sf = fb.reasons || {};
const fail594ids = Array.isArray(s594.getFail594Ids) ? s594.getFail594Ids.join(',') : '';
console.error(
  `[backfill-594-627-cross-refs] dryRun=${dryRun} from595=${from595} mailFallback=${mailFallback} noMailCheck=${noMailCheck} ` +
    `plan594=${map594.size} plan627=${map627Primary.size} 594 puts ok=${r594.ok} skip=${r594.skip} ` +
    `[already=${s594.alreadyOk ?? 0} mailMismatch=${s594.mailMismatch ?? 0} skipPc=${s594.skipPcAutolink ?? 0} getFail=${s594.getFail ?? 0} putFail=${s594.putFail ?? 0}]` +
    (fail594ids ? ` getFail594Ids=[${fail594ids}]` : '') +
    ` 627 puts ok=${r627.ok} skip=${r627.skip} ` +
    `[already=${s627.alreadyOk ?? 0} mailMismatch=${s627.mailMismatch ?? 0} skipPc=${s627.skipPcAutolink ?? 0} getFail=${s627.getFail ?? 0} putFail=${s627.putFail ?? 0}] ` +
    `fallback ok594=${fb.ok594} ok627=${fb.ok627} skip=${fb.skip} ` +
    `[no594=${sf.no594ForMail ?? 0} multi594=${sf.multi594Batches ?? 0} merge595=${sf.ok595merge ?? 0} ledConflict=${sf.ledgerConflict ?? 0} skipPc=${sf.skipPcAutolink ?? 0} put594=${sf.put594Fail ?? 0} put627=${sf.put627Fail ?? 0} put595=${sf.put595Fail ?? 0}]`,
);
