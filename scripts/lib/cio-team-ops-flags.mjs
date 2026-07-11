/**
 * Team ops v3.2 feature flags（ロールバック弁）
 */
export function readTeamOpsFlags(env = process.env) {
  return {
    liteLaneEnabled: env.CIO_LITE_LANE !== '0',
    forceStrictTier: env.CIO_TURN_TIER_STRICT === '1',
  };
}
