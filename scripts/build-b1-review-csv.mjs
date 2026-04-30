#!/usr/bin/env node
/**
 * B-1 移行レビュー用 CSV（594 + 627 突合）を `C:\tmp\new-pc-ledger\` に UTF-8 BOM 付きで出力。
 * 本番 import 用テンプレではなく、浜田確認用の横持ち一覧（§7.4.6 準備）。
 *
 * 594 側は「PC 台帳としての情報」一式を列に出す（利用者・所属・台帳番号・メール・シリアル・その他・
 * 記事・購入日・棚卸・設置場所・管理番号・廃止フラグなど）。674 の extra に詰め替えない、という
 * 移行設計の話と、本 CSV の列構成は別。
 * `594_model_name` は改行・全角スペースを半角1スペースに潰して1行化。
 * `594_sn` は科学的記数法を整数表示にし、先頭タブ＋引用で Excel が数値化しないようにする。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/build-b1-review-csv.mjs
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const APP_594 = 594;
const APP_627 = 627;
const OUT_DIR = '/mnt/c/tmp/new-pc-ledger';
const OUT_CSV = path.join(OUT_DIR, `b1-review-${new Date().toISOString().slice(0, 10)}.csv`);
const OUT_SUM = path.join(OUT_DIR, `b1-review-${new Date().toISOString().slice(0, 10)}-summary.txt`);

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  headers.Authorization =
    'Basic ' +
    Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64');
}

const FIELDS_594 = [
  '$id',
  'type',
  'status',
  'abolished_flag',
  'PC_name',
  'user_name',
  'dept_name',
  'group_name',
  'ledger_record_id',
  'mail',
  'manufacturer',
  'model_name',
  'product_id',
  'sn',
  'ip1',
  'ip2',
  'etc_1',
  'etc_2',
  'note',
  'dop',
  'last_inventory_date',
  'location',
  'record_id',
];

const FIELDS_627 = [
  '$id',
  'レコード番号',
  'account_type',
  'user_name',
  'dept_name',
  'group_name',
  'logon_name',
  'mail',
  'mail_acct',
  'm365_id',
  'PC_name',
  'pc_594_record_id',
  'windows_name',
];

async function fetchAll(app, fields) {
  const records = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const params = new URLSearchParams();
    params.set('app', String(app));
    params.set('query', `order by レコード番号 asc limit ${limit} offset ${offset}`);
    fields.forEach((f, i) => params.set(`fields[${i}]`, f));
    const url = `${baseUrl}/k/v1/records.json?${params.toString()}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`GET app=${app} offset=${offset} failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

function val(r, code) {
  const c = r[code];
  if (!c) return '';
  const v = c.value;
  if (Array.isArray(v)) return v.join(',');
  if (v == null) return '';
  return String(v);
}

/** 594 model_name など：改行をスペース化し、連続空白（全角含む）を1つに */
function flattenSingleLine(s) {
  return String(s ?? '')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\u3000/g, ' ')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/ +/g, ' ')
    .trim();
}

/** 科学的記数法を整数文字列へ（先頭ゼロは維持しない） */
function expandScientificToIntegerString(raw) {
  const t = String(raw ?? '').trim().replace(/\s+/g, '');
  if (t === '') return '';
  if (/^[+-]?(?:\d+\.?\d*|\d*\.\d+)[eE][+-]?\d+$/.test(t)) {
    const n = Number(t);
    if (!Number.isFinite(n)) return String(raw ?? '').trim();
    if (Math.abs(n) > Number.MAX_SAFE_INTEGER) return String(raw ?? '').trim();
    const rounded = Math.round(n);
    if (Math.abs(n - rounded) > 1e-9 * Math.max(1, Math.abs(n))) return String(raw ?? '').trim();
    return String(rounded);
  }
  if (/^\d+\.0+$/.test(t)) return t.slice(0, t.indexOf('.'));
  return String(raw ?? '').trim();
}

function csvRaw(fragment) {
  return { __csvRaw: true, fragment };
}

function csv594SnField(snRaw) {
  const body = expandScientificToIntegerString(snRaw);
  const withTab = `\t${body}`;
  return csvRaw(`"${withTab.replace(/"/g, '""')}"`);
}

function isAbolished594(r) {
  const ab = val(r, 'abolished_flag');
  return ab.includes('廃止');
}

