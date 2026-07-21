#!/usr/bin/env node
/**
 * 実行予算 Ver.02 Phase C-2b — 最小 ACL 開放。
 *
 * 対象は state の app1/2/3（756/757/758）のみ。735/736 は state ロード時点で
 * 拒否される。変更内容:
 * - 運用管理アカウント（KINTONE_USERNAME）: appEditable に加えて
 *   recordAddable/Editable/Deletable を true にする（テスト保存用）。
 * - everyone: これまでどおり read-only（add/edit/delete/import/export=false）。
 *
 * 既定は DRY-RUN（env 不要・ネットワークなし）。--execute には
 * JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1 が必要。
 */
import {
  APP_ORDER,
  EVERYONE_READ_ONLY_RIGHTS,
  IMPLEMENTATION_GO_ENV,
  assertAllowedAppId,
  assertImplementationGo,
  deployAppAndWait,
  fetchJson,
  getKintoneConfig,
  loadState,
  parseCliArgs,
} from "./lib/jikkou-yosan-v2/kintone.mjs";

function adminWriteRights(adminUsername) {
  if (!adminUsername) throw new Error("admin username is required");
  return [
    {
      entity: { type: "USER", code: String(adminUsername) },
      appEditable: true,
      recordViewable: true,
      recordAddable: true,
      recordEditable: true,
      recordDeletable: true,
      recordImportable: false,
      recordExportable: false,
    },
    ...EVERYONE_READ_ONLY_RIGHTS.map((right) => ({ ...right, entity: { ...right.entity } })),
  ];
}

function targetApps() {
  const state = loadState();
  return APP_ORDER.map((key) => {
    const entry = state.apps[key];
    if (entry.appId === null || entry.status !== "deployed") {
      throw new Error(`${key}: appId/status not ready (appId=${entry.appId}, status=${entry.status})`);
    }
    return { key, appId: assertAllowedAppId(entry.appId, `openAcl(${key})`), name: entry.name };
  });
}

async function execute() {
  assertImplementationGo();
  const ctx = getKintoneConfig();
  for (const app of targetApps()) {
    const rights = adminWriteRights(ctx.username);
    const res = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app/acl.json`, {
      method: "PUT",
      headers: ctx.headers,
      body: JSON.stringify({ app: String(app.appId), rights }),
    });
    console.log(`[${app.key}] ACL updated (preview revision=${res.revision}) — deploying`);
    await deployAppAndWait(ctx, app.appId, res.revision);
    console.log(`[${app.key}] deploy SUCCESS: admin=${ctx.username} record add/edit/delete=true, everyone read-only`);
  }
  console.log("ACL 開放完了（運用管理アカウントのみ。everyone は read-only のまま）");
}

const { mode } = parseCliArgs(process.argv.slice(2));
if (mode === "execute") {
  await execute();
} else {
  console.log("DRY-RUN: ネットワークアクセスなし。以下を適用予定:");
  for (const app of targetApps()) {
    console.log(`- app ${app.appId} (${app.name}): admin user add/edit/delete=true, everyone read-only 維持`);
  }
  console.log(`実行: ${IMPLEMENTATION_GO_ENV}=1 のうえ --execute`);
}
