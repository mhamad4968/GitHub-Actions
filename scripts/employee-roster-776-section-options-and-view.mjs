#!/usr/bin/env node
/**
 * 776 部／室 DROP_DOWN に不足選択肢を追加し、一覧「社員名簿」で部署名の右隣に section_name を出す。
 * emp_id 不触。customize JS 変更なし（ビュー＋フォームのみ）。
 *
 * Usage:
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-776-section-options-and-view.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/employee-roster-776-section-options-and-view.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const APP = '776';

/** 浜田指示＋Excel既存分を含む必須選択肢 */
const REQUIRED_SECTIONS = [
  '第一工事部',
  '第二工事部',
  '第三工事部',
  '新幹線大規模改修工事準備室',
];

const VIEW_COLS = [
  'list_sort',
  'employee_no',
  'group_name',
  'dept_name',
  'section_name', // 部署名の右隣
  'user_name',
  'job_title',
  'mail',
];

async function waitDeploy(client) {
  for (let i = 0; i < 40; i++) {
    const st = await client.app.getDeployStatus({ apps: [APP] });
    const s = st.apps?.[0]?.status;
    console.log('[776] deploy', s);
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
  const field = form.properties.section_name;
  if (!field || field.type !== 'DROP_DOWN') {
    throw new Error('section_name is not DROP_DOWN');
  }
  const existing = new Set(Object.keys(field.options || {}));
  const toAdd = REQUIRED_SECTIONS.filter((s) => !existing.has(s));

  const viewsResp = await client.app.getViews({ app: APP });
  const views = viewsResp.views || {};
  const viewName =
    Object.keys(views).find((n) => n === '社員名簿') || Object.keys(views)[0];
  if (!viewName) throw new Error('no views');
  const v = views[viewName];
  const beforeFields = [...(v.fields || [])];
  const fieldsSame =
    beforeFields.length === VIEW_COLS.length &&
    beforeFields.every((f, i) => f === VIEW_COLS[i]);

  const summary = {
    at: new Date().toISOString(),
    apply: APPLY,
    sectionOptionsNow: [...existing].sort(),
    optionsToAdd: toAdd,
    viewName,
    fieldsBefore: beforeFields,
    fieldsAfter: VIEW_COLS,
    viewNeedsUpdate: !fieldsSame,
  };
  const outDir = path.join(ROOT, 'logs', 'employee-roster');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(
    outDir,
    `section-options-view-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  console.log('json=', outPath);

  if (!APPLY) {
    console.log('[section-options-view] DRY-RUN');
    return;
  }

  let needDeploy = false;

  if (toAdd.length) {
    const nextOpts = { ...(field.options || {}) };
    let maxIndex = Math.max(
      0,
      ...Object.values(nextOpts).map((o) => Number(o.index) || 0),
    );
    for (const label of toAdd) {
      maxIndex += 1;
      nextOpts[label] = { label, index: String(maxIndex) };
    }
    await client.app.updateFormFields({
      app: APP,
      properties: {
        section_name: {
          type: 'DROP_DOWN',
          code: 'section_name',
          label: field.label || '部／室',
          noLabel: field.noLabel,
          required: field.required,
          options: nextOpts,
          defaultValue: field.defaultValue || '',
        },
      },
    });
    console.log('[776] options added', toAdd.join(', '));
    needDeploy = true;
  } else {
    console.log('[776] options already include required set');
  }

  if (!fieldsSame) {
    const next = { ...views };
    next[viewName] = {
      ...v,
      fields: VIEW_COLS,
      sort: v.sort || 'list_sort asc',
    };
    await client.app.updateViews({ app: APP, views: next });
    console.log('[776] view fields updated:', VIEW_COLS.join(' > '));
    needDeploy = true;
  } else {
    console.log('[776] view already has section_name beside dept_name');
  }

  if (needDeploy) {
    await client.app.deployApp({ apps: [{ app: APP }] });
    await waitDeploy(client);
  }
  console.log('[section-options-view] DONE');
}

main().catch((e) => {
  console.error('[section-options-view] FAIL', e);
  process.exit(1);
});
