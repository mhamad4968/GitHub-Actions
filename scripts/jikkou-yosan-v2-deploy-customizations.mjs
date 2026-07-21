#!/usr/bin/env node
/**
 * 実行予算 Ver.02 Phase 6 — カスタマイズJS deploy オーケストレータ。
 *
 * 既定は DRY-RUN: state（scripts/data/jikkou-yosan-v2-app-ids.json）を読み、
 * app1/2/3 の customize パス・appId・status と実行予定コマンドを表示するだけ。
 * 資格情報を読まず、ネットワークアクセスもしない。
 *
 * --execute の条件（すべて満たさない限り何も実行しない）:
 * - JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1（完全一致）
 * - 3アプリ全部: appId 非null・非735/736・schema status=deployed
 *
 * 実行順（直列・最初の失敗で停止、以降は実行しない）:
 * 1. scripts/jikkou-yosan-v2-sync-app-ids.mjs  … App1 ソースへ ID を注入
 * 2. scripts/jikkou-yosan-v2-build-desktop.mjs … App1 bundle を再生成
 * 3-5. scripts/deploy-customization.js <ID> customize/jikkou-yosan-v2-appN/desktop.js
 *      （app1 → app2 → app3。成功ごとに customizationStatus=deployed を保存）
 *
 * customize/736・App 735/736 には一切触れない。カスタマイズ deploy は ACL を
 * 変更しないため、read-only shell のまま（レコード書込みは開かない）。
 *
 * 実行コマンド（承認後に手動で。dry-run は env 不要）:
 *   npm run jikkou-yosan:v2-deploy-customizations            # DRY-RUN（既定）
 *   set JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1 のうえで
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-v2-deploy-customizations.mjs --execute
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCustomizationDeployPlan,
  assertExecutableCustomizationPlan,
} from "./lib/jikkou-yosan-v2/customization-deploy.mjs";
import {
  IMPLEMENTATION_GO_ENV,
  LIVE_NOT_READY_NOTE,
  assertImplementationGo,
  loadState,
  markCustomizationDeployed,
  markCustomizationError,
  parseCliArgs,
  saveState,
} from "./lib/jikkou-yosan-v2/kintone.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadOrchestratorState() {
  const testStatePath =
    process.env.NODE_ENV === "test"
      ? process.env.JIKKOU_YOSAN_V2_TEST_STATE_PATH
      : undefined;
  return loadState(testStatePath ? { statePath: testStatePath } : undefined);
}

function dryRun() {
  const state = loadOrchestratorState();
  const plan = buildCustomizationDeployPlan(state);
  console.log("DRY-RUN: ネットワークアクセスなし・認証情報不要。実行は --execute のみ。");
  console.log(`LIVE readiness: ${LIVE_NOT_READY_NOTE} (execute には ${IMPLEMENTATION_GO_ENV}=1 が必要)`);
  console.log(JSON.stringify(plan, null, 2));
}

function runCommand(command) {
  console.log(`\n[step ${command.step}] ${command.description}`);
  console.log(`  $ ${command.argv.join(" ")}`);
  const [, ...args] = command.argv; // argv[0] は "node"
  const r = spawnSync(process.execPath, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error(`step ${command.step} failed (exit ${r.status}): ${command.argv.join(" ")}`);
  }
}

async function execute() {
  // 資格情報の読込・子プロセス起動より前に GO と state の厳格ゲートを通す。
  assertImplementationGo();
  const state = loadOrchestratorState();
  const plan = assertExecutableCustomizationPlan(state);
  console.log(`実装GO確認済み (${IMPLEMENTATION_GO_ENV}=1)。注意: ${LIVE_NOT_READY_NOTE}`);
  console.log("カスタマイズ deploy は ACL を変更しない（read-only shell のまま）。");

  const [syncCmd, buildCmd, ...deployCmds] = plan.commands;
  runCommand(syncCmd);
  runCommand(buildCmd);

  for (let i = 0; i < deployCmds.length; i++) {
    const appKey = plan.order[i];
    try {
      runCommand(deployCmds[i]);
      markCustomizationDeployed(state, appKey);
      saveState(state);
      console.log(`[${appKey}] customizationStatus=deployed を保存`);
    } catch (e) {
      markCustomizationError(state, appKey, e.message || e);
      saveState(state);
      console.error(`[${appKey}] カスタマイズ deploy 失敗: ${e.message || e}`);
      console.error("後続アプリは処理せず中止します（最初の失敗で停止）。");
      throw e;
    }
  }

  console.log("\n3アプリのカスタマイズ deploy 完了。read-only shell のまま（レコード書込みは開放していない）。");
}

async function main() {
  const { mode } = parseCliArgs(process.argv.slice(2));
  if (mode === "dry-run") {
    dryRun();
    return;
  }
  await execute();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
