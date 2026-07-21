#!/usr/bin/env node
/**
 * 実行予算 Ver.02 残C — 一般開放 ACL。
 *
 * (1) app-level: everyone に record add/edit/delete を許可（view は従来どおり、
 *     import/export は false のまま）。運用管理アカウントは appEditable 維持。
 *     P-35 の直接編集防止は App2/3 にデプロイ済みの直編集ガード JS が担う
 *     （API 経由の書込は App1 カスタム UI の保存経路が使うため許可が必要）。
 * (2) App2 record-level ACL: parent_lock_snapshot in ("locked") の行は
 *     everyone 閲覧のみ（編集・削除不可）。条件非該当行はアプリ ACL に従う。
 *
 * 対象は state の 3 アプリのみ（735/736 は state ロードで拒否）。既定 DRY-RUN。
 * --execute には JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1 が必要。
 */
import {
  APP_ORDER,
  IMPLEMENTATION_GO_ENV,
  assertAllowedAppId,
  assertImplementationGo,
  deployAppAndWait,
  fetchJson,
  getKintoneConfig,
  loadState,
  parseCliArgs,
} from "./lib/jikkou-yosan-v2/kintone.mjs";

const LOCKED_ROW_FILTER = 'parent_lock_snapshot in ("locked")';

function generalRights(adminUsername) {
  const rights = [];
  if (adminUsername) {
    rights.push({
      entity: { type: "USER", code: String(adminUsername) },
      appEditable: true,
      recordViewable: true,
      recordAddable: true,
      recordEditable: true,
      recordDeletable: true,
      recordImportable: false,
      recordExportable: false,
    });
  }
  rights.push({
    entity: { type: "GROUP", code: "everyone" },
    appEditable: false,
    recordViewable: true,
    recordAddable: true,
    recordEditable: true,
    recordDeletable: true,
    recordImportable: false,
    recordExportable: false,
  });
  return rights;
}

function lockedRowRecordAcl() {
  return [
    {
      filterCond: LOCKED_ROW_FILTER,
      entities: [
        {
          entity: { type: "GROUP", code: "everyone" },
          viewable: true,
          editable: false,
          deletable: false,
          includeSubs: false,
        },
      ],
    },
  ];
}

function targetApps() {
  const state = loadState();
  return APP_ORDER.map((key) => {
    const entry = state.apps[key];
    if (entry.appId === null || entry.status !== "deployed") {
      throw new Error(`${key}: not ready (appId=${entry.appId}, status=${entry.status})`);
    }
    return { key, appId: assertAllowedAppId(entry.appId, `openGeneralAcl(${key})`), name: entry.name };
  });
}

async function execute() {
  assertImplementationGo();
  const ctx = getKintoneConfig();
  const apps = targetApps();
  for (const app of apps) {
    const res = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/app/acl.json`, {
      method: "PUT",
      headers: ctx.headers,
      body: JSON.stringify({ app: String(app.appId), rights: generalRights(ctx.username) }),
    });
    let revision = res.revision;
    if (app.key === "app2") {
      const recordAcl = await fetchJson(ctx, `${ctx.baseUrl}/k/v1/preview/record/acl.json`, {
        method: "PUT",
        headers: ctx.headers,
        body: JSON.stringify({ app: String(app.appId), rights: lockedRowRecordAcl() }),
      });
      revision = recordAcl.revision;
      console.log(`[${app.key}] record-level ACL set: ${LOCKED_ROW_FILTER} → everyone view-only`);
    }
    await deployAppAndWait(ctx, app.appId, revision);
    console.log(`[${app.key}] deploy SUCCESS: everyone add/edit/delete=true (import/export=false)`);
  }
  console.log("一般開放 ACL 完了（App2 locked 行は everyone 閲覧のみ）");
}

const { mode } = parseCliArgs(process.argv.slice(2));
if (mode === "execute") {
  await execute();
} else {
  console.log("DRY-RUN: ネットワークアクセスなし。適用予定:");
  for (const app of targetApps()) {
    console.log(`- app ${app.appId} (${app.name}): everyone add/edit/delete=true, import/export=false`);
    if (app.key === "app2") {
      console.log(`  + record ACL: ${LOCKED_ROW_FILTER} → everyone 閲覧のみ`);
    }
  }
  console.log(`実行: ${IMPLEMENTATION_GO_ENV}=1 のうえ --execute`);
}
