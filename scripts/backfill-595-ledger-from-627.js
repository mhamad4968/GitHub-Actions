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
 * 既存の社員マスタ（595）を、627（同一 mail）と突合して整える。
 *
 * - ledger_record_id を 627 の $id に、ledger_created に「作成済み」
 * - employment_status: 退職日あり→退職。それ以外で空なら 627 の在籍をコピー、627 も無ければ在籍。
 *
 *   npm run backfill:595:ledger_from_627
 *   npm run backfill:595:ledger_from_627 -- --dry-run
 *   npm run backfill:595:ledger_from_627 -- --verbose
 *   npm run backfill:595:ledger_from_627 -- --force-employment
 *
 * --force-employment … 595 の在籍が既に入っていても、退職日・627 に基づき上書き（休職等がある場合は非推奨）。
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

const APP_595 = 595;
const APP_627 = 627;
const FC_MAIL = 'mail';
const FC_LEDGER_RID = 'ledger_record_id';
const FC_LEDGER_DONE = 'ledger_created';
const FC_EMPLOYMENT = 'employment_status';
const FC_RETIRED = 'retired_date';
const DONE_OPT = '作成済み';
const EMP_RETIRED = '退職';
const EMP_ACTIVE = '在籍';

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');
const forceEmployment = process.argv.includes('--force-employment');

/** @type {Map<string, { id627: string, emp627: string }>} mail(trim) -> */
const mailTo627 = new Map();
let off627 = 0;
const page627 = 500;
for (;;) {
  const batch = await getRecords(
    APP_627,
    `order by $id asc limit ${page627} offset ${off627}`,
    ['$id', FC_MAIL, FC_EMPLOYMENT],
  );
  if (!batch.length) break;
  off627 += batch.length;
  for (const r of batch) {
    const m = r[FC_MAIL] && r[FC_MAIL].value != null ? String(r[FC_MAIL].value).trim() : '';
    if (!m) continue;
    const id627 = r.$id && r.$id.value != null ? String(r.$id.value) : '';
    if (!id627) continue;
    const emp627 =
      r[FC_EMPLOYMENT] && r[FC_EMPLOYMENT].value != null ? String(r[FC_EMPLOYMENT].value).trim() : '';
    if (mailTo627.has(m)) {
      const prev = mailTo627.get(m);
      if (prev.id627 !== id627 && verbose) {
        console.warn(
          `[warn] 627 の mail が重複: ${m} -> 既存 id=${prev.id627} 新 id=${id627}（先を採用のまま）`,
        );
      }
      continue;
    }
    mailTo627.set(m, { id627, emp627 });
  }
}

/**
 * 退職日があれば退職。なければ 627 の在籍を採用し、無ければ在籍。
 * @param {{ emp595: string, retiredRaw: string, row627: { id627: string, emp627: string } | null, force: boolean }} p
 */
function desiredEmployment595(p) {
  const retired = p.retiredRaw && String(p.retiredRaw).trim() !== '';
  if (retired) {
    return EMP_RETIRED;
  }
  const cur = String(p.emp595 || '').trim();
  if (!p.force && cur !== '') {
    return null;
  }
  if (p.row627 && p.row627.emp627) {
    return p.row627.emp627;
  }
  return EMP_ACTIVE;
}

function ledgerNeedsPatch(r595, id627) {
  const curRid =
    r595[FC_LEDGER_RID] && r595[FC_LEDGER_RID].value != null && String(r595[FC_LEDGER_RID].value).trim() !== ''
      ? String(r595[FC_LEDGER_RID].value).trim()
      : '';
  const curDone = (r595[FC_LEDGER_DONE] && r595[FC_LEDGER_DONE].value) || [];
  const hasDone = Array.isArray(curDone) && curDone.includes(DONE_OPT);
  const ridOk = curRid === id627;
  return !ridOk || !hasDone;
}

let updated = 0;
let skipped = 0;
let off595 = 0;
const page595 = 100;

for (;;) {
  const batch = await getRecords(
    APP_595,
    `order by $id asc limit ${page595} offset ${off595}`,
    ['$id', '$revision', FC_MAIL, FC_LEDGER_RID, FC_LEDGER_DONE, FC_EMPLOYMENT, FC_RETIRED],
  );
  if (!batch.length) break;
  off595 += batch.length;

  for (const r of batch) {
    const id595 = r.$id && r.$id.value != null ? String(r.$id.value) : '';
    const mail = r[FC_MAIL] && r[FC_MAIL].value != null ? String(r[FC_MAIL].value).trim() : '';
    if (!mail) {
      if (verbose) console.log(`[skip] 595 id=${id595} reason=no_mail`);
      skipped++;
      continue;
    }

    const row627 = mailTo627.get(mail) || null;
    const id627 = row627 ? row627.id627 : '';

    const retiredRaw =
      r[FC_RETIRED] && r[FC_RETIRED].value != null ? String(r[FC_RETIRED].value).trim() : '';
    const emp595 = r[FC_EMPLOYMENT] && r[FC_EMPLOYMENT].value != null ? String(r[FC_EMPLOYMENT].value).trim() : '';

    const wantEmp = desiredEmployment595({
      emp595,
      retiredRaw,
      row627,
      force: forceEmployment,
    });
    const empPatchNeeded = wantEmp != null && wantEmp !== emp595;

    let ledPatchNeeded = false;
    if (id627) {
      ledPatchNeeded = ledgerNeedsPatch(r, id627);
    }

    if (!empPatchNeeded && !ledPatchNeeded) {
      if (verbose) console.log(`[skip] 595 id=${id595} mail=${mail} reason=already_ok`);
      skipped++;
      continue;
    }

    const record = {};
    if (ledPatchNeeded && id627) {
      record[FC_LEDGER_RID] = { value: id627 };
      record[FC_LEDGER_DONE] = { value: [DONE_OPT] };
    }
    if (empPatchNeeded && wantEmp != null) {
      record[FC_EMPLOYMENT] = { value: wantEmp };
    }

    if (dryRun) {
      const parts = [];
      if (ledPatchNeeded && id627) {
        parts.push(`ledger_record_id=${id627} ledger_created=[${DONE_OPT}]`);
      } else if (ledPatchNeeded && !id627) {
        parts.push('ledger=skip(no_627)');
      }
      if (empPatchNeeded) {
        parts.push(`employment_status="${wantEmp}" (was "${emp595}")`);
      }
      console.log(`[dry-run] 595 id=${id595} mail=${mail} -> ${parts.join(' | ')}`);
      updated++;
      continue;
    }

    const putUrl = new URL(`${baseUrl}/k/v1/record.json`);
    await fetchJson(putUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: APP_595,
        id: r.$id.value,
        revision: r.$revision.value,
        record,
      }),
    });
    console.log(`[backfill] 595 id=${id595} mail=${mail} -> ${JSON.stringify(record)}`);
    updated++;
  }
}

console.error(
  `[backfill-595-ledger-from-627] dryRun=${dryRun} forceEmployment=${forceEmployment} updatedOrWould=${updated} skipped=${skipped} 627-mails=${mailTo627.size}`,
);
