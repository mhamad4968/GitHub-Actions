#!/usr/bin/env node
/**
 * 756/757/758 の LIVE app ACL が「カスタム UI 一時保存」可能な everyone 書込か検証する。
 * everyone が閲覧のみだと bulkRequest が CB_NO02（権限がありません）になる。
 *
 * npm run verify:jikkou-yosan-v2-write-acl
 * npm run verify:jikkou-yosan-v2-write-acl -- --offline-skip
 */
import process from "node:process";
import { loadDotenv, getKintoneConfig } from "./lib/kintone-live-schema.mjs";
import { loadState } from "./lib/jikkou-yosan-v2/kintone.mjs";

const TARGETS = Object.freeze([
  { key: "app1", appId: 756, lockedRecordAcl: false },
  { key: "app2", appId: 757, lockedRecordAcl: true },
  { key: "app3", appId: 758, lockedRecordAcl: false },
]);

const LOCKED_FILTER = 'parent_lock_snapshot in ("locked")';

function everyoneRight(rights) {
  return (rights || []).find(
    (right) => right?.entity?.type === "GROUP" && right?.entity?.code === "everyone",
  );
}

async function getJson(baseUrl, headers, path, app) {
  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("app", String(app));
  const h = { ...headers };
  delete h["Content-Type"];
  const res = await fetch(url, { method: "GET", headers: h });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} app=${app} HTTP ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
  }
  return json;
}

function assertEveryoneWrite(appId, right, errors) {
  if (!right) {
    errors.push(`app ${appId}: everyone ACL entry missing`);
    return;
  }
  for (const flag of ["recordViewable", "recordAddable", "recordEditable", "recordDeletable"]) {
    if (right[flag] !== true) {
      errors.push(`app ${appId}: everyone.${flag}=${right[flag]} (need true)`);
    }
  }
  for (const flag of ["appEditable", "recordImportable", "recordExportable"]) {
    if (right[flag] !== false) {
      errors.push(`app ${appId}: everyone.${flag}=${right[flag]} (need false)`);
    }
  }
}

function assertLockedRowAcl(appId, rights, errors) {
  const hit = (rights || []).find((row) => String(row?.filterCond || "") === LOCKED_FILTER);
  if (!hit) {
    errors.push(`app ${appId}: missing record ACL ${LOCKED_FILTER}`);
    return;
  }
  const everyone = (hit.entities || []).find(
    (ent) => ent?.entity?.type === "GROUP" && ent?.entity?.code === "everyone",
  );
  if (!everyone) {
    errors.push(`app ${appId}: locked-row ACL missing everyone entity`);
    return;
  }
  if (everyone.viewable !== true || everyone.editable !== false || everyone.deletable !== false) {
    errors.push(
      `app ${appId}: locked-row everyone view=${everyone.viewable} edit=${everyone.editable} del=${everyone.deletable}`,
    );
  }
}

async function main() {
  const root = process.cwd();
  loadDotenv(root);
  const offlineSkip = process.argv.includes("--offline-skip");
  try {
    getKintoneConfig();
  } catch (error) {
    if (offlineSkip) {
      console.warn(`[verify:jikkou-yosan-v2-write-acl] skip (no creds): ${error.message}`);
      process.exit(0);
    }
    throw error;
  }

  const state = loadState();
  for (const target of TARGETS) {
    const liveId = Number(state.apps?.[target.key]?.appId);
    if (liveId !== target.appId) {
      throw new Error(
        `state ${target.key} appId=${state.apps?.[target.key]?.appId} !== expected ${target.appId}`,
      );
    }
  }

  const { baseUrl, headers } = getKintoneConfig();
  const errors = [];
  for (const target of TARGETS) {
    const appAcl = await getJson(baseUrl, headers, "/k/v1/app/acl.json", target.appId);
    assertEveryoneWrite(target.appId, everyoneRight(appAcl.rights), errors);
    const recAcl = await getJson(baseUrl, headers, "/k/v1/record/acl.json", target.appId);
    if (target.lockedRecordAcl) {
      assertLockedRowAcl(target.appId, recAcl.rights, errors);
    }
  }

  if (errors.length) {
    for (const line of errors) console.error(`[verify:jikkou-yosan-v2-write-acl] NG ${line}`);
    process.exit(1);
  }
  console.log(
    "[verify:jikkou-yosan-v2-write-acl] OK everyone add/edit/delete on 756/757/758; 757 locked rows view-only",
  );
}

main().catch((error) => {
  console.error("[verify:jikkou-yosan-v2-write-acl] NG", error.message || error);
  process.exit(1);
});
