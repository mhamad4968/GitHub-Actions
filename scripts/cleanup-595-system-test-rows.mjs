#!/usr/bin/env node
/** 595 システム／テスト行の削除（315–317） */
import 'dotenv/config';

const IDS = ['315', '316', '317'];

let baseUrl = process.env.KINTONE_BASE_URL.replace(/\/+$/, '').replace(/\/k$/, '');
const auth = Buffer.from(
  `${process.env.KINTONE_USERNAME}:${process.env.KINTONE_PASSWORD}`,
  'utf8',
).toString('base64');
const headers = {
  'X-Cybozu-Authorization': auth,
  'Content-Type': 'application/json',
};

const res = await fetch(`${baseUrl}/k/v1/records.json`, {
  method: 'DELETE',
  headers,
  body: JSON.stringify({ app: 595, ids: IDS }),
});
const text = await res.text();
if (!res.ok) throw new Error(`${res.status} ${text}`);
console.log('[cleanup-595-system-rows] deleted', IDS.join(','));
