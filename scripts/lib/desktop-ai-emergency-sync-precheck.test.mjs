#!/usr/bin/env node
/**
 * Desktop sync precheck 定数・契約（ライブ RAM/Notepad は触らない）
 *
 *   npm run test:desktop-sync-precheck
 */
import assert from 'node:assert/strict';
import {
  RAM_INFO_PERCENT,
  RAM_WARN_PERCENT,
  NOTEPAD_MIRROR_MD_NAMES,
} from './desktop-ai-emergency-sync-precheck.mjs';

assert.equal(RAM_INFO_PERCENT, 80);
assert.equal(RAM_WARN_PERCENT, 90);
assert.ok(RAM_INFO_PERCENT < RAM_WARN_PERCENT);
assert.deepEqual(NOTEPAD_MIRROR_MD_NAMES, ['24-handoff-log.md', '25-checkpoint-latest.md']);

console.log('[test:desktop-sync-precheck] OK INFO=80 WARN=90 LITE推奨対象=24/25');
