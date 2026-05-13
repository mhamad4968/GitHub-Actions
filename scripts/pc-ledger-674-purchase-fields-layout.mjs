/**
 * App 674: 購入金額・購入先フィールドを購入日の直後へ配置。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-purchase-fields-layout.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-purchase-fields-layout.mjs
 */
import 'dotenv/config';

const APP = 674;
const ANCHOR_CODE = 'purchase_date';
const FIELD_CODES = ['purchase_amount', 'purchase_vendor', 'purchase_vendor_other'];

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' };
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  const ba = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  authHeaders.Authorization = ba;
  jsonHeaders.Authorization = ba;
}

function purchaseFieldsImmediatelyAfterAnchor(layout, anchorCode, orderedCodes) {
  function walk(arr) {
    if (!Array.isArray(arr)) return false;
    for (let i = 0; i < arr.length; i += 1) {
      const node = arr[i];
      if (node?.type === 'ROW' && Array.isArray(node.fields) && node.fields.some((f) => f && f.code === anchorCode)) {
        const seen = [];
        for (let j = i + 1; j < arr.length && seen.length < orderedCodes.length; j += 1) {
          const next = arr[j];
          if (next?.type !== 'ROW' || !Array.isArray(next.fields)) break;
          for (const f of next.fields) {
            if (f?.code) seen.push(f.code);
          }
        }
        return orderedCodes.every((code, idx) => seen[idx] === code);
      }
      if (node?.type === 'GROUP' && Array.isArray(node.layout) && walk(node.layout)) {
        return true;
      }
    }
    return false;
  }
  return walk(layout);
}

function insertRowsAfterAnchor(layout, anchorCode, orderedCodes, cells) {
  const rows = [];
  for (const code of orderedCodes) {
    if (!cells[code]) continue;
    rows.push({ type: 'ROW', fields: [cells[code]] });
  }
  if (!rows.length) return false;

  function walk(arr) {
    if (!Array.isArray(arr)) return false;
    for (let i = 0; i < arr.length; i += 1) {
      const node = arr[i];
      if (node?.type === 'ROW' && Array.isArray(node.fields) && node.fields.some((f) => f && f.code === anchorCode)) {
        arr.splice(i + 1, 0, ...rows);
        return true;
      }
      if (node?.type === 'GROUP' && Array.isArray(node.layout) && walk(node.layout)) {
        return true;
      }
    }
    return false;
  }

  if (walk(layout)) return true;
  layout.push(...rows);
  return true;
}

function stripFieldsFromLayout(nodes, codes) {
  const set = new Set(codes);
  const cells = {};
  let changed = false;

  function walk(arr) {
    if (!Array.isArray(arr)) return;
    for (const node of arr) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'ROW' && Array.isArray(node.fields)) {
        const next = [];
        for (const f of node.fields) {
          if (f && set.has(f.code)) {
            cells[f.code] = {
              type: f.type,
              code: f.code,
              size: f.size && typeof f.size === 'object' ? f.size : { width: '193' },
            };
            changed = true;
          } else {
            next.push(f);
          }
        }
        node.fields = next;
      }
      if (node.type === 'GROUP' && Array.isArray(node.layout)) {
        walk(node.layout);
      }
    }
  }

  walk(nodes);
  return { cells, changed };
}

function pruneEmptyRows(nodes) {
  if (!Array.isArray(nodes)) return nodes;
  const out = [];
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'GROUP' && Array.isArray(node.layout)) {
      node.layout = pruneEmptyRows(node.layout);
      out.push(node);
      continue;
    }
    if (node.type === 'ROW') {
      if (node.fields && node.fields.length > 0) out.push(node);
      continue;
    }
    out.push(node);
  }
  return out;
}

async function getPreviewLayout() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json?app=${APP}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET preview layout: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewLayout(revision, layout) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, revision, layout }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT preview layout: ${j.code} ${j.message} ${JSON.stringify(j.errors || j)}`);
  return j.revision;
}

async function deployPreview(revision) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ apps: [{ app: APP, revision }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`deploy: ${j.code} ${j.message}`);
}

async function waitDeploy() {
  for (let i = 0; i < 90; i++) {
    const u = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    u.searchParams.set('apps[0]', String(APP));
    const res = await fetch(u, { headers: authHeaders });
    const j = await res.json();
    const st = res.ok && j.apps?.[0] ? j.apps[0].status : null;
    if (st === 'SUCCESS') return;
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy status ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('deploy timeout');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const lay = await getPreviewLayout();
  let layout = JSON.parse(JSON.stringify(lay.layout));

  if (purchaseFieldsImmediatelyAfterAnchor(layout, ANCHOR_CODE, FIELD_CODES)) {
    console.log('674: 購入フィールドは既に購入日の直後に配置済み。スキップ。');
    return;
  }

  const { cells, changed } = stripFieldsFromLayout(layout, FIELD_CODES);
  if (!changed) {
    for (const code of FIELD_CODES) {
      cells[code] = {
        type: code === 'purchase_amount' ? 'NUMBER' : code === 'purchase_vendor' ? 'DROP_DOWN' : 'SINGLE_LINE_TEXT',
        code,
        size: { width: '193' },
      };
    }
  }

  insertRowsAfterAnchor(layout, ANCHOR_CODE, FIELD_CODES, cells);
  layout = pruneEmptyRows(layout);

  if (dryRun) {
    console.log(JSON.stringify({ layout }, null, 2));
    console.error('[674] dry-run: PUT していません');
    return;
  }

  const rev = await putPreviewLayout(lay.revision, layout);
  await deployPreview(rev);
  await waitDeploy();
  console.log(`674: 購入フィールド layout + preview deploy SUCCESS revision=${rev}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
