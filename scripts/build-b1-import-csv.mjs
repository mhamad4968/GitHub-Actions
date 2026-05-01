#!/usr/bin/env node
/**
 * B-1: 674 公式「レコードの一括登録（CSV）」向けドラフトを生成。
 * - 列順: GET /k/v1/app/form/layout.json?app=674 の並び（GROUP は `group.field`）。
 * - マッピング: docs/plans/2026-04-30-b1-field-mapping-to-674.md（§7.4.7 整合）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/build-b1-import-csv.mjs
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const APP_594 = 594;
const APP_627 = 627;
const APP_674 = 674;
const OUT_DIR = '/mnt/c/tmp/new-pc-ledger';
const DAY = new Date().toISOString().slice(0, 10);
const OUT_CSV = path.join(OUT_DIR, `b1-import-674-draft-${DAY}.csv`);
const OUT_DRY = path.join(OUT_DIR, `b1-import-674-${DAY}-dryrun.txt`);
const OUT_EXC = path.join(OUT_DIR, `b1-import-674-${DAY}-exceptions.csv`);
const IMPORT_SOURCE = 'B1_IMPORT_SCRIPT_v0';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const apiHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  apiHeaders.Authorization =
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
  'logon_pw',
  'mail',
  'mail_acct',
  'mail_pw',
  'm365_id',
  'm365_pw',
  'gb_id',
  'gb_pw',
  'sb_id',
  'sb_pw',
  'vpn_id',
  'vpn_pw',
  'pc_594_record_id',
  'windows_name',
];

async function fetchJson(url) {
  const res = await fetch(url, { method: 'GET', headers: apiHeaders });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${await res.text()}`);
  return res.json();
}

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
    const data = await fetchJson(url);
    const batch = data.records || [];
    records.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return records;
}

/** layout.json の ROW / GROUP を辿り、一括登録 CSV 用のフィールドコード列（ドット記法）を取得 */
function collectLayoutFieldCodes(layout) {
  const out = [];
  function walk(arr, prefix = '') {
    for (const el of arr || []) {
      if (el.type === 'ROW') walk(el.fields, prefix);
      else if (el.type === 'GROUP') {
        for (const row of el.layout || []) {
          if (row.type === 'ROW') walk(row.fields, prefix + el.code + '.');
        }
      } else if (el.type === 'SUBTABLE') {
        /* B-1 では 674 のサブテーブルなし想定。あれば手順書で別途。 */
      } else if (el.code) {
        out.push(prefix + el.code);
      }
    }
  }
  walk(layout);
  return out;
}

function val(r, code) {
  const c = r[code];
  if (!c) return '';
  const v = c.value;
  if (Array.isArray(v)) return v.join(',');
  if (v == null) return '';
  return String(v);
}

function flattenSingleLine(s) {
  return String(s ?? '')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\u3000/g, ' ')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/ +/g, ' ')
    .trim();
}

/** 594 `mail` / 627 `mail` の @ より前（アカウント系のフォールバック用） */
function mailLocalPartFromMail(mail) {
  const t = String(mail ?? '').trim();
  const i = t.indexOf('@');
  if (i <= 0) return '';
  return t.slice(0, i);
}

/** 627 に `m365_id` が無いときの補完（環境変数 `M365_DOMAIN` で上書き可・先頭 @ 任意） */
function deriveM365IdFromMailAcct(mailAcct) {
  const acct = String(mailAcct ?? '').trim();
  if (!acct) return '';
  const rawDom = (process.env.M365_DOMAIN || 'kensetsutoso01.onmicrosoft.com').trim();
  const dom = rawDom.replace(/^@/, '');
  return `${acct}@${dom}`;
}

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

function isAbolished594(r) {
  return val(r, 'abolished_flag').includes('廃止');
}

function map594StatusToPcStatus(st594, warnings, legacy594Id) {
  const s = String(st594 || '').trim();
  if (s === '使用中') return '利用中';
  if (s === '保管') return '保管';
  if (s === '廃棄') return '廃棄';
  if (s) {
    warnings.push(`legacy594_id=${legacy594Id} 594_status="${s}" → pc_status を 利用中 にフォールバック（要確認）`);
  }
  return '利用中';
}

