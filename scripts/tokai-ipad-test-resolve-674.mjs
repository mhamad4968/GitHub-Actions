#!/usr/bin/env node
import { resolvePcLedgerCredentialHits } from './lib/tokai-ipad-kintone.mjs';

function rec(id, status) {
  return { $id: { value: String(id) }, pc_status: { value: status }, m365_id: { value: 'm' + id } };
}

const cases = [
  {
    name: 'tayama',
    rows: [rec(106, '廃棄'), rec(272, '利用中')],
    expect: 'OK:272',
  },
  {
    name: 'two-active',
    rows: [rec(1, '利用中'), rec(2, '利用中')],
    expect: 'MULTI_HIT',
  },
  {
    name: 'only-disposed',
    rows: [rec(1, '廃棄'), rec(2, '取消')],
    expect: 'NO_HIT',
  },
  {
    name: 'storage-only',
    rows: [rec(9, '保管')],
    expect: 'OK:9',
  },
  {
    name: 'inuse-over-storage',
    rows: [rec(1, '保管'), rec(2, '利用中')],
    expect: 'OK:2',
  },
];

let fail = 0;
for (const c of cases) {
  const r = resolvePcLedgerCredentialHits(c.rows);
  let got = r.code;
  if (r.code === 'OK') got = 'OK:' + r.record.$id.value;
  if (got !== c.expect) {
    console.error('FAIL', c.name, 'expected', c.expect, 'got', got);
    fail += 1;
  } else {
    console.log('OK', c.name, got);
  }
}
process.exit(fail ? 1 : 0);
