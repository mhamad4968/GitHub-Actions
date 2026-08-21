#!/usr/bin/env node
/** 776 既定ビュー「社員名簿」の左端に list_sort（表示順）を追加 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: {
    username: process.env.KINTONE_USERNAME,
    password: process.env.KINTONE_PASSWORD,
  },
});

const APP = 776;
const COLS = [
  'list_sort',
  'employee_no',
  'group_name',
  'dept_name',
  'user_name',
  'job_title',
  'mail',
];

const viewsResp = await client.app.getViews({ app: APP });
const views = viewsResp.views || {};
const name = Object.keys(views).find((n) => n === '社員名簿') || Object.keys(views)[0];
if (!name) {
  console.error('no views');
  process.exit(1);
}
const v = views[name];
console.log(
  JSON.stringify(
    {
      viewName: name,
      before: v.fields,
      type: v.type,
      sort: v.sort,
    },
    null,
    2,
  ),
);

const next = { ...views };
next[name] = {
  ...v,
  fields: COLS,
  sort: 'list_sort asc',
};

await client.app.updateViews({ app: APP, views: next });
await client.app.deployApp({ apps: [{ app: APP }] });

for (;;) {
  const st = await client.app.getDeployStatus({ apps: [APP] });
  const s = st.apps?.[0]?.status;
  console.log('deploy', s);
  if (s === 'SUCCESS' || s === 'FAIL') break;
  await new Promise((r) => setTimeout(r, 1500));
}
console.log('[776 view] list_sort leftmost DONE');
