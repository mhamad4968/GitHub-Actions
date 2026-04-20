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
 * 既存のアカウント管理台帳（627）に、mail から導いた sb_id と 626 の sb_pw を一括反映する。
 *
 * - sb_id: mail の @ より前（594/627 カスタムと同趣旨）
 * - sb_pw: 626 のフィールド `sb_pw`（`BACKFILL_626_SB_PW_FIELDS` で複数コードを試す場合のみカンマ区切り）
 * - mail で626が取れない／sb が空のとき **627 の logon_name**（WindowsID）で 626 を再検索
 *
 * 環境変数:
 *   BACKFILL_626_SB_PW_FIELDS  例: sb_pw（省略時は sb_pw のみ。複数フィールドを試すときだけカンマ区切り）
 *
 * 使い方:
 *   npm run backfill:627:sb -- --dry-run
 *   npm run backfill:627:sb -- --verbose
 *   npm run backfill:627:sb
 *   npm run backfill:627:sb -- --force
 *
 * --force … 627 に既に値があっても、mail／626 に合わせて上書き（626 が無いときは sb_pw は更新しない）
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

const APP_626 = 626;
const APP_627 = 627;
const FC_MAIL = 'mail';
const FC_626_LOGON = 'logon_name';
const FC_627_LOGON = 'logon_name';
const FC_SB_ID = 'sb_id';
const FC_SB_PW = 'sb_pw';

const SB_PW_FIELD_CODES = (process.env.BACKFILL_626_SB_PW_FIELDS || 'sb_pw')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');
const force = process.argv.includes('--force');

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function mailLocalPart(mail) {
  const m = String(mail || '').trim();
  const at = m.indexOf('@');
  return at > 0 ? m.slice(0, at) : '';
}

function trimField(rec, code) {
  const v = rec[code] && rec[code].value != null ? String(rec[code].value) : '';
  return v.trim();
}

function sbPwFrom626RowMulti(r626) {
  if (!r626) return '';
  for (const code of SB_PW_FIELD_CODES) {
    const cell = r626[code];
    const v = cell && cell.value != null ? String(cell.value) : '';
    const t = v.trim();
    if (t) return t;
  }
  return '';
}

const mailTo626Row = new Map();
const logonTo626Row = new Map();

async function get626ByMailCached(mail) {
  if (mailTo626Row.has(mail)) {
    return mailTo626Row.get(mail);
  }
  const rows = await getRecords(APP_626, `${FC_MAIL} = "${esc(mail)}" limit 1`, []);
  const row = rows.length ? rows[0] : null;
  mailTo626Row.set(mail, row);
  return row;
}

async function get626ByLogonCached(logon) {
  const k = String(logon || '').trim();
  if (!k) return null;
  if (logonTo626Row.has(k)) {
    return logonTo626Row.get(k);
  }
  const rows = await getRecords(APP_626, `${FC_626_LOGON} = "${esc(k)}" limit 1`, []);
  const row = rows.length ? rows[0] : null;
  logonTo626Row.set(k, row);
  return row;
}

/** mail 優先。パスワードが空なら 627 の logon と一致する採番行を使う（626 に mail が無い履歴データ向け） */
async function resolve626ForBackfill(mail, logon627) {
  const rowMail = mail ? await get626ByMailCached(mail) : null;
  let pw = sbPwFrom626RowMulti(rowMail);
  if (pw) {
    return { row: rowMail, pw, src: '626:mail' };
  }
  const lg = String(logon627 || '').trim();
  if (lg) {
    const rowL = await get626ByLogonCached(lg);
    pw = sbPwFrom626RowMulti(rowL);
    if (pw) {
      return { row: rowL, pw, src: '626:logon' };
    }
    return { row: rowMail || rowL, pw: '', src: rowMail ? '626:mail(empty sb)' : rowL ? '626:logon(empty sb)' : '626:none' };
  }
  return { row: rowMail, pw: '', src: rowMail ? '626:mail(empty sb)' : '626:none' };
}

function buildPatch627Sb({ lp, curId, curPw, pw626, forceFlag }) {
  const patch = {};
  if (lp) {
    if (forceFlag) {
      if (curId !== lp) patch[FC_SB_ID] = { value: lp };
    } else if (curId === '') {
      patch[FC_SB_ID] = { value: lp };
    }
  }
  if (pw626) {
    if (forceFlag) {
      if (curPw !== pw626) patch[FC_SB_PW] = { value: pw626 };
    } else if (curPw === '') {
      patch[FC_SB_PW] = { value: pw626 };
    }
  }
  return patch;
}

let updated = 0;
let skipped = 0;
let off627 = 0;
const page627 = 500;

for (;;) {
  const batch = await getRecords(
    APP_627,
    `order by $id asc limit ${page627} offset ${off627}`,
    ['$id', '$revision', FC_MAIL, FC_627_LOGON, FC_SB_ID, FC_SB_PW],
  );
  if (!batch.length) break;
  off627 += batch.length;

  for (const r of batch) {
    const id627 = r.$id && r.$id.value != null ? String(r.$id.value) : '';
    const mail = trimField(r, FC_MAIL);
    if (!mail) {
      if (verbose) console.log(`[skip] 627 id=${id627} reason=no_mail`);
      skipped++;
      continue;
    }

    const lp = mailLocalPart(mail);
    const curId = trimField(r, FC_SB_ID);
    const curPw = trimField(r, FC_SB_PW);
    const logon627 = trimField(r, FC_627_LOGON);

    const { pw: pw626, src: pwSrc } = await resolve626ForBackfill(mail, logon627);
    if (verbose && !pw626 && curPw === '') {
      console.log(`[sb-pw] 627 id=${id627} mail=${mail} logon=${logon627 || '-'} source=${pwSrc}`);
    }

    const patch = buildPatch627Sb({ lp, curId, curPw, pw626, forceFlag: force });

    if (!Object.keys(patch).length) {
      if (verbose) console.log(`[skip] 627 id=${id627} mail=${mail} reason=nothing_to_update`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] 627 id=${id627} mail=${mail} keys=${Object.keys(patch).join(',')}`);
      updated++;
      continue;
    }

    const putUrl = new URL(`${baseUrl}/k/v1/record.json`);
    await fetchJson(putUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        app: APP_627,
        id: r.$id.value,
        revision: r.$revision.value,
        record: patch,
      }),
    });
    console.log(`[backfill] 627 id=${id627} mail=${mail} -> ${Object.keys(patch).join(',')}`);
    updated++;
  }
}

console.error(
  `[backfill-627-sb] dryRun=${dryRun} force=${force} updatedOrWould=${updated} skipped=${skipped}`,
);
