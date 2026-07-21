/**
 * 実行予算 Ver.02 Phase 6 — カスタマイズJS deploy の計画（planner）。
 *
 * このモジュールは純粋関数のみ: 資格情報を読まず、fetch もしない。
 * 実行（--execute）は scripts/jikkou-yosan-v2-deploy-customizations.mjs が
 * 既存の scripts/deploy-customization.js を1アプリずつ順番に呼び出す。
 *
 * 安全設計:
 * - 既定は DRY-RUN（state を読んで計画を出力するだけ・ネットワークなし）。
 * - --execute は JIKKOU_YOSAN_V2_IMPLEMENTATION_GO=1（完全一致）が必須。
 * - 3アプリ全部の appId が非null・非735/736・schema status=deployed のとき
 *   だけ実行可能（部分実行しない・最初の失敗で停止）。
 * - 対象パスは customize/jikkou-yosan-v2-app{1,2,3} のみ。customize/736 には
 *   一切触れない。
 */
import { assertAllowedAppId, FORBIDDEN_APP_IDS } from "./guard.mjs";
import { APP_DEFS, APP_ORDER } from "./kintone.mjs";

/** deploy 対象のカスタマイズJS（repo ルート相対・固定）。customize/736 は絶対に含めない。 */
export const CUSTOMIZE_JS_PATHS = Object.freeze({
  app1: "customize/jikkou-yosan-v2-app1/desktop.js",
  app2: "customize/jikkou-yosan-v2-app2/desktop.js",
  app3: "customize/jikkou-yosan-v2-app3/desktop.js",
});

export const SYNC_SCRIPT = "scripts/jikkou-yosan-v2-sync-app-ids.mjs";
export const BUILD_SCRIPT = "scripts/jikkou-yosan-v2-build-desktop.mjs";
export const DEPLOY_SCRIPT = "scripts/deploy-customization.js";

/**
 * state から1アプリ分の readiness を評価する（純粋・ネットワークなし）。
 * blockers が空のときだけ ready=true。
 */
export function evaluateAppReadiness(appKey, entry) {
  const blockers = [];
  const appId = entry?.appId ?? null;
  if (appId === null) {
    blockers.push(`${appKey}: appId is null (schema shell not created yet)`);
  } else {
    const n = Number(appId);
    if (!Number.isSafeInteger(n) || n <= 0) {
      blockers.push(`${appKey}: invalid appId ${JSON.stringify(appId)}`);
    } else if (FORBIDDEN_APP_IDS.includes(n)) {
      blockers.push(`${appKey}: appId ${n} is FORBIDDEN (App 735/736 must never be touched)`);
    }
  }
  if (entry?.status !== "deployed") {
    blockers.push(
      `${appKey}: schema status must be "deployed" (got "${entry?.status ?? "missing"}")`,
    );
  }
  return {
    key: appKey,
    name: APP_DEFS[appKey].name,
    appId,
    schemaStatus: entry?.status ?? null,
    customizationStatus: entry?.customizationStatus ?? "unconfigured",
    customizeJsPath: CUSTOMIZE_JS_PATHS[appKey],
    ready: blockers.length === 0,
    blockers,
  };
}

/**
 * DRY-RUN 計画を組み立てる（純粋・env/fetch なし）。
 * appId が未確定のアプリはプレースホルダで表示し、executable=false とする。
 */
export function buildCustomizationDeployPlan(state) {
  const apps = APP_ORDER.map((appKey) => evaluateAppReadiness(appKey, state.apps?.[appKey]));
  const blockers = apps.flatMap((a) => a.blockers);

  const commands = [
    {
      step: 1,
      description: "sync app IDs into App1 sources (markers only; aborts on 735/736)",
      argv: ["node", SYNC_SCRIPT],
    },
    {
      step: 2,
      description: "build App1 desktop bundle (never writes customize/736)",
      argv: ["node", BUILD_SCRIPT],
    },
    ...APP_ORDER.map((appKey, i) => {
      const readiness = apps[i];
      const idArg = readiness.appId === null ? `<${appKey.toUpperCase()}_ID>` : String(readiness.appId);
      return {
        step: 3 + i,
        description: `deploy customization JS to ${appKey} (${readiness.name})`,
        argv: ["node", DEPLOY_SCRIPT, idArg, CUSTOMIZE_JS_PATHS[appKey]],
      };
    }),
  ];

  return {
    mode: "dry-run",
    network: "none",
    forbiddenAppIds: [...FORBIDDEN_APP_IDS],
    order: [...APP_ORDER],
    apps,
    commands,
    executable: blockers.length === 0,
    blockers,
    note:
      "customization deploy keeps apps fail-closed read-only: it never changes ACL, so B (deploy customizations while read-only) does not open a record-write window; C (create records) stays NO until the App1 save executor and record ACL are approved",
  };
}

/**
 * --execute 前の厳格ゲート。1件でも blocker があれば例外で全体を拒否する
 * （部分実行しない）。検証は認証情報の読込・ネットワークより前に行うこと。
 */
export function assertExecutableCustomizationPlan(state) {
  const plan = buildCustomizationDeployPlan(state);
  if (!plan.executable) {
    throw new Error(
      [
        "Customization deploy refused (fail-closed):",
        ...plan.blockers.map((b) => `- ${b}`),
        "Run the schema create script first and verify state before retrying.",
      ].join("\n"),
    );
  }
  for (const app of plan.apps) {
    assertAllowedAppId(app.appId, `deploy-customizations(${app.key})`);
  }
  return plan;
}
