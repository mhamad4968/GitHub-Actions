import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTurnStartGoal } from './lib/cio-turn-start-tier.mjs';

test('empty override keeps checkpoint Goal', () => {
  const r = resolveTurnStartGoal('現場責任者が App 756 で実入力', '');
  assert.equal(r.overridden, false);
  assert.equal(r.goal, '現場責任者が App 756 で実入力');
  assert.equal(r.checkpointGoal, '現場責任者が App 756 で実入力');
});

test('--goal overrides checkpoint without rewriting it', () => {
  const r = resolveTurnStartGoal('現場責任者が App 756 で実入力', '683 印刷下枠の配線整理件数');
  assert.equal(r.overridden, true);
  assert.equal(r.goal, '683 印刷下枠の配線整理件数');
  assert.equal(r.checkpointGoal, '現場責任者が App 756 で実入力');
});

test('missing checkpoint falls back to read hint', () => {
  const r = resolveTurnStartGoal(null, '');
  assert.equal(r.overridden, false);
  assert.equal(r.goal, '(checkpoint-latest.md を Read)');
});