function csvCell(s) {
  const t = String(s ?? '');
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function csvLine(cols) {
  return cols.map(csvCell).join(',') + '\r\n';
}

function buildExtraInfo1(r594) {
  const parts = [];
  const loc = val(r594, 'location').trim();
  if (loc) parts.push(`[594:location] ${loc}`);
  const e1 = val(r594, 'etc_1').trim();
  if (e1) parts.push(`[594:etc_1] ${e1}`);
  const e2 = val(r594, 'etc_2').trim();
  if (e2) parts.push(`[594:etc_2] ${e2}`);
  return parts.join('\n');
}

/** 627 を 594 `$id`（pc_594_record_id）または 594 `ledger_record_id`（627 の $id / レコード番号）で解決 */
function build627JoinMaps(rec627, warnings) {
  const by594Id = new Map();
  const by627Id = new Map();
  const dupPc594 = new Set();
  for (const r of rec627) {
    const pid = val(r, 'pc_594_record_id').trim();
    if (pid) {
      if (!by594Id.has(pid)) by594Id.set(pid, r);
      else if (!dupPc594.has(pid)) {
        dupPc594.add(pid);
        warnings.push(`627 duplicate pc_594_record_id=${pid} (first row kept)`);
      }
    }
    const kid = val(r, '$id').trim();
    if (kid && !by627Id.has(kid)) by627Id.set(kid, r);
    const rn = val(r, 'レコード番号').trim();
    if (rn && !by627Id.has(rn)) by627Id.set(rn, r);
  }
  return { by594Id, by627Id };
}

function resolveK627(id594, r594, by594Id, by627Id) {
  const byPc = by594Id.get(id594);
  if (byPc) return byPc;
  const lid = val(r594, 'ledger_record_id').trim();
  if (!lid) return undefined;
  return by627Id.get(lid) || undefined;
}

function buildNote594627(r594, k627, use627) {
  let n = val(r594, 'note').trim();
  if (use627 && k627) {
    const u594 = val(r594, 'user_name').trim();
    const u627 = val(k627, 'user_name').trim();
    if (u594 && u627 && u594 !== u627) {
      const line = `[594:user_name] ${u594}`;
      n = n ? `${n}\n${line}` : line;
    }
  }
  return n;
}

function buildFlat674Row({
  r594,
  k627,
  typ,
  st594,
  use627,
  isStoragePersonal,
  warnings,
}) {
  const id594 = val(r594, '$id').trim();
  const pcName = val(r594, 'PC_name').trim();
  const pcStatus = map594StatusToPcStatus(st594, warnings, id594);

  const flat = {};

  flat.pc_name = pcName;
  flat.serial = expandScientificToIntegerString(val(r594, 'sn'));
  flat.account_type = typ;
  flat.pc_status = pcStatus;

  if (use627 && k627) {
    flat.user_name = val(k627, 'user_name').trim() || val(r594, 'user_name').trim();
    flat.dept_name = val(k627, 'dept_name').trim() || val(r594, 'dept_name').trim();
    flat.group_name = val(k627, 'group_name').trim() || val(r594, 'group_name').trim();
    flat.logon_name = val(k627, 'logon_name').trim();
    flat.windows_name = val(k627, 'windows_name').trim();
    flat.mail = val(k627, 'mail').trim() || val(r594, 'mail').trim();
    flat.mail_acct = val(k627, 'mail_acct').trim();
    flat.m365_id = val(k627, 'm365_id').trim();
    const mail594 = val(r594, 'mail').trim();
    const kMail = val(k627, 'mail').trim();
    if (!flat.mail_acct) {
      flat.mail_acct =
        mailLocalPartFromMail(flat.mail) || mailLocalPartFromMail(kMail) || mailLocalPartFromMail(mail594);
    }
    if (!flat.m365_id && flat.mail_acct) {
      flat.m365_id = deriveM365IdFromMailAcct(flat.mail_acct);
    }
    if (!flat.mail && mail594) {
      flat.mail = mail594;
    }
  } else if (isStoragePersonal) {
    flat.user_name = val(r594, 'user_name').trim();
    flat.dept_name = val(r594, 'dept_name').trim();
    flat.group_name = val(r594, 'group_name').trim();
    flat.mail = val(r594, 'mail').trim();
  } else {
    flat.user_name = val(r594, 'user_name').trim();
    flat.dept_name = val(r594, 'dept_name').trim();
    flat.group_name = val(r594, 'group_name').trim();
    flat.mail = val(r594, 'mail').trim();
  }

  /* 個人・利用中だが 627 未突合: 594 のメールから mail_acct / m365_id のみ補完 */
  if (typ === '個人' && !isStoragePersonal && !k627) {
    const mail594 = val(r594, 'mail').trim();
    if (!String(flat.mail_acct || '').trim() && mail594) {
      flat.mail_acct = mailLocalPartFromMail(mail594);
    }
    if (!String(flat.m365_id || '').trim() && String(flat.mail_acct || '').trim()) {
      flat.m365_id = deriveM365IdFromMailAcct(flat.mail_acct);
    }
  }

  flat.shared_terminal_name = '';
  flat.purchase_date = val(r594, 'dop').trim();
  flat.latest_inventory_date = val(r594, 'last_inventory_date').trim();
  flat.note = buildNote594627(r594, k627, use627 && !!k627);

  flat.logon_pw = '';
  flat.mail_pw = '';
  flat.m365_pw = '';
  flat.gb_id = '';
  flat.gb_pw = '';
  flat.sb_id = '';
  flat.sb_pw = '';
  flat.vpn_id = '';
  flat.vpn_pw = '';
  flat.m365_master_record_id = '';

  if (use627 && k627) {
    flat.logon_pw = val(k627, 'logon_pw').trim();
    flat.mail_pw = val(k627, 'mail_pw').trim();
    flat.m365_pw = val(k627, 'm365_pw').trim();
    flat.gb_id = val(k627, 'gb_id').trim();
    flat.gb_pw = val(k627, 'gb_pw').trim();
    flat.sb_id = val(k627, 'sb_id').trim();
    flat.sb_pw = val(k627, 'sb_pw').trim();
    flat.vpn_id = val(k627, 'vpn_id').trim();
    flat.vpn_pw = val(k627, 'vpn_pw').trim();
  }

  flat.manufacturer = val(r594, 'manufacturer').trim();
  flat.model_name = flattenSingleLine(val(r594, 'model_name'));
  flat.manufacturing_no = val(r594, 'product_id').trim();
  flat.fixed_ip_1 = val(r594, 'ip1').trim();
  flat.fixed_ip_2 = val(r594, 'ip2').trim();
  flat.extra_info_1 = buildExtraInfo1(r594);
  const rid = val(r594, 'record_id').trim();
  flat.extra_info_2 = rid ? `[594:record_id] ${rid}` : '';

  flat['internal_system_meta.pc_serial_no'] = '0';
  flat['internal_system_meta.import_source'] = IMPORT_SOURCE;
  flat['internal_system_meta.legacy_pc_name_594'] = val(r594, 'PC_name').trim();
  const n594 = Number.parseInt(id594, 10);
  flat['internal_system_meta.legacy_record_id_594'] = Number.isFinite(n594) ? String(n594) : '';
  flat['internal_system_meta.created_at_jst'] = '';

  flat['skysea_system_meta.skysea_status'] = '未確認';
  flat['skysea_system_meta.skysea_checked_at'] = '';
  flat['skysea_system_meta.skysea_install_log'] = '';
  flat['skysea_system_meta.skysea_target_flag'] = '';

  if (!pcName) {
    return { flat: null, reason: 'pc_name が空' };
  }
  if (pcStatus === '廃棄') {
    return { flat: null, reason: '廃棄行は B-1 対象外のはず（念のためブロック）' };
  }

  return { flat, reason: '' };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const layoutData = await fetchJson(`${baseUrl}/k/v1/app/form/layout.json?app=${APP_674}`);
  const headerCodes = collectLayoutFieldCodes(layoutData.layout);

  const [rec594, rec627] = await Promise.all([
    fetchAll(APP_594, FIELDS_594),
    fetchAll(APP_627, FIELDS_627),
  ]);

  const warnings = [];
  const { by594Id, by627Id } = build627JoinMaps(rec627, warnings);

  const TYPE_PERSONAL = '個人';
  const TYPE_NAS = 'サーバーNAS';
  const TYPE_OTHER = 'その他';
  const TYPE_SHARED = '共有';
  const TYPE_JR = 'JR端末';
  const STATUS_DISPOSED = '廃棄';
  const exceptions = [];
  const flatRows = [];
  const pcNameCount = new Map();

  for (const r of rec594) {
    const typ = val(r, 'type');
    const st = val(r, 'status');
    if (typ === TYPE_SHARED || typ === TYPE_JR) continue;
    if (st === STATUS_DISPOSED || isAbolished594(r)) continue;
    if (typ !== TYPE_PERSONAL && typ !== TYPE_NAS && typ !== TYPE_OTHER) continue;

    const id594 = val(r, '$id').trim();
    const k627 = resolveK627(id594, r, by594Id, by627Id);
    const isStoragePersonal = typ === TYPE_PERSONAL && st === '保管';
    const use627 = typ === TYPE_PERSONAL && k627 && !isStoragePersonal;

    const built = buildFlat674Row({
      r594: r,
      k627,
      typ,
      st594: st,
      use627,
      isStoragePersonal,
      warnings,
    });

    if (!built.flat) {
      exceptions.push({ legacy594_id: id594, PC_name: val(r, 'PC_name'), reason: built.reason });
      continue;
    }

    const pn = built.flat.pc_name;
    pcNameCount.set(pn, (pcNameCount.get(pn) || 0) + 1);
    flatRows.push(built.flat);
  }

  for (const [name, c] of pcNameCount) {
    if (c > 1) warnings.push(`pc_name 重複 ${c} 件: "${name}"（取込前に要解消）`);
  }

  let csv = '\uFEFF';
  csv += csvLine(headerCodes);
  for (const flat of flatRows) {
    csv += csvLine(headerCodes.map((code) => flat[code] ?? ''));
  }
  fs.writeFileSync(OUT_CSV, csv, 'utf8');

  const excHeader = ['legacy594_id', '594_PC_name', 'reason'];
  let excOut = '\uFEFF' + csvLine(excHeader);
  for (const e of exceptions) {
    excOut += csvLine([e.legacy594_id, e.PC_name, e.reason]);
  }
  fs.writeFileSync(OUT_EXC, excOut, 'utf8');

  const dry = [
    `generated_at_utc=${new Date().toISOString()}`,
    `674_layout_field_count=${headerCodes.length}`,
    `import_rows=${flatRows.length}`,
    `exceptions_rows=${exceptions.length}`,
    `warnings_count=${warnings.length}`,
    '',
    ...warnings.map((w) => `WARN: ${w}`),
    '',
    `csv_path_wsl=${OUT_CSV}`,
    `csv_path_win=C:\\\\tmp\\\\new-pc-ledger\\\\${path.basename(OUT_CSV)}`,
    '',
    '※ 本 CSV はドラフト。kintone 取込前に浜田レビューとドライラン警告の解消を推奨。',
    `※ マッピング: docs/plans/2026-04-30-b1-field-mapping-to-674.md`,
    '',
    `header_order_first_10=${headerCodes.slice(0, 10).join(',')}`,
  ].join('\n');
  fs.writeFileSync(OUT_DRY, dry + '\n', 'utf8');

  console.log(dry);
  console.log(`Wrote ${OUT_CSV}`);
  console.log(`Wrote ${OUT_DRY}`);
  console.log(`Wrote ${OUT_EXC}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
