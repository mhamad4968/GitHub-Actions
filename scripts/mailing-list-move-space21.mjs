#!/usr/bin/env node
/**
 * メーリングリスト 750/751 を Space 21（thread 23）へ移設し ACL を設定する。
 * - admin（USER）: 全権限
 * - system（USER）: 閲覧 + Excel 出力（印刷は台帳 customize）
 * - everyone: 拒否
 *
 * Usage:
 *   node scripts/mailing-list-move-space21.mjs [--dry-run]
 */
import {
  DB_APP_NAME,
  DASH_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  getKintoneConfig,
  getAppPlacement,
  loadAppIds,
  moveAppToSpace,
  saveAppIds,
  setMailingListAppAcl,
} from './lib/mailing-list-kintone.mjs';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const dbAppId = Number(state.dbAppId || 750);
  const dashAppId = Number(state.dashAppId || 751);

  const beforeDb = await getAppPlacement(baseUrl, headers, dbAppId);
  const beforeDash = await getAppPlacement(baseUrl, headers, dashAppId);
  console.log('[before]', { db: beforeDb, dash: beforeDash, targetSpace: SPACE_ID, targetThread: THREAD_ID });

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          move: [
            { appId: dbAppId, name: DB_APP_NAME, fromSpace: beforeDb.spaceId, toSpace: SPACE_ID },
            { appId: dashAppId, name: DASH_APP_NAME, fromSpace: beforeDash.spaceId, toSpace: SPACE_ID },
          ],
          acl: {
            admin: 'full',
            system: 'view+export',
            everyone: 'deny',
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const app of [beforeDb, beforeDash]) {
    if (app.spaceId === SPACE_ID) {
      console.log(`[move] skip app=${app.appId} already in space=${SPACE_ID}`);
      continue;
    }
    console.log(`[move] app=${app.appId} "${app.name}" space ${app.spaceId} -> ${SPACE_ID}`);
    await moveAppToSpace(baseUrl, headers, app.appId, SPACE_ID);
  }

  const afterDb = await getAppPlacement(baseUrl, headers, dbAppId);
  const afterDash = await getAppPlacement(baseUrl, headers, dashAppId);
  console.log('[after-move]', { db: afterDb, dash: afterDash });

  console.log(`[acl] app=${dbAppId} (${DB_APP_NAME})`);
  await setMailingListAppAcl(baseUrl, headers, dbAppId);
  console.log(`[acl] app=${dashAppId} (${DASH_APP_NAME})`);
  await setMailingListAppAcl(baseUrl, headers, dashAppId);

  saveAppIds({
    ...state,
    dbAppId,
    dashAppId,
    spaceId: SPACE_ID,
    threadId: THREAD_ID,
  });

  console.log('[done]');
  console.log(`DB=${baseUrl}/k/${dbAppId}/`);
  console.log(`DASH=${baseUrl}/k/${dashAppId}/`);
  console.log(`SPACE=${baseUrl}/k/#/space/${SPACE_ID}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
