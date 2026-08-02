import assert from 'node:assert/strict';
import { extractScanPlansAfter, isScanPlansVisible } from './scan-plans.mjs';

assert.equal(isScanPlansVisible('2026-08-02', null), true);
assert.equal(isScanPlansVisible('2026-08-02', '2026-08-03'), false);
assert.equal(isScanPlansVisible('2026-08-03', '2026-08-03'), true);
assert.equal(isScanPlansVisible('2026-08-04', '2026-08-03'), true);

const lines = [
  '<!-- scan-plans:after=2026-08-03 -->',
  '- [ ] SKYSEA UI',
  '- [ ] other <!-- scan-plans:after=2026-09-01 -->',
];
assert.equal(extractScanPlansAfter(lines, 1), '2026-08-03');
assert.equal(extractScanPlansAfter(lines, 2), '2026-09-01');
assert.equal(extractScanPlansAfter(['- [ ] plain'], 0), null);

console.log('[scan-plans.test] OK');
