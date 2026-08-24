#!/usr/bin/env node
/**
 * 共有メール DB(695) — Excel **追記**登録（既存レコードあり可）
 * 正本: docs/runbooks/shared-mail-append-xlsx.md
 *
 * 初期一括は `shared-mail:migrate:xlsx`（既存あり拒否・legacy 1 から）。取り違えないこと。
 *
 *   npm run shared-mail:append:xlsx -- --dry-run --xlsx="C:\\path\\file.xlsx"
 *   npm run shared-mail:append:xlsx -- --apply --xlsx="C:\\path\\file.xlsx"
 *
 * 列: 利用種別 / 利用部署 / 表示名（または共有メールアドレス名） / メールアドレス / パスワード
 * ログにパスワードは出さない。
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import XLSX from './lib/xlsx-node.mjs';
import {
  STATUS_ACTIVE,
  USAGE_TYPE_DEFAULT,
  USAGE_TYPES,
  MAIL_DOMAIN,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  mailAccountFromAddress,
} from './lib/shared-mail-kintone.mjs';

const BATCH = 50;
const PAGE = 100;

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const xlsx =
    process.argv.find((a) => a.startsWith('--xlsx='))?.slice(7) ||
    process.env.SHARED_MAIL_APPEND_XLSX ||
    '';
  const appArg = process.argv.find((a) => a.startsWith('--app='))?.slice(6);
  return { dryRun, apply, xlsx, appId: appArg ? Number(appArg) : null };
}

function todayJstYmd() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

function validateMail(addr) {
  const s = String(addr || '').trim().toLowerCase();
  if (!s) return 'メール必須';
  if (!s.endsWith(MAIL_DOMAIN)) return `ドメインは ${MAIL_DOMAIN} のみ`;
  if (!/^[\w.-]+@j-bis\.co\.jp$/i.test(s)) return '形式不正';
  return '';
}

function readRows(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const out = [];
  for (const row of rows) {
    const mail = String(row['メールアドレス'] || '')
      .trim()
      .toLowerCase();
    if (!mail) continue;
    const usage =
      String(row['利用種別'] || USAGE_TYPE_DEFAULT).trim() || USAGE_TYPE_DEFAULT;
    const dept = String(row['利用部署'] || '').trim();
    const displayName = String(
      row['表示名'] || row['共有メールアドレス名'] || '',
    ).trim();
    const pw = String(row['パスワード'] || '').trim();
    const acctRaw = String(row['メールアカウント'] || '').trim();
    out.push({
      usage_type: usage,
      department: dept,
      mailbox_display_name: displayName,
      mail_address: mail,
      mail_account: acctRaw || mailAccountFromAddress(mail),
      password: pw,
      status: STATUS_ACTIVE,
      registered_date: todayJstYmd(),
      note: '',
      password_set: Boolean(pw),
    });
  }
  return out;
}

async function fetchAllMailMeta(baseUrl, headers, appId) {
  const all = [];
  let offset = 0;
  for (;;) {
    const query = `order by legacy_no asc limit ${PAGE} offset ${offset}`;
    const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(query)}&fields[0]=legacy_no&fields[1]=mail_address`;
    const res = await fetchJson(url, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    const rows = res.records || [];
    for (const r of rows) {
      all.push({
        legacy_no: Number(r.legacy_no?.value || 0),
        mail: String(r.mail_address?.value || '')
          .trim()
          .toLowerCase(),
      });
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

function toKintoneRecord(row, legacyNo) {
  return {
    legacy_no: { value: String(legacyNo) },
    usage_type: { value: row.usage_type },
    department: { value: row.department },
    mailbox_display_name: { value: row.mailbox_display_name },
    mail_address: { value: row.mail_address },
    mail_account: { value: row.mail_account },
    password: { value: row.password },
    status: { value: row.status },
    registered_date: { value: row.registered_date },
    note: { value: row.note || '' },
  };
}

async function main() {
  const { dryRun, apply, xlsx, appId: appArg } = parseArgs();
  if (!dryRun && !apply) {
    console.error('Use --dry-run or --apply（必ず先に --dry-run）');
    process.exit(1);
  }
  if (!xlsx || !existsSync(xlsx)) {
    console.error(`xlsx not found: ${xlsx}`);
    process.exit(1);
  }

  const state = loadAppIds();
  const appId = appArg || state.dbAppId || 695;
  const source = readRows(xlsx);
  console.log(`[append] source=${path.basename(xlsx)} rows=${source.length} app=${appId}`);

  const invalid = [];
  for (const r of source) {
    const e = validateMail(r.mail_address);
    if (e) invalid.push({ mail: r.mail_address, e });
    if (!USAGE_TYPES.includes(r.usage_type)) {
      invalid.push({ mail: r.mail_address, e: `利用種別不正: ${r.usage_type}` });
    }
    if (!r.department || !r.mailbox_display_name) {
      invalid.push({ mail: r.mail_address, e: '部署または表示名が空' });
    }
    if (!r.password_set) invalid.push({ mail: r.mail_address, e: 'パスワード空' });
  }
  if (invalid.length) {
    console.error('[append] validation NG', invalid.slice(0, 10));
    process.exit(2);
  }

  const mails = source.map((r) => r.mail_address);
  if (new Set(mails).size !== mails.length) {
    console.error('[append] Excel 内でメール重複');
    process.exit(2);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const existing = await fetchAllMailMeta(baseUrl, headers, appId);
  const existingMails = new Set(existing.map((x) => x.mail).filter(Boolean));
  let maxLegacy = 0;
  for (const x of existing) {
    if (Number.isFinite(x.legacy_no)) maxLegacy = Math.max(maxLegacy, x.legacy_no);
  }

  const toCreate = [];
  const skipped = [];
  let next = maxLegacy + 1;
  for (const r of source) {
    if (existingMails.has(r.mail_address)) {
      skipped.push(r.mail_address);
      continue;
    }
    toCreate.push({ row: r, legacy_no: next });
    next += 1;
  }

  console.log(`[append] existing=${existing.length} maxLegacy=${maxLegacy}`);
  console.log(`[append] create=${toCreate.length} skipDuplicate=${skipped.length}`);
  if (skipped.length) console.log(`[append] skip sample: ${skipped.slice(0, 5).join(', ')}`);
  if (toCreate.length) {
    const s0 = toCreate[0];
    console.log(
      `[append] first: No.${s0.legacy_no} ${s0.row.mail_address} / ${s0.row.mailbox_display_name} / ${s0.row.department} / ${s0.row.usage_type} (pw=set)`,
    );
    const sL = toCreate[toCreate.length - 1];
    console.log(
      `[append] last:  No.${sL.legacy_no} ${sL.row.mail_address} / ${sL.row.mailbox_display_name}`,
    );
  }

  if (dryRun || !toCreate.length) {
    console.log(dryRun ? '[append] dry-run OK（書込なし）' : '[append] 新規なし');
    return;
  }

  let posted = 0;
  const ids = [];
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const chunk = toCreate.slice(i, i + BATCH).map((x) => toKintoneRecord(x.row, x.legacy_no));
    const res = await fetchJson(`${baseUrl}/k/v1/records.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: appId, records: chunk }),
    });
    posted += chunk.length;
    ids.push(...(res.ids || []));
    console.log(`[append] POST ${posted}/${toCreate.length}`);
  }
  console.log(`[append] done posted=${posted} idRange=${ids[0] || '-'}…${ids[ids.length - 1] || '-'}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
