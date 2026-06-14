/**
 * governance 触媒パス検知 — close-git / pre-commit / post-commit 共通
 */
export const GOVERNANCE_TOUCH_RE =
  /^(AGENTS\.md|data\/git-history-guard-manifest\.json|docs\/constitution|\.cursor\/rules\/|package\.json|scripts\/(verify-git-history|sync-git-history|lib\/git-history))/;

export function touchesGovernance(pathsText) {
  return pathsText
    .split(/\r?\n/)
    .filter(Boolean)
    .some((p) => GOVERNANCE_TOUCH_RE.test(p.replace(/\\/g, '/')));
}

export function isManifestGenerationsStale(repoRoot, discoverFn, loadManifestFn) {
  const freshHead = discoverFn(repoRoot, 1)[0];
  if (!freshHead) return false;
  const manifest = loadManifestFn(repoRoot);
  const pinnedHead =
    typeof manifest.generations?.[0] === 'string'
      ? manifest.generations[0]
      : manifest.generations?.[0]?.hash;
  if (!pinnedHead) return true;
  if (freshHead === pinnedHead) return false;
  return !(manifest.generations || []).some((g) => (typeof g === 'string' ? g : g.hash) === freshHead);
}
