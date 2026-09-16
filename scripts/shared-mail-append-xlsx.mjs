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
 * 列: 利用種別 / 利用部署（または部署） / 表示名（または共有メールアドレス名・社員名） / メールアドレス / パスワード
 * 任意: メールアカウント（またはアカウント） / 協力会社（note へ）
 * 既存 skip でも Excel 協力会社があり kintone メモに無い行は「既存・未転記」と出す（--apply は新規 POST のみ）。
 * 利用種別別名: 個人→個人メールアドレス / 共有ML→共有メールアドレス
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

const USAGE_ALIASES = {
  個人: '個人メールアドレス',
  個人メールアドレス: '個人メールアドレス',
  共有ML: '共有メールアドレス',
  共有メールアドレス: '共有メールアドレス',
};

function normalizeUsage(raw) {
  const s = String(raw || '').trim();
  return USAGE_ALIASES[s] || s;
}

function compactContractor(s) {
  return String(s || '')
    .replace(/[\s　]/g, '')
    .replace(/株式会社|\(株\)|（株）/g, '');
}

function noteHasContractor(note, contractor) {
  const n = String(note || '');
  const c = String(contractor || '').trim();
  if (!c) return true;
  if (n.includes(`協力会社=${c}`)) return true;
  const cn = compactContractor(n);
  const cc = compactContractor(c);
  return Boolean(cc) && cn.includes(cc);
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
    const usageRaw = String(row['利用種別'] || USAGE_TYPE_DEFAULT).trim() || USAGE_TYPE_DEFAULT;
    const usage = normalizeUsage(usageRaw);
    const dept = String(row['利用部署'] || row['部署'] || '').trim();
    const displayName = String(
      row['表示名'] || row['共有メールアドレス名'] || row['社員名'] || '',
    ).trim();
    const pw = String(row['パスワード'] || '').trim();
    const acctRaw = String(row['メールアカウント'] || row['アカウント'] || '').trim();
    const contractor = String(row['協力会社'] || '').trim();
    const notes = [];
    if (usageRaw && usageRaw !== usage) notes.push(`Excel利用種別=${usageRaw}`);
    if (contractor) notes.push(`協力会社=${contractor}`);
    out.push({
      usage_type: usage,
      department: dept,
      mailbox_display_name: displayName,
      mail_address: mail,
      mail_account: acctRaw || mailAccountFromAddress(mail),
      password: pw,
      status: STATUS_ACTIVE,
      registered_date: todayJstYmd(),
      note: notes.join(' / '),
      contractor,
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
    const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(query)}&fields[0]=legacy_no&fields[1]=mail_address&fields[2]=note`;
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
        note: String(r.note?.value || ''),
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

  const seenExcel = new Set();
  const excelDup = [];
  const uniqueSource = [];
  for (const r of source) {
    if (seenExcel.has(r.mail_address)) {
      excelDup.push(r.mail_address);
      continue;
    }
    seenExcel.add(r.mail_address);
    uniqueSource.push(r);
  }
  if (excelDup.length) {
    console.log(`[append] Excel内重複 skip=${excelDup.length} sample=${excelDup.slice(0, 3).join(', ')}`);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const existing = await fetchAllMailMeta(baseUrl, headers, appId);
  const existingMails = new Set(existing.map((x) => x.mail).filter(Boolean));
  const existingByMail = new Map(existing.filter((x) => x.mail).map((x) => [x.mail, x]));
  let maxLegacy = 0;
  for (const x of existing) {
    if (Number.isFinite(x.legacy_no)) maxLegacy = Math.max(maxLegacy, x.legacy_no);
  }

  const toCreate = [];
  const skipped = [];
  const unfilledNote = [];
  let next = maxLegacy + 1;
  for (const r of uniqueSource) {
    if (existingMails.has(r.mail_address)) {
      skipped.push(r.mail_address);
      const knote = existingByMail.get(r.mail_address)?.note || '';
      if (r.contractor && !noteHasContractor(knote, r.contractor)) {
        unfilledNote.push(`${r.mail_address} / 協力会社=${r.contractor}`);
      }
      continue;
    }
    toCreate.push({ row: r, legacy_no: next });
    next += 1;
  }

  console.log(`[append] existing=${existing.length} maxLegacy=${maxLegacy}`);
  console.log(`[append] create=${toCreate.length} skipDuplicate=${skipped.length}`);
  if (skipped.length) console.log(`[append] skip sample: ${skipped.slice(0, 5).join(', ')}`);
  console.log(`[append] existing-unfilled-note=${unfilledNote.length}`);
  if (unfilledNote.length) {
    console.log(`[append] unfilled sample: ${unfilledNote.slice(0, 5).join(', ')}`);
  }
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
