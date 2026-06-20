#!/usr/bin/env node
/**
 * @deprecated メールリマインドは廃止。Space 48 注意書きは vpn-account-update-space48-notice.mjs を使用。
 */
 *
 * Env:
 *   KINTONE_BASE_URL / KINTONE_USERNAME / KINTONE_PASSWORD（733 参照）
 *   VPN_LICENSE_REMINDER_TO — 宛先（既定 jb-sys@j-bis.co.jp）
 *   送信元 — 既定 hamada-m@j-bis.co.jp（SMTP_FROM で上書き可）
 *
 * Flags:
 *   --dry-run   送信せず内容を stdout
 *   --force     28 日以前でも実行（検査のみ）
 *   --force-mail  確定済みでも送信（SMTP テスト用）
 */
import {
  getKintoneConfig,
  fetchJson,
  loadAppIds,
  RECORD_KIND_LICENSE_SNAPSHOT,
} from './lib/vpn-account-kintone.mjs';
import { sendJbisMail, smtpConfigured } from './lib/jbis-smtp.mjs';

const REMINDER_MIN_DAY = 28;
const DEFAULT_REMINDER_TO = 'jb-sys@j-bis.co.jp';
const DEFAULT_SMTP_FROM = 'hamada-m@j-bis.co.jp';
const DASH_URL = process.env.VPN_ACCOUNT_DASH_URL || 'https://jbis-kintone.cybozu.com/k/734/';

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    forceMail: argv.includes('--force-mail'),
  };
}

function jstNow() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const v = (t) => parts.find((p) => p.type === t)?.value ?? '';
  const day = parseInt(v('day'), 10);
  return { ym: `${v('year')}-${v('month')}`, day };
}

async function hasConfirmedSnapshot(baseUrl, headers, appId, ym) {
  const query =
    `record_kind in ("${RECORD_KIND_LICENSE_SNAPSHOT}") and snapshot_month = "${ym}" limit 1`;
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(query)}`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return (j.records?.length ?? 0) > 0;
}

function buildMail(ym) {
  const subject = `[VPN台帳] ${ym} ライセンス集計の確定をお願いします`;
  const text = [
    'VPNアカウント台帳の月次ライセンス集計が、まだ確定されていません。',
    '',
    `対象月: ${ym}`,
    '',
    '月末の運用: ダッシュボード上部のライセンス欄で',
    `「${ym} の集計を確定」ボタンを押してください。`,
    '',
    `台帳: ${DASH_URL}`,
    '',
    '（請求書到着後は前月比を確認するだけで、再確定は不要です）',
  ].join('\n');
  return { subject, text };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { ym, day } = jstNow();
  const ids = loadAppIds();
  const dbAppId = ids.dbAppId || 733;

  console.log(`[vpn-license-reminder] JST ${ym} day=${day}`);

  if (day < REMINDER_MIN_DAY && !args.force) {
    console.log(
      `[vpn-license-reminder] skip: before day ${REMINDER_MIN_DAY} (use --force to override)`,
    );
    process.exit(0);
  }

  const { baseUrl, headers } = getKintoneConfig();
  const confirmed = await hasConfirmedSnapshot(baseUrl, headers, dbAppId, ym);

  if (confirmed && !args.forceMail) {
    console.log(`[vpn-license-reminder] ${ym} already confirmed — no mail`);
    process.exit(0);
  }

  const to = process.env.VPN_LICENSE_REMINDER_TO?.trim() || DEFAULT_REMINDER_TO;
  const { subject, text } = buildMail(ym);

  if (args.dryRun) {
    const from = process.env.SMTP_FROM?.trim() || DEFAULT_SMTP_FROM;
    console.log('[vpn-license-reminder] dry-run — would send from:', from, 'to:', to);
    console.log('--- subject ---', subject);
    console.log(text);
    process.exit(0);
  }

  if (!smtpConfigured()) {
    console.error('[vpn-license-reminder] SMTP_USER / SMTP_PASS required');
    process.exit(1);
  }

  await sendJbisMail({
    to,
    subject,
    text,
    from: process.env.SMTP_FROM?.trim() || DEFAULT_SMTP_FROM,
  });
  console.log('[vpn-license-reminder] mail sent to', to, 'from', process.env.SMTP_FROM?.trim() || DEFAULT_SMTP_FROM);
}

main().catch((e) => {
  console.error('[vpn-license-reminder] fatal:', e.message || e);
  process.exit(1);
});
