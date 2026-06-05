#!/usr/bin/env node
import assert from 'node:assert/strict';
import { formatJbis, nextJbisSlot, STATUS_ACTIVE } from './lib/apple-id-kintone.mjs';

function rec(appleId, userName, status) {
  return {
    apple_id: { value: appleId },
    user_name: userName ? { value: userName } : undefined,
    status: { value: status || STATUS_ACTIVE },
    $id: { value: '1' },
    $revision: { value: '1' },
  };
}

// 1) 039 未割当プールが最優先
{
  const slot = nextJbisSlot([
    rec('jbis.933@icloud.com', ''),
    rec('jbis.039@icloud.com', ''),
    rec('jbis.040@icloud.com', '山田\u3000太郎'),
  ]);
  assert.equal(slot.n, 39);
  assert.equal(slot.apple_id, 'jbis.039@icloud.com');
  assert.equal(slot.isNew, false);
}

// 2) 039 が埋まっていれば 040（041 スキップは 040 次）
{
  const slot = nextJbisSlot([
    rec('jbis.039@icloud.com', '早坂\u3000翔'),
    rec('jbis.040@icloud.com', ''),
  ]);
  assert.equal(slot.n, 40);
  assert.equal(slot.isNew, false);
}

// 3) 039-933 がすべて使用中なら 934 を新規作成
{
  const rows = [];
  for (let n = 39; n <= 933; n++) {
    rows.push(rec(formatJbis(n), '利用者\u3000' + n));
  }
  const slot = nextJbisSlot(rows);
  assert.equal(slot.n, 934);
  assert.equal(slot.isNew, true);
}

// 4) プール削除後は 039 を新規作成
{
  const slot = nextJbisSlot([rec('kent.test@icloud.com', 'テスト\u3000太郎')]);
  assert.equal(slot.n, 39);
  assert.equal(slot.isNew, true);
}

console.log('OK: apple-id jbis slot tests (4 cases)');
