import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * When editing data/kintone-ai-team-app-registry.json active/retired lists,
 * bump EXPECTED_* golden counts in scripts/lib/kintone-app-inventory.test.mjs
 * in the SAME commit — otherwise constitution-gates RED (e.g. 68 !== 66).
 */
const registryPath = fileURLToPath(
  new URL('../../data/kintone-ai-team-app-registry.json', import.meta.url),
);

function normalizeIds(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  const ids = value.map(String);
  if (ids.some((id) => !/^\d+$/.test(id))) {
    throw new Error(`${label} must contain numeric app IDs only`);
  }
  if (new Set(ids).size !== ids.length) throw new Error(`${label} contains duplicate app IDs`);
  return ids.sort((a, b) => Number(a) - Number(b));
}

export function loadKintoneAiTeamAppRegistry() {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  if (registry.version !== 1) throw new Error(`unsupported kintone AI registry version: ${registry.version}`);
  if (registry.outsideScopePolicy !== 'ignore') {
    throw new Error('kintone AI registry outsideScopePolicy must be "ignore"');
  }

  const activeAppIds = normalizeIds(registry.activeAppIds, 'activeAppIds');
  const retiredAppIds = normalizeIds(registry.retiredAppIds, 'retiredAppIds');
  const active = new Set(activeAppIds);
  const overlap = retiredAppIds.filter((id) => active.has(id));
  if (overlap.length) throw new Error(`active/retired app ID overlap: ${overlap.join(', ')}`);

  return {
    ...registry,
    activeAppIds,
    retiredAppIds,
    scopeIds: [...activeAppIds, ...retiredAppIds].sort((a, b) => Number(a) - Number(b)),
  };
}

export const KINTONE_AI_TEAM_APP_REGISTRY = loadKintoneAiTeamAppRegistry();
export const KINTONE_AI_TEAM_ACTIVE_IDS = KINTONE_AI_TEAM_APP_REGISTRY.activeAppIds;
export const KINTONE_AI_TEAM_RETIRED_IDS = KINTONE_AI_TEAM_APP_REGISTRY.retiredAppIds;
export const KINTONE_AI_TEAM_SCOPE_IDS = KINTONE_AI_TEAM_APP_REGISTRY.scopeIds;
