#!/usr/bin/env node
/**
 * Space 48 本文に VPN ライセンス月末「確定」注意書きを追記／更新／削除。
 * 正本: https://jbis-kintone.cybozu.com/k/#/space/48
 *
 * 表示期間（JST）: 毎月 28 日〜翌月 1 日のみ。
 * 対象月: 28〜31 日は当月、翌 1 日は前月（猶予）。
 * 733 の対象月 snapshot 未確定なら表示、確定済みまたは期間外なら削除。
 *
 * Flags:
 *   --dry-run   PUT せず diff のみ
 *   --force     期間外でも未確定なら表示（検証用）
 *   --remove    注意書きブロックのみ削除
 *   --keep      733 状態に関わらず期間内なら表示を維持（検証用）
 */
import {
  getKintoneConfig,
  fetchJson,
  loadAppIds,
  RECORD_KIND_LICENSE_SNAPSHOT,
} from './lib/vpn-account-kintone.mjs';
import {
  SPACE48_ID,
  buildVpnLicenseNoticeHtml,
  getSpaceBody,
  putSpaceBody,
  removeVpnLicenseNotice,
  upsertVpnLicenseNotice,
} from './lib/space48-body.mjs';

const WINDOW_START_DAY = 28;
const WINDOW_END_NEXT_DAY = 1;

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    remove: argv.includes('--remove'),
    keep: argv.includes('--keep'),
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
  return { ym: `${v('year')}-${v('month')}`, day: parseInt(v('day'), 10) };
}

function previousYm(ym) {
  const [y, m] = ym.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** @returns {{ inWindow: boolean; targetYm: string; ym: string; day: number }} */
function getReminderContext({ ym, day }) {
  const inWindow = day >= WINDOW_START_DAY || day <= WINDOW_END_NEXT_DAY;
  const targetYm = day <= WINDOW_END_NEXT_DAY ? previousYm(ym) : ym;
  return { inWindow, targetYm, ym, day };
}

async function hasConfirmedSnapshot(baseUrl, headers, appId, ym) {
  const query =
    `record_kind in ("${RECORD_KIND_LICENSE_SNAPSHOT}") and snapshot_month = "${ym}" limit 1`;
  const url = `${baseUrl}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(query)}`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return (j.records?.length ?? 0) > 0;
}

async function applyBody(baseUrl, headers, bodyAfter, args, label) {
  if (args.dryRun) {
    console.log(`[vpn-space48-notice] dry-run — ${label}`);
    return;
  }
  await putSpaceBody(baseUrl, headers, bodyAfter);
  console.log(`[vpn-space48-notice] ${label}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jst = jstNow();
  const ctx = getReminderContext(jst);
  const { baseUrl, headers } = getKintoneConfig();
  const ids = loadAppIds();
  const dbAppId = ids.dbAppId || 733;

  console.log(
    `[vpn-space48-notice] space=${SPACE48_ID} JST ${ctx.ym} day=${ctx.day}` +
      ` window=${ctx.inWindow} target=${ctx.targetYm}`,
  );

  const bodyBefore = await getSpaceBody(baseUrl, headers);

  if (args.remove) {
    const bodyAfter = removeVpnLicenseNotice(bodyBefore);
    if (bodyAfter === bodyBefore) {
      console.log('[vpn-space48-notice] notice block not found — nothing to do');
      return;
    }
    await applyBody(baseUrl, headers, bodyAfter, args, 'notice removed');
    return;
  }

  if (!ctx.inWindow && !args.force) {
    const bodyAfter = removeVpnLicenseNotice(bodyBefore);
    if (bodyAfter === bodyBefore) {
      console.log('[vpn-space48-notice] outside window — notice already absent');
      return;
    }
    await applyBody(baseUrl, headers, bodyAfter, args, 'outside window — notice removed');
    return;
  }

  const confirmed = await hasConfirmedSnapshot(baseUrl, headers, dbAppId, ctx.targetYm);
  if (confirmed && !args.keep) {
    const bodyAfter = removeVpnLicenseNotice(bodyBefore);
    if (bodyAfter === bodyBefore) {
      console.log(`[vpn-space48-notice] ${ctx.targetYm} confirmed — notice already absent`);
      return;
    }
    await applyBody(
      baseUrl,
      headers,
      bodyAfter,
      args,
      `${ctx.targetYm} confirmed — notice removed`,
    );
    return;
  }

  const noticeHtml = buildVpnLicenseNoticeHtml(ctx.targetYm);
  const bodyAfter = upsertVpnLicenseNotice(bodyBefore, noticeHtml);
  if (bodyAfter === bodyBefore) {
    console.log('[vpn-space48-notice] notice unchanged');
    return;
  }
  await applyBody(baseUrl, headers, bodyAfter, args, 'notice upserted on Space 48');
}

main().catch((e) => {
  console.error('[vpn-space48-notice] fatal:', e.message || e);
  process.exit(1);
});
