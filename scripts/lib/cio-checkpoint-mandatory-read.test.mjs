#!/usr/bin/env node
/** checkpoint mandatory-read — 凍結ゾーン minChars と rollup 後正当短さの回帰 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCheckpointMandatoryRead } from './cio-checkpoint-mandatory-read.mjs';
import {
  repairCheckpointBootstrapBlock,
  validateCheckpointFreezeZone,
} from './cio-handoff-template.mjs';

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

// CRLF の `\r` を字数に足すと 2800 を超えて pad がスキップされる回帰（cold-start rollup NG）
const crlfTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-crlf-'));
const crlfCp = path.join(crlfTmp, 'chat-sessions/checkpoint-latest.md');
const crlfData = path.join(crlfTmp, 'data/cio-handoff-template.json');
fs.mkdirSync(path.dirname(crlfCp), { recursive: true });
fs.mkdirSync(path.dirname(crlfData), { recursive: true });
fs.copyFileSync(path.join(repoRoot, 'data/cio-handoff-template.json'), crlfData);
const lfLines = [
  '# 復元チェックポイント（最新）',
  '**最終更新**: 2026-08-15 09:30 JST',
  '**次の1手**: CRLF minChars regression',
  '**Git**: `deadbeef`',
  '**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`',
  '**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`',
  '## クローズ済み',
  'closed-v1',
  '## 保留・その他の制約',
  'none',
  '## セッション切替後の自律復元',
  'mandatory-read-gate.mjs verify:session-close-git-warn npm run session:bootstrap',
];
while (lfLines.length < 36) lfLines.push(`memo-line-${lfLines.length}`);
let lfBody = lfLines.join('\n');
const targetLf = 2770;
if (lfBody.length < targetLf) lfBody += `\n${'x'.repeat(targetLf - lfBody.length - 1)}`;
assert.ok(lfBody.replace(/\r/g, '').length < 2800, 'fixture LF length must be under minChars');
fs.writeFileSync(crlfCp, `${lfBody.replace(/\n/g, '\r\n')}\r\n## 2026-08-15\r\n- kept\r\n`, 'utf8');
const before = validateCheckpointMandatoryRead(crlfTmp);
assert.equal(before.ok, false, `CRLF short fixture should fail before repair: ${before.issues.join('; ')}`);
assert.ok(before.preambleChars < 2800);
const crlfRawLen = fs.readFileSync(crlfCp, 'utf8').split(/^## \d{4}-\d{2}-\d{2}/m)[0].length;
assert.ok(crlfRawLen > before.preambleChars, 'raw CRLF preamble must be longer than LF-normalized');
assert.ok(crlfRawLen >= 2800, 'fixture should reproduce Windows CRLF counting past minChars');
const rep = repairCheckpointBootstrapBlock(crlfTmp);
assert.equal(rep.ok, true, `repair failed: ${rep.reason || ''}`);
assert.ok(rep.repaired && rep.filled.includes('minChars-pad'), `expected minChars-pad, got ${rep.filled.join(',')}`);
const after = validateCheckpointMandatoryRead(crlfTmp);
assert.equal(after.ok, true, `after CRLF repair: ${after.issues.join('; ')}`);
assert.ok(after.preambleChars >= 2800);

// 必須見出しが日付セクションより後ろに落ちたケース（夜締め CRLF 前置の再発）
const hoistTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-hoist-'));
const hoistCp = path.join(hoistTmp, 'chat-sessions/checkpoint-latest.md');
const hoistData = path.join(hoistTmp, 'data/cio-handoff-template.json');
const hoistTplDir = path.join(hoistTmp, 'chat-sessions/templates');
fs.mkdirSync(path.dirname(hoistCp), { recursive: true });
fs.mkdirSync(path.dirname(hoistData), { recursive: true });
fs.mkdirSync(hoistTplDir, { recursive: true });
fs.copyFileSync(path.join(repoRoot, 'data/cio-handoff-template.json'), hoistData);
for (const f of [
  'checkpoint-freeze-zone.template.md',
  'handoff-log-block.template.md',
  'HANDOFF-HUMAN-block.template.txt',
]) {
  fs.copyFileSync(
    path.join(repoRoot, 'chat-sessions/templates', f),
    path.join(hoistTplDir, f),
  );
}
const broken = [
  '# 復元チェックポイント（最新）',
  '**最終更新**: 2026-08-22 JST',
  '**次の1手**: hoist regression',
  '**Git**: `deadbeef`',
  '## セッション切替後の自律復元',
  'mandatory-read-gate.mjs verify:session-close-git-warn npm run session:bootstrap',
  '## 2026-08-21 夜',
  '- night history wrongly before closed',
  '## クローズ済み（`data/cio-project-closures.json` — 9件）',
  'closed-v1 list',
  '## 保留・その他の制約',
  '| 状態 | 内容 |',
  '| **688** | heat外 |',
  '## 2026-08-21',
  '- morning',
].join('\n');
fs.writeFileSync(hoistCp, broken.replace(/\n/g, '\r\n'), 'utf8');
const beforeHoist = validateCheckpointFreezeZone(hoistTmp);
assert.equal(beforeHoist.ok, false, 'broken fixture must fail freeze validate');
assert.ok(
  beforeHoist.issues.some((i) => i.includes('クローズ済み') || i.includes('保留')),
  `expected missing heading issues, got: ${beforeHoist.issues.join('; ')}`,
);
const hoistRep = repairCheckpointBootstrapBlock(hoistTmp);
assert.equal(hoistRep.ok, true);
assert.ok(
  hoistRep.filled.some((f) => f.startsWith('hoist:## クローズ済み')),
  `expected hoist closed, got ${hoistRep.filled.join(',')}`,
);
assert.ok(
  hoistRep.filled.some((f) => f.startsWith('hoist:## 保留')),
  `expected hoist hold, got ${hoistRep.filled.join(',')}`,
);
const afterHoist = validateCheckpointFreezeZone(hoistTmp);
assert.equal(afterHoist.ok, true, `after hoist: ${afterHoist.issues.join('; ')}`);
const repairedText = fs.readFileSync(hoistCp, 'utf8');
const dated = repairedText.search(/^## \d{4}-\d{2}-\d{2}/m);
const head = dated < 0 ? repairedText : repairedText.slice(0, dated);
assert.ok(head.includes('## クローズ済み'), 'closed must be in preamble');
assert.ok(head.includes('## 保留・その他の制約'), 'hold must be in preamble');

console.log('[verify:cio-checkpoint-mandatory-read] OK');
