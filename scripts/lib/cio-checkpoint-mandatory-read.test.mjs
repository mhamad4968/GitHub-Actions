#!/usr/bin/env node
/** checkpoint mandatory-read — 凍結ゾーン minChars と rollup 後正当短さの回帰 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCheckpointMandatoryRead } from './cio-checkpoint-mandatory-read.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const live = validateCheckpointMandatoryRead(repoRoot);
assert.equal(live.ok, true, `live checkpoint: ${live.issues.join('; ')}`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-mr-'));
const cpPath = path.join(tmp, 'chat-sessions/checkpoint-latest.md');
const dataPath = path.join(tmp, 'data/cio-handoff-template.json');
fs.mkdirSync(path.dirname(cpPath), { recursive: true });
fs.mkdirSync(path.dirname(dataPath), { recursive: true });
fs.copyFileSync(path.join(repoRoot, 'data/cio-handoff-template.json'), dataPath);

const compactPreamble = fs.readFileSync(path.join(repoRoot, 'chat-sessions/checkpoint-latest.md'), 'utf8');
const lines = compactPreamble.split('\n');
const datedIdx = lines.findIndex((l, i) => i > 0 && /^## \d{4}-\d{2}-\d{2}/.test(l));
const preambleOnly = (datedIdx < 0 ? lines : lines.slice(0, datedIdx)).join('\n');
fs.writeFileSync(cpPath, preambleOnly, 'utf8');

const compact = validateCheckpointMandatoryRead(tmp);
assert.equal(compact.ok, true, `compact preamble (${compact.preambleChars} chars): ${compact.issues.join('; ')}`);
assert.ok(compact.preambleChars >= 2800, 'compact preamble should pass minChars 2800');
assert.ok(compact.preambleChars < 4000, 'regression: old 4000 full-file gate would false-NG compact preamble');

fs.writeFileSync(cpPath, '# stub\n**最終更新**: 2026-01-01\n', 'utf8');
const stub = validateCheckpointMandatoryRead(tmp);
assert.equal(stub.ok, false);
assert.ok(stub.issues.some((i) => i.includes('short') || i.includes('missing')));

console.log('[verify:cio-checkpoint-mandatory-read] OK');
