#!/usr/bin/env node
import { fetchJson, getKintoneConfig } from './lib/business-improvement-kintone.mjs';

async function post(code) {
  const { baseUrl, headers } = getKintoneConfig();
  try {
    await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        app: 700,
        properties: {
          [code]: {
            type: 'DROP_DOWN',
            code,
            label: code,
            required: false,
            noLabel: false,
            options: { a: { label: 'a', index: '0' } },
          },
        },
      }),
    });
    console.log('OK', code);
  } catch (e) {
    console.error('FAIL', code, e.message);
  }
}

async function main() {
  for (const code of ['eval_ingenuity', 'eval_effort', 'eval_overall', 'branch_delegate', 'foo_bar']) {
    await post(code);
  }
}

main();