function csvCell(s) {
  const t = String(s ?? '');
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function csvLine(cols) {
  return (
    cols
      .map((c) => (c && typeof c === 'object' && c.__csvRaw ? c.fragment : csvCell(c)))
      .join(',') + '\r\n'
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const [rec594, rec627] = await Promise.all([
    fetchAll(APP_594, FIELDS_594),
    fetchAll(APP_627, FIELDS_627),
  ]);

  const by594Id = new Map();
  for (const r of rec627) {
    const pid = val(r, 'pc_594_record_id').trim();
    if (pid) by594Id.set(pid, r);
  }

  const TYPE_PERSONAL = '個人';
  const TYPE_NAS = 'サーバーNAS';
  const TYPE_OTHER = 'その他';
  const TYPE_SHARED = '共有';
  const TYPE_JR = 'JR端末';
  const STATUS_DISPOSED = '廃棄';

  const rows = [];
  const counts = { total594: rec594.length, b1_included: 0, b1_excluded_b2: 0, b1_excluded_disposed: 0, personal: 0, nas: 0, other: 0, personal_with627: 0, personal_no627: 0 };

  for (const r of rec594) {
    const typ = val(r, 'type');
    const st = val(r, 'status');
    if (typ === TYPE_SHARED || typ === TYPE_JR) {
      counts.b1_excluded_b2++;
      continue;
    }
    if (st === STATUS_DISPOSED || isAbolished594(r)) {
      counts.b1_excluded_disposed++;
      continue;
    }
    if (typ !== TYPE_PERSONAL && typ !== TYPE_NAS && typ !== TYPE_OTHER) {
      continue;
    }

    counts.b1_included++;
    if (typ === TYPE_PERSONAL) counts.personal++;
    if (typ === TYPE_NAS) counts.nas++;
    if (typ === TYPE_OTHER) counts.other++;

    const id594 = val(r, '$id');
    const k627 = by594Id.get(id594);
    let mergeRule = 'NO627_BLOCK';
    if (typ === TYPE_PERSONAL) {
      if (k627) {
        mergeRule = 'MERGE_627';
        counts.personal_with627++;
      } else {
        mergeRule = 'PERSONAL_NO_627_ROW';
        counts.personal_no627++;
      }
    }

    rows.push({
      mergeRule,
      id594,
      typ,
      st,
      r,
      k627,
    });
  }

  const header = [
    'merge_rule',
    '594_$id',
    '594_type',
    '594_status',
    '594_abolished_flag',
    '594_PC_name',
    '594_user_name',
    '594_dept_name',
    '594_group_name',
    '594_ledger_record_id',
    '594_mail',
    '594_manufacturer',
    '594_model_name',
    '594_product_id',
    '594_sn',
    '594_ip1',
    '594_ip2',
    '594_etc_1',
    '594_etc_2',
    '594_note',
    '594_dop',
    '594_last_inventory_date',
    '594_location',
    '594_record_id',
    '627_$id',
    '627_user_name',
    '627_dept_name',
    '627_group_name',
    '627_logon_name',
    '627_mail',
    '627_mail_acct',
    '627_m365_id',
    '627_windows_name',
    '627_pc_594_record_id',
  ];

  let out = '\uFEFF';
  out += csvLine(header);
  for (const row of rows) {
    const { mergeRule, id594, typ, st, r, k627 } = row;
    out += csvLine([
      mergeRule,
      id594,
      typ,
      st,
      val(r, 'abolished_flag'),
      val(r, 'PC_name'),
      val(r, 'user_name'),
      val(r, 'dept_name'),
      val(r, 'group_name'),
      val(r, 'ledger_record_id'),
      val(r, 'mail'),
      val(r, 'manufacturer'),
      flattenSingleLine(val(r, 'model_name')),
      val(r, 'product_id'),
      csv594SnField(val(r, 'sn')),
      val(r, 'ip1'),
      val(r, 'ip2'),
      val(r, 'etc_1'),
      val(r, 'etc_2'),
      val(r, 'note'),
      val(r, 'dop'),
      val(r, 'last_inventory_date'),
      val(r, 'location'),
      val(r, 'record_id'),
      k627 ? val(k627, '$id') : '',
      k627 ? val(k627, 'user_name') : '',
      k627 ? val(k627, 'dept_name') : '',
      k627 ? val(k627, 'group_name') : '',
      k627 ? val(k627, 'logon_name') : '',
      k627 ? val(k627, 'mail') : '',
      k627 ? val(k627, 'mail_acct') : '',
      k627 ? val(k627, 'm365_id') : '',
      k627 ? val(k627, 'windows_name') : '',
      k627 ? val(k627, 'pc_594_record_id') : '',
    ]);
  }

  fs.writeFileSync(OUT_CSV, out, 'utf8');

  const sum =
    [
      `generated_at_utc=${new Date().toISOString()}`,
      `594_total=${counts.total594}`,
      `b1_rows=${counts.b1_included} (personal=${counts.personal} nas=${counts.nas} other=${counts.other})`,
      `excluded_b2_shared_jr=${counts.b1_excluded_b2}`,
      `excluded_disposed=${counts.b1_excluded_disposed}`,
      `personal_with_627=${counts.personal_with627}`,
      `personal_without_627=${counts.personal_no627}`,
      '',
      `csv_path_wsl=${OUT_CSV}`,
      `csv_path_win=C:\\\\tmp\\\\new-pc-ledger\\\\${path.basename(OUT_CSV)}`,
      '',
      '※ §4.1a: 個人×保管は 594 の status に「保管」が無い場合でも、後続の取込 CSV で pc_status=保管 を付ける運用なら別列で指示予定。',
      '※ 本ファイルはレビュー用。674 一括登録テンプレの列順とは一致しない。',
      '※ 594 側は PC 台帳情報の主要列を一通り出力（674 extra への丸め込み方針とは別）。',
    ].join('\n') + '\n';
  fs.writeFileSync(OUT_SUM, sum, 'utf8');

  console.log(`Wrote ${OUT_CSV}`);
  console.log(`Wrote ${OUT_SUM}`);
  console.log(sum);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
