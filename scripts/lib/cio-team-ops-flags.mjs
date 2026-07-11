/**
 * Team ops v3.2 feature flags（ロールバック弁）· v3.3 warn 昇格
 */
import { isForceStrictActive } from './cio-team-ops-warn-escalation.mjs';

export function readTeamOpsFlags(env = process.env, root = null) {
  const forceStrictTier =
    env.CIO_TURN_TIER_STRICT === '1' || (root ? isForceStrictActive(root) : false);
  return {
    liteLaneEnabled: env.CIO_LITE_LANE !== '0',
    forceStrictTier,
  };
}
