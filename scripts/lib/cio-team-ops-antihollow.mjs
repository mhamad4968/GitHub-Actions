/**
 * Team ops v3.2 — anti-hollow runtime probes
 */
import {
  shouldFailStrictWithout5038,
  validateSkipReason,
} from './cio-team-ops-skip-quality.mjs';
import { quickTierBlockedByDiff } from './cio-team-ops-git-scope.mjs';

export function runAntihollowProbes() {
  const issues = [];

  if (!shouldFailStrictWithout5038(null, [])) {
    issues.push('strict-without-5038: empty stamp/evidence should fail');
  }
  if (shouldFailStrictWithout5038({ stampedAt: new Date().toISOString() }, [])) {
    issues.push('strict-without-5038: fresh stamp should pass');
  }

  const badSkip = validateSkipReason('形式のみ');
  if (badSkip.ok) issues.push('skip-quality: banned phrase should fail');

  const shortSkip = validateSkipReason('短い');
  if (shortSkip.ok) issues.push('skip-quality: short reason should fail');

  const goodSkip = validateSkipReason('docs/runbooks/foo.md の typo のみ・customize 非接触');
  if (!goodSkip.ok) issues.push(`skip-quality: valid reason rejected: ${goodSkip.message}`);

  if (!quickTierBlockedByDiff('+line\n')) {
    issues.push('quick-tier: non-empty diff should block');
  }
  if (quickTierBlockedByDiff('')) {
    issues.push('quick-tier: empty diff should allow');
  }

  return { ok: issues.length === 0, issues };
}
