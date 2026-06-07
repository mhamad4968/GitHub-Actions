#!/usr/bin/env node
import { fetchJson, getKintoneConfig } from './lib/business-improvement-kintone.mjs';

async function post(code, prop) {
  const { baseUrl, headers } = getKintoneConfig();
  try {
    await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: 700, properties: { [code]: prop } }),
    });
    console.log('OK', code);
  } catch (e) {
    console.error('FAIL', code, e.message);
  }
}

async function main() {
  const dd = (code, label) => ({
    type: 'DROP_DOWN',
    code,
    label,
    required: false,
    noLabel: false,
    options: { x: { label: 'test', index: '0' } },
  });
  await post('eval_effect', dd('eval_effect', 'eval effect'));
  await post('評価効果', dd('評価効果', '評価効果'));
  await post('branch_delegate', {
    type: 'CHECK_BOX',
    code: 'branch_delegate',
    label: 'branch delegate',
    required: false,
    noLabel: false,
    options: { x: { label: 'yes', index: '0' } },
  });
  await post('支店長判断', {
    type: 'CHECK_BOX',
    code: '支店長判断',
    label: '支店長判断',
    required: false,
    noLabel: false,
    options: { x: { label: 'yes', index: '0' } },
  });
}

main();
