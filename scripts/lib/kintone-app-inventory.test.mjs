#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  classifyInventory,
  parseManagedAppsFromMarkdown,
} from './kintone-app-inventory.mjs';
import {
  KINTONE_AI_TEAM_ACTIVE_IDS,
  KINTONE_AI_TEAM_RETIRED_IDS,
  KINTONE_AI_TEAM_SCOPE_IDS,
} from './kintone-ai-team-app-registry.mjs';

// Golden counts — bump ONLY in the same commit that changes KINTONE_AI_TEAM_APP_REGISTRY
// (2026-07-28: +769/770 東海支店iPad → active 66→68, scope 78→80). Drift = constitution-gates RED.
const EXPECTED_ACTIVE = 68;
const EXPECTED_RETIRED = 12;
const EXPECTED_SCOPE = 80;
assert.equal(
  KINTONE_AI_TEAM_ACTIVE_IDS.length,
  EXPECTED_ACTIVE,
  `ACTIVE count drift: registry=${KINTONE_AI_TEAM_ACTIVE_IDS.length} expected=${EXPECTED_ACTIVE} — update this golden in the same commit as registry`,
);
assert.equal(
  KINTONE_AI_TEAM_RETIRED_IDS.length,
  EXPECTED_RETIRED,
  `RETIRED count drift: registry=${KINTONE_AI_TEAM_RETIRED_IDS.length} expected=${EXPECTED_RETIRED}`,
);
assert.equal(
  KINTONE_AI_TEAM_SCOPE_IDS.length,
  EXPECTED_SCOPE,
  `SCOPE count drift: registry=${KINTONE_AI_TEAM_SCOPE_IDS.length} expected=${EXPECTED_SCOPE}`,
);
assert.equal(
  EXPECTED_ACTIVE + EXPECTED_RETIRED,
  EXPECTED_SCOPE,
  'EXPECTED_* golden invariant: active+retired must equal scope',
);

const markdown = `
# apps
## アプリ一覧
| アプリ名（論理名） | アプリID | customize | note |
|---|---|---|---|
| **現行アプリ**（正本） | **674** | path | note |
| **旧アプリ** | **594**（削除済） | path | note |
### 次の節
| 対象外 | **999** | path | note |
`;

assert.deepEqual(parseManagedAppsFromMarkdown(markdown), [
  { appId: '594', logicalName: '旧アプリ' },
  { appId: '674', logicalName: '現行アプリ（正本）' },
]);

const first = classifyInventory({
  managedApps: parseManagedAppsFromMarkdown(markdown),
  retiredIds: ['594', '626'],
  scopeIds: ['594', '626', '674', '700'],
  liveApps: [
    { appId: '674', name: '新・PC台帳ver.1' },
    { appId: '700', name: '新規アプリ' },
    { appId: '755', name: '一般利用者のアプリ' },
  ],
});
assert.equal(first.ok, true);
assert.deepEqual(first.retiredAbsent.map((app) => app.appId), ['594', '626']);
assert.deepEqual(first.activePresent.map((app) => app.appId), ['674']);
assert.deepEqual(first.unlistedLive.map((app) => app.appId), ['700']);
assert.equal(first.newSinceLast.length, 0);

const retiredReappearedWithoutTableRow = classifyInventory({
  managedApps: parseManagedAppsFromMarkdown(markdown),
  retiredIds: ['594', '626'],
  scopeIds: ['594', '626', '674'],
  liveApps: [
    { appId: '626', name: '削除済みIDの再出現' },
    { appId: '674', name: '新・PC台帳ver.1' },
  ],
});
assert.equal(retiredReappearedWithoutTableRow.ok, false);
assert.deepEqual(retiredReappearedWithoutTableRow.retiredPresent.map((app) => app.appId), ['626']);
assert.deepEqual(retiredReappearedWithoutTableRow.unlistedLive, []);

const drift = classifyInventory({
  managedApps: parseManagedAppsFromMarkdown(markdown),
  retiredIds: ['594'],
  scopeIds: ['594', '674', '701'],
  liveApps: [{ appId: '594', name: '旧アプリ再作成' }],
  previousLiveApps: [
    { appId: '674', name: '旧名称' },
    { appId: '701', name: '消えたアプリ' },
  ],
});
assert.equal(drift.ok, false);
assert.deepEqual(drift.activeMissing.map((app) => app.appId), ['674']);
assert.deepEqual(drift.retiredPresent.map((app) => app.appId), ['594']);
assert.deepEqual(drift.removedSinceLast.map((app) => app.appId), ['674', '701']);
assert.deepEqual(drift.trackedMissing.map((app) => app.appId), ['701']);

const renamed = classifyInventory({
  managedApps: parseManagedAppsFromMarkdown(markdown),
  retiredIds: ['594'],
  scopeIds: ['594', '674'],
  liveApps: [{ appId: '674', name: '新名称' }],
  previousLiveApps: [{ appId: '674', name: '旧名称' }],
});
assert.deepEqual(renamed.nameChanges, [
  { appId: '674', previousName: '旧名称', currentName: '新名称' },
]);

console.log('[test:kintone-app-inventory] OK');
