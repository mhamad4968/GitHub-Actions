#!/usr/bin/env node
/**
 * list-app-fields.mjs (#S8 / 2026-04-21 制定)
 *
 * 使い方: node scripts/list-app-fields.mjs <app_id>
 *   例:    node scripts/list-app-fields.mjs 627
 *
 * 出力: kintone アプリの全フィールド (subtable 内含む) を type と label 付きで一覧表示。
 * 用途: AGENTS.md §47-7 (仕様議論前の既存フィールド全件確認義務) を満たすための補助。
 */
import 'dotenv/config';

const appId = process.argv[2];
if (!appId) {
  console.error('使い方: node scripts/list-app-fields.mjs <app_id>');
  process.exit(1);
}

const baseUrl = process.env.KINTONE_BASE_URL.replace(/\/+$/, '').replace(/\/k$/, '');
const auth = Buffer.from(
  process.env.KINTONE_USERNAME + ':' + process.env.KINTONE_PASSWORD,
  'utf8'
).toString('base64');
const h = { 'X-Cybozu-Authorization': auth };

try {
  const f = await fetch(baseUrl + '/k/v1/app/form/fields.json?app=' + appId, { headers: h }).then(r => r.json());
  if (f.code) {
    console.error('ERR:', f.code, f.message);
    process.exit(2);
  }
  const props = f.properties || {};
  const codes = Object.keys(props).sort();

  console.log(`=== app=${appId} 全フィールド (${codes.length} 件) ===`);
  console.log('');
  console.log('| code | type | label | required | unique |');
  console.log('|---|---|---|---|---|');
  for (const code of codes) {
    const def = props[code];
    const req = def.required ? '✓' : '';
    const uni = def.unique ? '✓' : '';
    console.log(`| \`${code}\` | ${def.type} | ${def.label || ''} | ${req} | ${uni} |`);
  }

  // サブテーブル内のフィールドも展開
  for (const code of codes) {
    const def = props[code];
    if (def.type === 'SUBTABLE' && def.fields) {
      console.log('');
      console.log(`### サブテーブル \`${code}\` (${def.label || ''}) の内部フィールド`);
      console.log('');
      console.log('| code | type | label |');
      console.log('|---|---|---|');
      for (const [scode, sdef] of Object.entries(def.fields)) {
        console.log(`| \`${scode}\` | ${sdef.type} | ${sdef.label || ''} |`);
      }
    }
  }
} catch (e) {
  console.error('ERR:', e.message || e);
  process.exit(3);
}
