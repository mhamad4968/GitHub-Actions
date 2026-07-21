#!/usr/bin/env node
/**
 * 実行予算 Ver.02 — Space 56 に3アプリを作成（Phase 2）。
 *
 * 既定は DRY-RUN（env 不要・ネットワークアクセスなし・決定的な計画出力のみ）。
 * 実書込みは正確に `--execute` を指定した場合だけ。--execute と --dry-run の
 * 併用は拒否する。
 *
 * 安全設計:
 * - app1 → app2 → app3 を厳密に直列処理（並行 deploy なし）。
 * - App 735/736 は状態・既存名解決・書込み直前の三重ガードで即 abort。
 * - アプリ作成直後と deploy 成功後に state を保存し、途中失敗しても ID を失わない。
 * - 再実行時は正確な名前一致と state で照合し、不一致は abort（推測しない）。
 * - 部分作成アプリの自動削除・自動ロールバックはしない。
 * - Phase6: ACL は FAIL-CLOSED READ-ONLY（everyone 閲覧のみ、add/edit/delete/
 *   import/export=false、appEditable=false）。fields→settings→ACL をすべて
 *   preview に適用してから唯一の deploy を実行するため、書込み可能な状態が
 *   一瞬も LIVE に出ない（unsafe direct-write window なし）。
 * - deploy は ACL 適用後の最新 revision を使う（stale revision 防止）。
 * - 「実行予算管理者」グループコードは未確認のため設定せず、レコード条件ACL・
 *   直UI保存ガード（App1 save executor）は後続フェーズで個別承認。
 */
import {
  ACL_DEFERRED_NOTE,
  APP_DEFS,
  APP_ORDER,
  IMPLEMENTATION_GO_ENV,
  LIVE_NOT_READY_NOTE,
  SHELL_ONLY_NOTE,
  SPACE_ID,
  THREAD_ID,
  applyAppAcl,
  applyAppSettings,
  applyMissingFormFields,
  assertImplementationGo,
  buildDryRunPlan,
  createApp,
  deployAppAndWait,
  findAppByName,
  getKintoneConfig,
  loadState,
  markCreated,
  markDeployed,
  markError,
  parseCliArgs,
  reconcileExistingApp,
  saveState,
  validateAllFieldFiles,
  verifyPreviewApp,
} from "./lib/jikkou-yosan-v2/kintone.mjs";

async function executeApps() {
  // Phase5 hardening (H2): 認証情報の読込・ネットワークアクセスより前に、
  // 明示的な実装GO（env）を要求する。
  assertImplementationGo();
  console.log(`実装GO確認済み (${IMPLEMENTATION_GO_ENV}=1)。注意: ${LIVE_NOT_READY_NOTE}`);

  // 書込み前にフィールドJSONを全アプリ分静的検証する（1件でも不正なら何も書かない）。
  const validated = validateAllFieldFiles();
  const ctx = getKintoneConfig();
  const state = loadState();

  for (const appKey of APP_ORDER) {
    const def = APP_DEFS[appKey];
    const entry = state.apps[appKey];
    console.log(`\n[${appKey}] "${def.name}" 開始 (state=${entry.status})`);

    try {
      const existing = await findAppByName(ctx, def.name);
      const decision = reconcileExistingApp(entry, existing);

      if (decision.action === "skip") {
        console.log(`[${appKey}] deploy 済み appId=${decision.appId} — スキップ`);
        continue;
      }

      let appId = decision.appId;
      if (decision.action === "create") {
        appId = await createApp(ctx, def);
        console.log(`[${appKey}] 作成 appId=${appId}`);
        markCreated(state, appKey, appId);
        saveState(state); // 直後保存: 以降の失敗でも新IDを失わない
      } else if (decision.action === "verify-preview") {
        // 未deployのpreview専用アプリは名前検索(/k/v1/apps.json)に出ない。
        // preview settings の正確な名前一致を検証してから再開（不一致は abort）。
        await verifyPreviewApp(ctx, appId, def.name);
        console.log(`[${appKey}] preview 検証OK appId=${appId} を再開（作成しない）`);
        markCreated(state, appKey, appId);
        saveState(state);
      } else {
        console.log(`[${appKey}] 既存 appId=${appId} を再開（作成しない）`);
        markCreated(state, appKey, appId);
        saveState(state);
      }

      // resume-safe: preview の既存フィールドを照合し、欠落コードだけ POST する。
      // 部分適用済みの appId を再開しても field-exists で落ちない。
      const fieldsResult = await applyMissingFormFields(ctx, appId, validated[appKey].properties);
      console.log(
        `[${appKey}] フィールド適用 applied=${fieldsResult.appliedCount} skipped(existing)=${fieldsResult.skippedCodes.length} (declared total=${validated[appKey].counts.total})`,
      );

      const settingsRev = await applyAppSettings(ctx, appId, def);
      console.log(`[${appKey}] 設定適用 revision=${settingsRev}`);

      // ACL は preview の最後の変更。deploy には ACL 適用後の最新 revision を
      // 使い、stale revision による deploy を防ぐ。
      const aclRev = await applyAppAcl(ctx, appId);
      console.log(`[${appKey}] ACL 適用 revision=${aclRev} — ${ACL_DEFERRED_NOTE}`);

      const deployRev = aclRev ?? settingsRev;
      await deployAppAndWait(ctx, appId, deployRev);
      markDeployed(state, appKey);
      saveState(state);
      console.log(
        `[${appKey}] deploy SUCCESS appId=${appId} URL=${ctx.baseUrl}/k/${appId}/ — read-only shell (${SHELL_ONLY_NOTE})`,
      );
    } catch (e) {
      markError(state, appKey, e.message || e);
      saveState(state);
      console.error(`[${appKey}] 失敗: ${e.message || e}`);
      console.error("後続アプリは処理せず中止します。部分作成アプリは削除しません（state を確認のうえ再実行で再開）。");
      throw e;
    }
  }

  console.log(`\n3アプリ処理完了（fail-closed read-only shells）。${SHELL_ONLY_NOTE}`);
}

function dryRun() {
  const plan = buildDryRunPlan();
  console.log("DRY-RUN: ネットワークアクセスなし・認証情報不要。書込みは --execute のみ。");
  console.log(`space=${SPACE_ID} thread=${THREAD_ID} 対象=${APP_ORDER.length}アプリ（直列）`);
  console.log(`ACL: ${ACL_DEFERRED_NOTE}`);
  console.log(`SHELL-ONLY: ${SHELL_ONLY_NOTE}`);
  console.log(`LIVE readiness: ${LIVE_NOT_READY_NOTE} (execute には ${IMPLEMENTATION_GO_ENV}=1 が必要)`);
  console.log(JSON.stringify(plan, null, 2));
}

async function main() {
  const { mode } = parseCliArgs(process.argv.slice(2));
  if (mode === "dry-run") {
    dryRun();
    return;
  }
  await executeApps();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
