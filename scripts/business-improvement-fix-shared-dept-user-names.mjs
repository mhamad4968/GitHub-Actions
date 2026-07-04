#!/usr/bin/env node
/**
 * 本社部共有アカウントの kintone 表示名を「〇〇部共有」に揃える
 */
import { getKintoneConfig, fetchJson } from './lib/business-improvement-kintone.mjs';

const TARGETS = [
  { code: 'soumu', name: '総務部共有' },
  { code: 'keiri', name: '経理部共有' },
  { code: 'kensyu', name: '人事研修部共有' },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const updates = [];

  for (const t of TARGETS) {
    const j = await fetchJson(`${baseUrl}/v1/users.json?codes[]=${encodeURIComponent(t.code)}`, {
      method: 'GET',
      headers: { ...headers, 'Content-Type': undefined },
    });
    const cur = j.users?.[0];
    if (!cur) {
      console.warn('[shared-dept-names] skip not found:', t.code);
      continue;
    }
    if (cur.name === t.name) {
      console.log('[shared-dept-names] ok:', t.code, t.name);
      continue;
    }
    updates.push({ code: t.code, from: cur.name, to: t.name });
  }

  if (!updates.length) {
    console.log(JSON.stringify({ updated: 0 }, null, 2));
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, updates }, null, 2));
    return;
  }

  await fetchJson(`${baseUrl}/v1/users.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      users: updates.map((u) => ({ code: u.code, name: u.to })),
    }),
  });

  console.log(JSON.stringify({ updated: updates.length, updates }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
