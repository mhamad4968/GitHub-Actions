#!/usr/bin/env node
/**
 * #S-WAKE-ORDER-01 配線テスト — cold-start に 5e/5f があり、関連スクリプトが実在すること
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const cold = read('scripts/cio-session-cold-start.mjs');
assert.match(cold, /Phase 5e WAKE-PREFLIGHT-HEAL/);
assert.match(cold, /cio:wake:preflight-heal/);
assert.match(cold, /Phase 5e2 CHECKPOINT-GIT-HEAL（pre-early-wake stamp）/);
assert.match(cold, /Phase 5f EARLY-WAKE-HANDOFF-COMMIT/);
assert.match(cold, /Phase 6b2 WAKE-HANDOFF-COMMIT（post-heal）/);
// early stamp → early commit は bootstrap より前（D-CHKPT-02 ancestor 偽陽性防止）
const i5e = cold.indexOf('Phase 5e WAKE-PREFLIGHT-HEAL');
const i5e2 = cold.indexOf('Phase 5e2 CHECKPOINT-GIT-HEAL');
const i6 = cold.indexOf('Phase 6 BOOTSTRAP');
const i5f = cold.indexOf('Phase 5f EARLY-WAKE-HANDOFF-COMMIT');
assert.ok(i5e > 0 && i5e2 > i5e && i5f > i5e2 && i6 > i5f, 'order: 5e → 5e2 → 5f → 6');

assert.ok(fs.existsSync(path.join(root, 'scripts/cio-wake-preflight-heal.mjs')));

const handoffCommit = read('scripts/cio-wake-handoff-commit.mjs');
assert.match(handoffCommit, /reexportBridgeAfterLock/);
assert.match(handoffCommit, /healPackageLockBeforeHandoff/);
const iLockCall = handoffCommit.indexOf('if (healPackageLockBeforeHandoff())');
const iAllowCall = handoffCommit.indexOf('const paths = dirtyAllowlist()');
assert.ok(iLockCall > 0 && iAllowCall > iLockCall, 'order: lock heal before allowlist handoff');
assert.match(handoffCommit, /re-export bridge after lock heal/);

const pkg = JSON.parse(read('package.json'));
assert.ok(pkg.scripts['test:wake-handoff-allowlist'], 'package.json test:wake-handoff-allowlist');
assert.ok(pkg.scripts['verify:session-close-handoff-freshness:wake'], 'package.json :wake alias');
assert.equal(pkg.scripts['cio:wake:preflight-heal'], 'node scripts/cio-wake-preflight-heal.mjs');

const allow = read('scripts/lib/cio-wake-handoff-allowlist.mjs');
assert.match(allow, /part-C-full-paste-core\.md/);
assert.match(allow, /checkpoint-archive/);
assert.match(allow, /isWakeAdjacentGrandparentFold/);

const preCommit = read('git-hooks/pre-commit');
assert.match(preCommit, /--staged --heal/);

const rag = read('scripts/rag-mirror-canonical-docs.mjs');
assert.match(rag, /--heal/);
assert.match(rag, /healStagedMirrors/);

const temp = read('scripts/lib/cio-session-close-temp-paths.mjs');
assert.match(temp, /tmp-close\(\?:-report\)\?-\\d\{4\}/);

const healSrc = read('scripts/cio-wake-preflight-heal.mjs');
assert.match(healSrc, /TMP_CLOSE_PURGE_RE/);
assert.match(healSrc, /tmp-close\(\?:-report\)\?-\\d\{4\}/);

console.log('[test:wake-preflight-heal] OK');
