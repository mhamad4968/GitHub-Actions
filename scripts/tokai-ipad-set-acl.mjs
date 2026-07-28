#!/usr/bin/env node
/**
 * 東海支店 iPad — ACL (tokai + admin / everyone deny)
 * Dash REST のため DB にも tokai の record 書込を許可。UI 操作は customize で禁止。
 * 595/674 の ACL は変更しない。
 */
import {
  buildTokaiIpadDashAclRights,
  buildTokaiIpadDbAclRights,
  getKintoneConfig,
  loadAppIds,
  setAppAcl,
} from './lib/tokai-ipad-kintone.mjs';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const dbAppId = Number(state.dbAppId);
  const dashAppId = Number(state.dashAppId);

  if (!dbAppId || !dashAppId) {
    console.error('dbAppId/dashAppId missing. Create apps first.');
    process.exit(1);
  }
  if ([dbAppId, dashAppId].some((id) => id === 720 || id === 721)) {
    throw new Error(`Safety abort: forbidden app id in state (${dbAppId}/${dashAppId})`);
  }

  const dbRights = buildTokaiIpadDbAclRights();
  const dashRights = buildTokaiIpadDashAclRights();

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          action: 'would-set-acl',
          dbAppId,
          dashAppId,
          dbEntities: dbRights.map((r) => r.entity),
          dashEntities: dashRights.map((r) => r.entity),
          note: 'Does NOT touch 595/674/720/721',
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`ACL DB app=${dbAppId} ...`);
  const dbRev = await setAppAcl(baseUrl, headers, dbAppId, dbRights);
  console.log(`ACL DB done revision=${dbRev}`);

  console.log(`ACL Dash app=${dashAppId} ...`);
  const dashRev = await setAppAcl(baseUrl, headers, dashAppId, dashRights);
  console.log(`ACL Dash done revision=${dashRev}`);
  console.log('OK — ACL applied (595/674 untouched).');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
