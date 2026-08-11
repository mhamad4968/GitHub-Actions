#!/usr/bin/env node
/**
 * R3 unit — kintone-record-clone-post
 */
import assert from 'node:assert/strict';
import {
  SKIP_CLONE_FIELD_TYPES,
  buildClonePostBase,
  ensureRequiredDropdown,
  shouldOmitEmptyScalar,
  shouldSkipCloneField,
  toApiRecordValuesOnly,
} from './kintone-record-clone-post.mjs';

assert.ok(SKIP_CLONE_FIELD_TYPES.includes('RECORD_NUMBER'));
assert.ok(SKIP_CLONE_FIELD_TYPES.includes('RECORD_ID'));

assert.equal(shouldSkipCloneField('レコード番号', { type: 'RECORD_NUMBER', value: '1' }), true);
assert.equal(shouldSkipCloneField('$id', { type: '__ID__', value: '9' }), true);
assert.equal(shouldSkipCloneField('pc_name', { type: 'SINGLE_LINE_TEXT', value: 'JBIS1' }), false);

assert.equal(shouldOmitEmptyScalar('DATE', ''), true);
assert.equal(shouldOmitEmptyScalar('NUMBER', null), true);
assert.equal(shouldOmitEmptyScalar('SINGLE_LINE_TEXT', ''), false);

{
  const api = toApiRecordValuesOnly({
    a: { type: 'DATE', value: '' },
    b: { type: 'SINGLE_LINE_TEXT', value: 'x' },
    c: { type: 'NUMBER', value: '3' },
  });
  assert.equal(api.a, undefined);
  assert.deepEqual(api.b, { value: 'x' });
  assert.deepEqual(api.c, { value: '3' });
}

{
  const base = buildClonePostBase({
    レコード番号: { type: 'RECORD_NUMBER', value: '12' },
    pc_name: { type: 'SINGLE_LINE_TEXT', value: 'JBIS0011' },
    hist: { type: 'SUBTABLE', value: [{ id: '1', value: {} }] },
  });
  assert.equal(base['レコード番号'], undefined);
  assert.equal(base.pc_name.value, 'JBIS0011');
  assert.deepEqual(base.hist.value, []);
}

{
  const withReq = ensureRequiredDropdown({}, 'skysea_manual_done', '未了');
  assert.equal(withReq.skysea_manual_done.value, '未了');
  const filled = ensureRequiredDropdown(
    { skysea_manual_done: { type: 'DROP_DOWN', value: '' } },
    'skysea_manual_done',
    '未了',
  );
  assert.equal(filled.skysea_manual_done.value, '未了');
}

console.log('[kintone-record-clone-post.test] OK');
