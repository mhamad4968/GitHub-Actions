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
assert.match(cold, /Phase 5f EARLY-WAKE-HANDOFF-COMMIT/);
assert.match(cold, /Phase 6b2 WAKE-HANDOFF-COMMIT（post-heal）/);
// early commit は bootstrap より前
const i5e = cold.indexOf('Phase 5e');
const i6 = cold.indexOf('Phase 6 BOOTSTRAP');
const i5f = cold.indexOf('Phase 5f');
assert.ok(i5e > 0 && i5f > i5e && i6 > i5f, 'order: 5e → 5f → 6');

assert.ok(fs.existsSync(path.join(root, 'scripts/cio-wake-preflight-heal.mjs')));

const allow = read('scripts/lib/cio-wake-handoff-allowlist.mjs');
assert.match(allow, /part-C-full-paste-core\.md/);
assert.match(allow, /checkpoint-archive/);

const preCommit = read('git-hooks/pre-commit');
assert.match(preCommit, /--staged --heal/);

const rag = read('scripts/rag-mirror-canonical-docs.mjs');
assert.match(rag, /--heal/);
assert.match(rag, /healStagedMirrors/);

const temp = read('scripts/lib/cio-session-close-temp-paths.mjs');
assert.match(temp, /tmp-close-report/);

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.scripts['cio:wake:preflight-heal'], 'node scripts/cio-wake-preflight-heal.mjs');

console.log('[test:wake-preflight-heal] OK');
