#!/usr/bin/env node
/**
 * 595 concurrent_posts.cp_title に「室長」「室員」を追加（既存維持）
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-595-cp-title-add-shitsu.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-595-cp-title-add-shitsu.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const APP = '595';
const ADD = ['室長', '室員'];

async function waitDeploy(client) {
  for (let i = 0; i < 40; i++) {
    const st = await client.app.getDeployStatus({ apps: [APP] });
    const s = st.apps?.[0]?.status;
    console.log('[595] deploy', s);
    if (s === 'SUCCESS') return;
    if (s === 'FAIL' || s === 'CANCEL') throw new Error(`deploy ${s}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('deploy timeout');
}

async function main() {
  const client = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_BASE_URL,
    auth: {
      username: process.env.KINTONE_USERNAME,
      password: process.env.KINTONE_PASSWORD,
    },
  });

  const form = await client.app.getFormFields({ app: APP });
  const st = form.properties.concurrent_posts;
  const title = st?.fields?.cp_title;
  if (!st || st.type !== 'SUBTABLE' || !title || title.type !== 'DROP_DOWN') {
    throw new Error('concurrent_posts.cp_title is not DROP_DOWN');
  }

  const nextOpts = { ...(title.options || {}) };
  let maxIndex = Math.max(
    0,
    ...Object.values(nextOpts).map((o) => Number(o.index) || 0),
  );
  const toAdd = [];
  for (const label of ADD) {
    if (nextOpts[label]) continue;
    maxIndex += 1;
    nextOpts[label] = { label, index: String(maxIndex) };
    toAdd.push(label);
  }

  const summary = {
    at: new Date().toISOString(),
    apply: APPLY,
    before: Object.keys(title.options || {}).sort(),
    toAdd,
    after: Object.keys(nextOpts).sort(),
  };
  const outDir = path.join(ROOT, 'logs', 'employee-roster');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(
    outDir,
    `595-cp-title-add-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  console.log('json=', outPath);

  if (!APPLY) {
    console.log('[595-cp-title] DRY-RUN');
    return;
  }
  if (!toAdd.length) {
    console.log('[595-cp-title] already present — no change');
    return;
  }

  await client.app.updateFormFields({
    app: APP,
    properties: {
      concurrent_posts: {
        type: 'SUBTABLE',
        code: 'concurrent_posts',
        fields: {
          cp_title: {
            type: 'DROP_DOWN',
            code: 'cp_title',
            label: title.label || '兼務役職',
            noLabel: title.noLabel,
            required: title.required,
            options: nextOpts,
            defaultValue: title.defaultValue || '',
          },
        },
      },
    },
  });
  await client.app.deployApp({ apps: [{ app: APP }] });
  await waitDeploy(client);

  const after = await client.app.getFormFields({ app: APP });
  const opts = Object.keys(
    after.properties.concurrent_posts?.fields?.cp_title?.options || {},
  ).sort();
  console.log('[595-cp-title] live options:', opts.join(' | '));
  console.log('[595-cp-title] DONE has室長=', opts.includes('室長'), 'has室員=', opts.includes('室員'));
}

main().catch((e) => {
  console.error('[595-cp-title] FAIL', e);
  process.exit(1);
});
