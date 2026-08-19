/**
 * App 714: v1.2 設置先フィールド 6 件を追加して deploy。
 * 正本: docs/plans/2026-08-19-715-pc-install-target-spec.md
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/software-ledger-714-add-pc-fields.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/software-ledger-714-add-pc-fields.mjs
 */
import {
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadFieldProperties,
} from './lib/software-ledger-kintone.mjs';

const APP = 714;
const NEW_CODES = [
  'install_target',
  'pc_674_id',
  'pc_name',
  'shared_terminal_name',
  'contact_name',
  'contact_dept',
];

function layoutCell(code, type) {
  return { type, code, size: { width: '200' } };
}

function appendLayoutRows(layout, properties) {
  const existing = new Set();
  function walk(nodes) {
    (nodes || []).forEach((n) => {
      if (n.type === 'ROW' && Array.isArray(n.fields)) {
        n.fields.forEach((f) => {
          if (f && f.code) existing.add(f.code);
        });
      }
      if (n.layout) walk(n.layout);
    });
  }
  walk(layout);
  const missing = NEW_CODES.filter((c) => properties[c] && !existing.has(c));
  missing.forEach((code) => {
    layout.push({
      type: 'ROW',
      fields: [layoutCell(code, properties[code].type)],
    });
  });
  return missing;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { baseUrl, headers } = getKintoneConfig();
  const allProps = loadFieldProperties();
  const want = {};
  NEW_CODES.forEach((c) => {
    if (!allProps[c]) throw new Error(`software-ledger-db-fields.json missing ${c}`);
    want[c] = allProps[c];
  });

  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const toAdd = {};
  NEW_CODES.forEach((c) => {
    if (cur.properties?.[c]) console.log(`[fields] skip exists: ${c}`);
    else toAdd[c] = want[c];
  });

  if (dryRun) {
    console.log('[fields] dry-run would POST', Object.keys(toAdd));
    return;
  }

  let revision = cur.revision;
  if (Object.keys(toAdd).length) {
    const j = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: APP, properties: toAdd }),
    });
    revision = j.revision;
    console.log(`[fields] POST ok revision=${revision} codes=${Object.keys(toAdd).join(',')}`);
  } else {
    console.log('[fields] nothing to add');
  }

  const layoutRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/layout.json?app=${APP}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const fieldsMeta = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${APP}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const addedLayout = appendLayoutRows(layoutRes.layout, fieldsMeta.properties || {});
  if (addedLayout.length) {
    const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/layout.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: APP, layout: layoutRes.layout }),
    });
    revision = put.revision;
    console.log(`[layout] PUT ok revision=${revision} added=${addedLayout.join(',')}`);
  } else {
    console.log('[layout] already contains new codes');
  }

  await deployApp(baseUrl, headers, APP);
  console.log(`[deploy] App ${APP} SUCCESS`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
